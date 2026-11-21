"use strict";

const { getSupabase } = require("../db");
const { businessYmd, addBusinessDays } = require("../lib/hotelBusinessDate");
const { normalizeItems, getClientById } = require("./salesService");
const { EXPENSE_CATEGORIES, listOwnerExpenses } = require("./ownerExpenseService");
const { listStockForOwner } = require("./stockService");

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function startOfBusinessDay(ymd) {
  const utcGuess = new Date(`${ymd}T00:00:00Z`);
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(utcGuess));
  return new Date(utcGuess.getTime() - hour * 60 * 60000);
}

function belgradeHour(iso) {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  const n = Number(h);
  return n >= 0 && n < 24 ? n : 0;
}

function belgradeYmd(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

async function fetchClosedSales(clientId, fromIso, toIso) {
  const db = getSupabase();
  const rows = [];
  const page = 1000;
  for (let start = 0; start < 5000; start += page) {
    const { data, error } = await db
      .from("sales_orders")
      .select("id, total, items_json, closed_at, waiter_name")
      .eq("client_id", clientId)
      .eq("status", "closed")
      .gte("closed_at", fromIso)
      .lt("closed_at", toIso)
      .order("closed_at", { ascending: true })
      .range(start, start + page - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < page) break;
  }
  return rows.map((row) => ({
    ...row,
    total: Number(row.total) || 0,
    items: normalizeItems(row.items_json),
  }));
}

async function vatForDay(clientId, fromIso, toIso) {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from("fiscal_receipts")
      .select("total_vat, status")
      .eq("client_id", clientId)
      .gte("printed_at", fromIso)
      .lt("printed_at", toIso);
    if (error) return 0;
    return money((data || [])
      .filter((row) => row.status !== "failed")
      .reduce((sum, row) => sum + (Number(row.total_vat) || 0), 0));
  } catch {
    return 0;
  }
}

async function expensesForDay(clientId, today) {
  try {
    const rows = await listOwnerExpenses(clientId, { from: today, to: today, limit: 500 });
    const map = new Map();
    for (const row of rows) {
      const category = EXPENSE_CATEGORIES[row.category] || row.category || "Tjetër";
      const cur = map.get(category) || { category, total: 0, vat: 0 };
      cur.total += Number(row.amount) || 0;
      map.set(category, cur);
    }
    return [...map.values()]
      .map((row) => ({
        category: row.category,
        total: money(row.total),
        vat: 0,
      }))
      .sort((a, b) => a.category.localeCompare(b.category, "sq"));
  } catch {
    return [];
  }
}

async function lowStock(clientId) {
  try {
    const stock = await listStockForOwner(clientId);
    return (stock.items || [])
      .filter((it) => {
        if (it.active === false || !it.track_stock) return false;
        const qty = Number(it.stock_quantity);
        if (!Number.isFinite(qty)) return false;
        const threshold = Number(it.stock_alert_threshold) || 0;
        return qty <= 0 || (threshold > 0 && qty <= threshold);
      })
      .map((it) => ({
        id: it.local_id || it.id,
        name: it.name,
        category: it.category,
        stock_qty: Number(it.stock_quantity) || 0,
        low_stock_threshold: Number(it.stock_alert_threshold) || 0,
      }))
      .sort((a, b) => a.stock_qty - b.stock_qty || String(a.name).localeCompare(String(b.name), "sq"));
  } catch {
    return [];
  }
}

async function menuCategories(clientId) {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from("pos_menu_items")
      .select("name, category")
      .eq("client_id", clientId);
    if (error) return new Map();
    return new Map((data || []).map((row) => [
      String(row.name || "").trim().toLowerCase(),
      String(row.category || "").trim() || "Të tjera",
    ]));
  } catch {
    return new Map();
  }
}

async function getPasqyra(clientId) {
  const today = businessYmd();
  const from30 = addBusinessDays(today, -29);
  const tomorrow = addBusinessDays(today, 1);
  const fromIso = startOfBusinessDay(from30).toISOString();
  const todayIso = startOfBusinessDay(today).toISOString();
  const toIso = startOfBusinessDay(tomorrow).toISOString();

  const [sales, vatOutput, expenseBook, lowStockItems, cats, client] = await Promise.all([
    fetchClosedSales(clientId, fromIso, toIso),
    vatForDay(clientId, todayIso, toIso),
    expensesForDay(clientId, today),
    lowStock(clientId),
    menuCategories(clientId),
    getClientById(clientId).catch(() => null),
  ]);

  const todaySales = sales.filter((row) => row.closed_at && row.closed_at >= todayIso);
  const totalSales = money(todaySales.reduce((sum, row) => sum + row.total, 0));
  const orderCount = todaySales.length;
  const average = orderCount ? money(totalSales / orderCount) : 0;

  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0 }));
  for (const row of todaySales) {
    byHour[belgradeHour(row.closed_at)].total += row.total;
  }
  for (const row of byHour) row.total = money(row.total);

  const dailyMap = new Map();
  for (let i = 0; i < 30; i += 1) {
    dailyMap.set(addBusinessDays(from30, i), 0);
  }
  for (const row of sales) {
    const key = belgradeYmd(row.closed_at);
    if (!dailyMap.has(key)) continue;
    dailyMap.set(key, dailyMap.get(key) + row.total);
  }
  const dailyLast30 = [...dailyMap.entries()].map(([date, total]) => ({
    date,
    total: money(total),
  }));

  const categoryTotals = {};
  const productStats = {};
  for (const row of todaySales) {
    const lines = [];
    let raw = 0;
    for (const it of row.items) {
      const name = String(it.name || "").trim();
      if (!name) continue;
      const qty = Number(it.quantity) || 1;
      const rev = (Number(it.price) || 0) * qty;
      raw += rev;
      if (!productStats[name]) productStats[name] = { name, orders: 0, revenue: 0 };
      const cat = cats.get(name.toLowerCase()) || it.category || "Të tjera";
      lines.push({ name, qty, rev, cat });
    }
    const scale = raw ? row.total / raw : 0;
    for (const line of lines) {
      categoryTotals[line.cat] = (categoryTotals[line.cat] || 0) + line.rev * scale;
      productStats[line.name].orders += line.qty * scale;
      productStats[line.name].revenue += line.rev * scale;
    }
  }
  const byCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total: money(total) }))
    .sort((a, b) => b.total - a.total);
  const drift = money(totalSales - byCategory.reduce((sum, row) => sum + row.total, 0));
  if (drift && byCategory.length) {
    byCategory[0].total = money(byCategory[0].total + drift);
  }
  const topProducts = Object.values(productStats)
    .filter((p) => Math.abs(p.revenue) >= 0.005 || Math.abs(p.orders) >= 0.005)
    .map((p) => ({
      name: p.name,
      orders: money(p.orders),
      revenue: money(p.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const expensesTotal = money(expenseBook.reduce((sum, row) => sum + row.total, 0));

  return {
    today,
    business_name: client?.emri || "",
    totalSales,
    vat_output: vatOutput,
    orderCount,
    average,
    expenses_total: expensesTotal,
    expense_book: expenseBook,
    salesByHour: byHour,
    dailyLast30,
    byCategory,
    topProducts,
    lowStockItems,
    lowStockCount: lowStockItems.length,
    expiryItems: [],
    expiryCount: 0,
    register: {
      show_register_labels: false,
      registers: [],
      sales_today_total: totalSales,
      sales_today_by_register: [],
      shifts_in_cloud: false,
    },
  };
}

function belgradeInstant(ymd, hms) {
  const base = startOfBusinessDay(String(ymd).slice(0, 10));
  const parts = String(hms || "00:00:00").split(":");
  const hh = Number(parts[0]) || 0;
  const mm = Number(parts[1]) || 0;
  const ss = Number(parts[2]) || 0;
  return new Date(base.getTime() + ((hh * 3600 + mm * 60 + ss) * 1000));
}

function parseDitariBound(raw, fallbackYmd, fallbackTime) {
  const s = String(raw || "").trim();
  if (!s) return belgradeInstant(fallbackYmd, fallbackTime);
  if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const withTime = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)/);
  if (withTime) {
    const hms = withTime[2].length === 5 ? `${withTime[2]}:00` : withTime[2];
    return belgradeInstant(withTime[1], hms);
  }
  const day = s.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (day) return belgradeInstant(day[1], fallbackTime);
  return belgradeInstant(fallbackYmd, fallbackTime);
}

function belgradeClock(iso) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const g = (type) => parts.find((p) => p.type === type)?.value || "00";
  return {
    date: `${g("year")}-${g("month")}-${g("day")}`,
    time: `${g("hour")}:${g("minute")}:${g("second")}`,
  };
}

function registerName(deviceId, role) {
  const device = String(deviceId || "").trim().toUpperCase();
  const m = /^arka(\d+)$/.exec(String(role || "").trim().toLowerCase());
  if (m) return `Arka ${Number(m[1])}`;
  if (device === "WEB-WAITER") return "Arka (shfletues)";
  if (device === "WEB-KIOSK") return "QR";
  if (device === "WEB-PUBLIC") return "Faqja";
  if (!device) return "—";
  if (/^[0-9A-F]{6,}$/.test(device)) return "Arka";
  return device;
}

function paymentLabel(method) {
  const m = String(method || "cash").trim().toLowerCase();
  if (m === "karte" || m === "kartë" || m === "card" || m === "kart") return "Kartë";
  if (m === "mixed") return "Cash + Kartë";
  return "Cash";
}

function isCardPay(method) {
  const m = String(method || "").trim().toLowerCase();
  return m === "karte" || m === "kartë" || m === "card" || m === "kart";
}

function vatSplit(total, items) {
  const gross = money(total);
  if (!(gross > 0)) return { net: 0, vat: 0 };
  const lines = [];
  let raw = 0;
  for (const it of items || []) {
    const g = (Number(it.quantity) || 0) * (Number(it.price) || 0);
    if (!(g > 0)) continue;
    const rateNum = Number(it.vat_rate ?? it.tvsh);
    const rate = rateNum === 0 || rateNum === 8 || rateNum === 18 ? rateNum : 18;
    lines.push({ g, rate });
    raw += g;
  }
  if (!lines.length) {
    const net = money(gross / 1.18);
    return { net, vat: money(gross - net) };
  }
  const scale = raw > 0 ? gross / raw : 1;
  let net = 0;
  for (const line of lines) {
    const g = line.g * scale;
    const lineNet = line.rate > 0 ? g / (1 + line.rate / 100) : g;
    net += lineNet;
  }
  net = money(net);
  return { net, vat: money(gross - net) };
}

async function loadRegisterMap(clientId) {
  const map = new Map();
  try {
    const db = getSupabase();
    const { data: lics, error } = await db.from("licenses").select("id").eq("client_id", clientId);
    if (error || !lics?.length) return map;
    const { data, error: termErr } = await db
      .from("license_terminals")
      .select("device_id, terminal_role")
      .in("license_id", lics.map((l) => l.id));
    if (termErr) return map;
    for (const row of data || []) {
      const id = String(row.device_id || "").trim().toUpperCase();
      if (!id) continue;
      map.set(id, registerName(id, row.terminal_role));
    }
  } catch {
    return map;
  }
  return map;
}

async function fetchJournalSales(clientId, fromIso, toIso) {
  const db = getSupabase();
  const rows = [];
  const page = 1000;
  const withPay =
    "id, license_id, table_number, waiter_name, items_json, total, closed_at, status, device_id, payment_method";
  const noPay =
    "id, license_id, table_number, waiter_name, items_json, total, closed_at, status, device_id";
  let select = withPay;
  for (let start = 0; start < 5000; start += page) {
    const { data, error } = await db
      .from("sales_orders")
      .select(select)
      .eq("client_id", clientId)
      .in("status", ["closed", "cancelled"])
      .gte("closed_at", fromIso)
      .lte("closed_at", toIso)
      .order("closed_at", { ascending: false })
      .range(start, start + page - 1);
    if (error && select === withPay && /payment_method/i.test(error.message || "")) {
      select = noPay;
      start -= page;
      continue;
    }
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < page) break;
  }
  return rows;
}

async function getDitari(clientId, query = {}) {
  const today = businessYmd();
  let fromDate = parseDitariBound(query.from, today, "00:00:00");
  let toDate = parseDitariBound(query.to, today, "23:59:59");
  if (fromDate.getTime() > toDate.getTime()) {
    const swap = fromDate;
    fromDate = toDate;
    toDate = swap;
  }
  toDate.setMilliseconds(999);
  const fromIso = fromDate.toISOString();
  const toIso = toDate.toISOString();
  const wantRegister = String(query.register || "").trim().toUpperCase();
  const [rows, registers] = await Promise.all([
    fetchJournalSales(clientId, fromIso, toIso),
    loadRegisterMap(clientId),
  ]);
  const entries = [];
  for (const row of rows) {
    const device = String(row.device_id || "").trim().toUpperCase();
    if (wantRegister && device !== wantRegister) continue;
    const cancelled = String(row.status || "") === "cancelled";
    const items = normalizeItems(row.items_json);
    const rawItems = Array.isArray(row.items_json)
      ? row.items_json
      : (() => {
        try { return JSON.parse(row.items_json || "[]"); } catch { return []; }
      })();
    const paidTotal = cancelled ? 0 : money(row.total);
    const split = cancelled ? { net: 0, vat: 0 } : vatSplit(paidTotal, rawItems.length ? rawItems : items);
    const clock = row.closed_at ? belgradeClock(row.closed_at) : { date: today, time: "00:00:00" };
    if (!registers.has(device) && device) registers.set(device, registerName(device, ""));
    entries.push({
      date: clock.date,
      time: clock.time,
      table_number: row.table_number,
      device_id: device,
      register_name: registers.get(device) || "—",
      waiter_name: row.waiter_name || "—",
      payment_method: row.payment_method || "cash",
      payment_label: paymentLabel(row.payment_method),
      item_count: items.reduce((n, it) => n + (Number(it.quantity) || 0), 0),
      artikujt: items.map((it) => `${it.quantity}× ${it.name}`).join(", "),
      items: items.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price })),
      pa_tvsh: split.net,
      tvsh: split.vat,
      total: paidTotal,
      status: cancelled ? "cancelled" : "paid",
    });
  }
  const fromYmd = belgradeClock(fromIso).date;
  const toYmd = belgradeClock(toIso).date;
  try {
    const { listOwnerExpenses, EXPENSE_CATEGORIES } = require("./ownerExpenseService");
    const expenses = await listOwnerExpenses(clientId, { from: fromYmd, to: toYmd, limit: 500 });
    for (const exp of expenses) {
      const clock = exp.created_at ? belgradeClock(exp.created_at) : { date: String(exp.expense_date || fromYmd).slice(0, 10), time: "00:00:00" };
      const amount = money(exp.amount);
      entries.push({
        date: String(exp.expense_date || clock.date).slice(0, 10),
        time: clock.time,
        table_number: "—",
        device_id: "",
        register_name: "—",
        waiter_name: EXPENSE_CATEGORIES[exp.category] || exp.vendor_name || "Shpenzim",
        payment_method: "",
        payment_label: "Shpenzim",
        item_count: 0,
        artikujt: exp.description || exp.vendor_name || "Shpenzim",
        items: [],
        pa_tvsh: amount,
        tvsh: 0,
        total: amount,
        status: "Shpenzim",
      });
    }
  } catch {
  }
  entries.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const paid = entries.filter((e) => e.status === "paid");
  const byMap = new Map();
  for (const e of paid) {
    const key = e.device_id || "";
    if (!byMap.has(key)) {
      byMap.set(key, {
        device_id: e.device_id,
        register_name: e.register_name,
        order_count: 0,
        cash: 0,
        card: 0,
        total: 0,
      });
    }
    const b = byMap.get(key);
    b.order_count += 1;
    b.total = money(b.total + e.total);
    if (isCardPay(e.payment_method)) b.card = money(b.card + e.total);
    else b.cash = money(b.cash + e.total);
  }
  const fromClock = belgradeClock(fromIso);
  const toClock = belgradeClock(toIso);
  const registerList = [...registers.entries()]
    .map(([device_id, name]) => ({ device_id, register_name: name }))
    .sort((a, b) => a.register_name.localeCompare(b.register_name, "sq"));
  const byRegister = [...byMap.values()]
    .sort((a, b) => String(a.register_name).localeCompare(String(b.register_name), "sq"));
  const totalSales = money(paid.reduce((s, e) => s + e.total, 0));
  const totalCash = money(paid.filter((e) => !isCardPay(e.payment_method)).reduce((s, e) => s + e.total, 0));
  const totalKarte = money(paid.filter((e) => isCardPay(e.payment_method)).reduce((s, e) => s + e.total, 0));
  const tablesServed = new Set(paid.map((e) => e.table_number).filter((n) => n != null && n !== "" && n !== "—")).size;
  const periodLabel = `${fromClock.date} ${fromClock.time} — ${toClock.date} ${toClock.time}`;
  const todayLabel = new Intl.DateTimeFormat("sq-AL", {
    timeZone: "Europe/Belgrade",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  let activity = [];
  try {
    const { listOwnerActivity } = require("./ownerAuditService");
    const rows = await listOwnerActivity(clientId, { limit: 300 });
    activity = rows
      .filter((row) => {
        const t = new Date(row.created_at).getTime();
        return t >= fromDate.getTime() && t <= toDate.getTime();
      })
      .map((row) => {
        const clock = belgradeClock(row.created_at);
        return {
          created_at: `${clock.date} ${clock.time}`,
          user_name: row.actor_email || "pronari",
          user_role: "pronari",
          action: row.action || "—",
          detail: row.target_label || "",
        };
      });
  } catch {
    activity = [];
  }
  return {
    from: fromIso,
    to: toIso,
    dateFrom: fromClock.date,
    dateTo: toClock.date,
    timeFrom: fromClock.time,
    timeTo: toClock.time,
    period_label: periodLabel,
    periodLabel,
    today: todayLabel,
    sales_count: paid.length,
    orderCount: paid.length,
    total: totalSales,
    totalSales,
    totalCash,
    totalKarte,
    totalTjera: 0,
    tablesServed,
    show_register_labels: registers.size > 1,
    by_register: byRegister,
    byRegister,
    registers: registerList,
    entries,
    activity,
    shifts: [],
    shift_count: 0,
  };
}

function buildDitariPreviewHtml(ditari, businessName) {
  const escHtml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const euro = (n) => `${(Number(n) || 0).toFixed(2)} EUR`;
  const map = new Map();
  for (const entry of ditari.entries || []) {
    if (entry.status !== "paid") continue;
    for (const it of entry.items || []) {
      const name = String(it.name || "").trim();
      if (!name) continue;
      const qty = Number(it.quantity) || 1;
      const prev = map.get(name) || { name, quantity: 0, revenue: 0 };
      prev.quantity += qty;
      prev.revenue += (Number(it.price) || 0) * qty;
      map.set(name, prev);
    }
  }
  const aggregated = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "sq"));
  const itemsBlock = aggregated.length
    ? aggregated.map((row) => `<div class="receipt-item"><span>${row.quantity}× ${escHtml(row.name)}</span><span>${euro(row.revenue)}</span></div>`).join("")
    : `<div class="receipt-meta">Nuk ka artikuj të shitur.</div>`;
  const now = belgradeClock(new Date().toISOString());
  return `
    <div class="receipt-rule">================================</div>
    <div class="receipt-name">${escHtml(businessName || "Kafene")}</div>
    <div class="receipt-rule">================================</div>
    <div class="receipt-body">
      <div class="receipt-meta receipt-invoice">RAPORT DITARI</div>
      <div class="receipt-rule">--------------------------------</div>
      <div class="receipt-meta">Periudha: ${escHtml(ditari.periodLabel)}</div>
      <div class="receipt-meta">Nga: ${escHtml(ditari.dateFrom)} ${escHtml(ditari.timeFrom || "00:00:00")}</div>
      <div class="receipt-meta">Deri: ${escHtml(ditari.dateTo)} ${escHtml(ditari.timeTo || "23:59:59")}</div>
      <div class="receipt-rule">--------------------------------</div>
      <div class="receipt-item"><span>Shitjet totale</span><span>${euro(ditari.totalSales)}</span></div>
      <div class="receipt-item"><span>Cash</span><span>${euro(ditari.totalCash)}</span></div>
      <div class="receipt-item"><span>Kartë</span><span>${euro(ditari.totalKarte)}</span></div>
      <div class="receipt-item"><span>Porosi</span><span>${ditari.orderCount}</span></div>
      <div class="receipt-item"><span>Tavolina</span><span>${ditari.tablesServed}</span></div>
      <div class="receipt-rule">================================</div>
      <div class="receipt-meta receipt-invoice">PËRMBLEDHJA E SHITJEVE</div>
      <div class="receipt-rule">--------------------------------</div>
      ${itemsBlock}
      <div class="receipt-rule">--------------------------------</div>
      <div class="receipt-total"><span>TOTALI PERiUDHËS:</span><span>${euro(ditari.totalSales)}</span></div>
      <div class="receipt-rule">================================</div>
      <div class="receipt-meta">Gjeneruar: ${now.date} ${now.time}</div>
      <div class="receipt-thanks">Faleminderit!</div>
    </div>`;
}

function ymdInRange(iso, from, to) {
  if (!iso) return false;
  const day = belgradeYmd(iso);
  return day >= from && day <= to;
}

async function listNderrimet(clientId, query = {}) {
  const today = businessYmd();
  const from = String(query.from || today).slice(0, 10);
  const to = String(query.to || from).slice(0, 10);
  const db = getSupabase();
  const { data, error } = await db
    .from("waiter_shifts")
    .select("*")
    .eq("client_id", clientId)
    .limit(500);
  if (error) {
    const msg = String(error.message || "");
    if (error.code === "PGRST205" || /waiter_shifts|schema cache|does not exist|client_id/i.test(msg)) {
      return { from, to, shifts: [], count: 0 };
    }
    throw error;
  }
  const shifts = (data || [])
    .filter((row) => ymdInRange(row.opened_at, from, to) || ymdInRange(row.closed_at, from, to))
    .map((row) => {
      const closed = String(row.closed_at || "").trim();
      return {
        waiter_name: row.waiter_name || row.staff_name || "—",
        is_open: !closed,
        opened_at: row.opened_at || null,
        closed_at: closed || null,
        opening_cash: row.opening_cash != null ? money(row.opening_cash) : 0,
        cash_sales_total: row.cash_sales_total != null ? money(row.cash_sales_total) : 0,
        card_sales_total: row.card_sales_total != null ? money(row.card_sales_total) : 0,
        expected_closing_cash: row.expected_closing_cash != null ? money(row.expected_closing_cash) : null,
        closing_cash_actual: row.closing_cash_actual != null ? money(row.closing_cash_actual) : null,
        cash_difference: row.cash_difference != null ? money(row.cash_difference) : null,
        handed_over_to_name: row.handed_over_to_name || null,
        handover_status: row.handover_status || null,
      };
    })
    .sort((a, b) => String(b.closed_at || b.opened_at || "").localeCompare(String(a.closed_at || a.opened_at || "")));
  return { from, to, shifts, count: shifts.length };
}

async function getStoku(clientId) {
  const { listStockForOwner } = require("./stockService");
  const stock = await listStockForOwner(clientId);
  const items = (stock.items || []).map((it) => ({
    local_id: it.local_id,
    name: it.name,
    category: it.category,
    price: money(it.price),
    active: it.active !== false,
    track_stock: Boolean(it.track_stock),
    stock_quantity: it.stock_quantity == null ? null : money(it.stock_quantity),
    stock_alert_threshold: Number(it.stock_alert_threshold) || 0,
    stock_status: it.stock_status || "unlimited",
  }));
  const categories = [...new Set(items.map((it) => it.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "sq"));
  let ingredients = [];
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from("ingredients")
      .select("name, unit, quantity, min_quantity, cost_per_unit")
      .eq("restaurant_id", clientId)
      .order("name");
    if (!error) {
      ingredients = (data || []).map((row) => ({
        name: row.name || "",
        unit: row.unit || "",
        quantity: money(row.quantity),
        min_quantity: money(row.min_quantity),
        cost_per_unit: money(row.cost_per_unit),
      }));
    }
  } catch {
  }
  const tracked = items.filter((it) => it.track_stock);
  const withStock = tracked.filter((it) => Number(it.stock_quantity) > 0).length;
  const zeroStock = tracked.filter((it) => !(Number(it.stock_quantity) > 0)).length;
  const low = items.filter((it) => it.stock_status === "low" || it.stock_status === "out");
  return {
    items,
    categories,
    ingredients,
    low,
    summary: {
      ...(stock.summary || {}),
      with_stock: withStock,
      zero_stock: zeroStock,
      untracked: items.length - tracked.length,
    },
  };
}

function vatRateLabel(code) {
  const c = String(code || "A").trim().toUpperCase();
  if (c === "A" || c === "18") return "18%";
  if (c === "B" || c === "8") return "8%";
  if (c === "C" || c === "0") return "0%";
  if (c === "D") return "përjashtuar";
  if (c === "E") return "tjetër";
  return c;
}

async function getProduktet(clientId) {
  const db = getSupabase();
  const [itemsRes, catsRes] = await Promise.all([
    db
      .from("pos_menu_items")
      .select("local_id, name, category, price, active, barcode, sku, vat_category, description, track_stock, stock_quantity, stock_alert_threshold")
      .eq("client_id", clientId)
      .order("name"),
    db
      .from("pos_categories")
      .select("name, sort_order, route")
      .eq("client_id", clientId)
      .order("sort_order"),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  const items = (itemsRes.data || []).map((row) => ({
    local_id: row.local_id,
    name: row.name || "",
    category: row.category || "",
    price: money(row.price),
    active: row.active !== false,
    barcode: String(row.barcode || "").trim(),
    sku: String(row.sku || "").trim(),
    vat_category: row.vat_category || "A",
    vat: vatRateLabel(row.vat_category),
    description: String(row.description || "").trim().slice(0, 2000),
    track_stock: Boolean(row.track_stock),
    stock_quantity: row.stock_quantity == null ? null : money(row.stock_quantity),
    stock_alert_threshold: Number(row.stock_alert_threshold) || 0,
    unit: "EA",
  }));
  const present = new Set(items.map((it) => it.category).filter(Boolean));
  const categories = [];
  for (const row of catsRes.error ? [] : (catsRes.data || [])) {
    const name = String(row.name || "").trim();
    if (!name || !present.has(name) || categories.some((c) => c.name === name)) continue;
    categories.push({
      name,
      route: row.route === "kitchen" ? "kitchen" : "bar",
      route_label: row.route === "kitchen" ? "Ushqim (kuzhinë)" : "Pije (banak)",
    });
  }
  for (const name of present) {
    if (!categories.some((c) => c.name === name)) {
      categories.push({ name, route: "", route_label: "" });
    }
  }
  return {
    read_only: true,
    items,
    categories,
    active_count: items.filter((it) => it.active).length,
    inactive_count: items.filter((it) => !it.active).length,
  };
}

async function listFurnitoret(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("suppliers")
    .select("name, phone, email, address, nui, vat_number, note")
    .eq("client_id", clientId)
    .limit(500);
  if (error) {
    const msg = String(error.message || "");
    if (error.code === "PGRST205" || msg.includes("Could not find the table")) {
      return { suppliers: [], count: 0, read_only: true };
    }
    throw error;
  }
  const suppliers = (data || []).map((row) => ({
    name: String(row.name || "").trim(),
    phone: String(row.phone || "").trim(),
    email: String(row.email || "").trim(),
    address: String(row.address || "").trim(),
    nui: String(row.nui || "").trim(),
    vat_number: String(row.vat_number || "").trim(),
    note: String(row.note || "").trim(),
    purchased: 0,
    paid: 0,
    balance: 0,
  })).filter((row) => row.name);
  suppliers.sort((a, b) => a.name.localeCompare(b.name, "sq"));
  return { suppliers, count: suppliers.length, read_only: true };
}

module.exports = { getPasqyra, getDitari, buildDitariPreviewHtml, listNderrimet, getStoku, getProduktet, getKategorite, listFurnitoret };

async function getKategorite(clientId) {
  const db = getSupabase();
  const [catsRes, itemsRes] = await Promise.all([
    db
      .from("pos_categories")
      .select("name, sort_order, route")
      .eq("client_id", clientId)
      .order("sort_order"),
    db
      .from("pos_menu_items")
      .select("category, active")
      .eq("client_id", clientId),
  ]);
  if (catsRes.error) throw catsRes.error;
  const counts = new Map();
  for (const row of itemsRes.error ? [] : (itemsRes.data || [])) {
    const name = String(row.category || "").trim();
    if (!name) continue;
    const cur = counts.get(name) || { products: 0, active_products: 0 };
    cur.products += 1;
    if (row.active !== false) cur.active_products += 1;
    counts.set(name, cur);
  }
  const categories = (catsRes.data || [])
    .map((row) => {
      const name = String(row.name || "").trim();
      const route = row.route === "kitchen" ? "kitchen" : "bar";
      const count = counts.get(name) || { products: 0, active_products: 0 };
      return {
        name,
        sort_order: Number(row.sort_order) || 0,
        route,
        route_label: route === "kitchen" ? "Ushqim (kuzhinë)" : "Pije (banak)",
        products: count.products,
        active_products: count.active_products,
      };
    })
    .filter((row) => row.name)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "sq"));
  return {
    read_only: true,
    categories,
    count: categories.length,
  };
}
