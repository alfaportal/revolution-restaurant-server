const { getSupabase } = require("../db");
const { arkaDeviceId } = require("./arkaService");

const WIDTH = 42;
const CLAIM_MS = 15000;
const UNCLAIMED = "2000-01-01T00:00:00.000Z";

function money(n) {
  return (Number(n) || 0).toFixed(2);
}

function center(text, width) {
  const s = String(text || "").slice(0, width);
  const gap = Math.max(0, width - s.length);
  const left = Math.floor(gap / 2);
  return `${" ".repeat(left)}${s}`;
}

function itemLine(item, width) {
  const qty = Number(item.quantity) || 1;
  const price = Number(item.price) || 0;
  const tail = `${qty}x  ${money(price)}  =  ${money(price * qty)}`;
  const nameMax = Math.max(6, width - tail.length - 1);
  let name = String(item.name || "").trim();
  if (name.length > nameMax) name = `${name.slice(0, Math.max(4, nameMax - 1))}...`;
  const gap = Math.max(1, width - name.length - tail.length);
  return `${name}${" ".repeat(gap)}${tail}`;
}

function pair(label, value, width) {
  const v = String(value || "");
  const labelMax = Math.max(4, width - v.length - 1);
  let l = String(label || "").trim();
  if (l.length > labelMax) l = `${l.slice(0, Math.max(3, labelMax - 1))}...`;
  const gap = Math.max(1, width - l.length - v.length);
  return `${l}${" ".repeat(gap)}${v}`;
}

function paymentLabel(method) {
  const p = String(method || "").trim().toLowerCase();
  if (p === "cash") return "KESH";
  if (p === "karte" || p === "card") return "Kartë";
  return String(method || "");
}

function whenText(iso) {
  const d = iso ? new Date(iso) : new Date();
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

function encodeCp1252(str) {
  const cleaned = String(str || "")
    .normalize("NFC")
    .replace(/€/g, "EUR")
    .replace(/…/g, "...")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
  return Buffer.from(cleaned, "latin1");
}

function buildEscPosReceipt(text) {
  const body = String(text || "").replace(/\r\n/g, "\n");
  const content = body.endsWith("\n") ? body : `${body}\n`;
  return Buffer.concat([
    Buffer.from([0x1b, 0x40]),
    Buffer.from([0x1b, 0x74, 16]),
    encodeCp1252(content),
    Buffer.from([0x1b, 0x64, 3]),
    Buffer.from([0x1d, 0x56, 0x42, 0x00]),
  ]);
}

function receiptText(info) {
  const w = WIDTH;
  const line = "-".repeat(w);
  const rows = [];
  if (info.business) rows.push(center(info.business, w));
  rows.push(center(whenText(info.at), w));
  rows.push(line);
  if (info.kind === "order") {
    rows.push(center("POROSI", w));
    rows.push(center("(jo fature perfundimtare)", w));
  }
  if (info.table) rows.push(`Tavolina: T${info.table}`);
  if (info.staff) rows.push(pair("Arka:", info.staff, w));
  rows.push(line);
  for (const item of info.items || []) rows.push(itemLine(item, w));
  rows.push(line);
  rows.push(pair("TOTALI:", `${money(info.total)} EUR`, w));
  if (info.kind !== "order" && info.payment) rows.push(pair("Pagesa:", paymentLabel(info.payment), w));
  if (info.fiscalNumber) rows.push(pair("Nr fiskal:", String(info.fiscalNumber), w));
  if (info.nuikf) rows.push(pair("NUIKF:", String(info.nuikf), w));
  rows.push(line);
  rows.push(center("Faleminderit!", w));
  return rows.join("\n");
}

async function queueArkaPrint(clientId, staff, body, businessName) {
  const db = getSupabase();
  const saleId = String(body?.sale_id || "").trim();
  if (!saleId) {
    const err = new Error("Shitja mungon.");
    err.status = 400;
    throw err;
  }
  const { data: sale, error } = await db
    .from("sales_orders")
    .select("id, items_json, total, payment_method, table_number, ordered_at, waiter_name")
    .eq("id", saleId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!sale) {
    const err = new Error("Shitja nuk u gjet.");
    err.status = 404;
    throw err;
  }
  const kind = body?.kind === "order" ? "order" : "sale";
  let storedItems = sale.items_json;
  if (typeof storedItems === "string") {
    try { storedItems = JSON.parse(storedItems); } catch (err) { storedItems = []; }
  }
  const sentItems = Array.isArray(body?.items) && body.items.length
    ? body.items
    : (Array.isArray(storedItems) ? storedItems : []);
  const slipTotal = kind === "order"
    ? sentItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
    : sale.total;
  const text = receiptText({
    kind,
    business: businessName || "",
    at: body?.at || sale.ordered_at,
    table: sale.table_number,
    staff: staff?.name || sale.waiter_name || "",
    items: sentItems,
    total: slipTotal,
    payment: sale.payment_method,
    fiscalNumber: body?.fiscal_number || "",
    nuikf: body?.nuikf || "",
  });
  const deviceId = arkaDeviceId(staff.id);
  const { data, error: insErr } = await db
    .from("print_queue")
    .insert({
      business_id: clientId,
      device_id: deviceId,
      receipt_data: buildEscPosReceipt(text).toString("base64"),
      status: "pending",
      updated_at: UNCLAIMED,
    })
    .select("id, device_id, status")
    .single();
  if (insErr) throw new Error(insErr.message || "Printimi nuk u radhit.");
  return { id: data.id, device_id: data.device_id, status: data.status };
}

async function pollPrintJobs(clientId, deviceId) {
  const db = getSupabase();
  const cutoff = new Date(Date.now() - CLAIM_MS).toISOString();
  const { data, error } = await db
    .from("print_queue")
    .select("id, receipt_data, updated_at")
    .eq("business_id", clientId)
    .eq("device_id", deviceId)
    .eq("status", "pending")
    .lt("updated_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(3);
  if (error) throw error;
  const jobs = [];
  const now = new Date().toISOString();
  for (const row of data || []) {
    const { data: claimed } = await db
      .from("print_queue")
      .update({ updated_at: now })
      .eq("id", row.id)
      .eq("business_id", clientId)
      .eq("status", "pending")
      .eq("updated_at", row.updated_at)
      .select("id")
      .maybeSingle();
    if (claimed) jobs.push({ id: row.id, receipt_data: row.receipt_data });
  }
  return jobs;
}

async function reportPrintStatus(clientId, body) {
  const id = String(body?.id || "").trim();
  const status = body?.status === "printed" || body?.status === "failed" ? body.status : "";
  if (!id || !status) {
    const err = new Error("Statusi i printimit mungon.");
    err.status = 400;
    throw err;
  }
  const db = getSupabase();
  const { data, error } = await db
    .from("print_queue")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", clientId)
    .select("id, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error("Printimi nuk u gjet.");
    err.status = 404;
    throw err;
  }
  return data;
}

async function getPrintJob(clientId, deviceId, jobId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("print_queue")
    .select("id, status")
    .eq("id", jobId)
    .eq("business_id", clientId)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error("Printimi nuk u gjet.");
    err.status = 404;
    throw err;
  }
  return data;
}

module.exports = {
  queueArkaPrint,
  pollPrintJobs,
  reportPrintStatus,
  getPrintJob,
  buildEscPosReceipt,
};
