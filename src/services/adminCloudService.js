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

module.exports = { getPasqyra };
