const { getSupabase } = require("../db");
const { addBusinessDays } = require("../lib/hotelBusinessDate");

const STALE_MS = 30 * 60 * 1000;

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function parseDateOnly(s) {
  const d = String(s || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function eachDay(fromD, toD) {
  const out = [];
  let cur = parseDateOnly(fromD);
  const end = parseDateOnly(toD);
  if (!cur || !end) return out;
  while (cur <= end) {
    out.push(cur);
    cur = addBusinessDays(cur, 1);
  }
  return out;
}

function emptyAgg() {
  return {
    revenue_by_department: { dhome: 0, restorant: 0, sherbime: 0, b2b: 0, total: 0 },
    purchases: 0,
    expenses: 0,
    gross_profit: 0,
    net_profit: 0,
    vat_output: 0,
  };
}

function mergePayloadIntoAgg(agg, p) {
  if (!p) return;
  const rev = p.revenue_by_department || {};
  agg.revenue_by_department.dhome += Number(rev.dhome) || 0;
  agg.revenue_by_department.restorant += Number(rev.restorant) || 0;
  agg.revenue_by_department.sherbime += Number(rev.sherbime) || 0;
  agg.revenue_by_department.b2b += Number(rev.b2b) || 0;
  agg.revenue_by_department.total += Number(rev.total) || 0;
  agg.purchases += Number(p.purchases) || 0;
  agg.expenses += Number(p.expenses) || 0;
  agg.gross_profit += Number(p.gross_profit) || 0;
  agg.net_profit += Number(p.net_profit) || 0;
  const vat = p.vat_by_rate || {};
  agg.vat_output += Number(vat.output_total) || 0;
}

function finalizeAgg(agg) {
  const r = agg.revenue_by_department;
  r.dhome = roundMoney(r.dhome);
  r.restorant = roundMoney(r.restorant);
  r.sherbime = roundMoney(r.sherbime);
  r.b2b = roundMoney(r.b2b);
  r.total = roundMoney(r.total);
  agg.purchases = roundMoney(agg.purchases);
  agg.expenses = roundMoney(agg.expenses);
  agg.gross_profit = roundMoney(agg.gross_profit);
  agg.net_profit = roundMoney(agg.net_profit);
  agg.vat_output = roundMoney(agg.vat_output);
  return agg;
}

async function upsertDailySummaries(clientId, items) {
  const db = getSupabase();
  const rows = (items || []).filter((it) => parseDateOnly(it.report_date));
  if (!rows.length) return { upserted: 0 };

  let upserted = 0;
  const synced_at = new Date().toISOString();
  for (const it of rows) {
    const report_date = parseDateOnly(it.report_date);
    const payload = it.payload && typeof it.payload === "object" ? it.payload : {};
    const computed_at = it.computed_at || payload.computed_at || synced_at;
    const content_hash = it.content_hash || payload.fingerprint || null;
    const { error } = await db.from("pos_owner_daily_summaries").upsert(
      {
        client_id: clientId,
        report_date,
        payload,
        content_hash,
        computed_at,
        synced_at,
      },
      { onConflict: "client_id,report_date" },
    );
    if (error) throw error;
    upserted += 1;
  }
  return { upserted };
}

async function listSummaries(clientId, from, to) {
  const fromD = parseDateOnly(from);
  const toD = parseDateOnly(to) || fromD;
  if (!fromD || !toD) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_owner_daily_summaries")
    .select("report_date, payload, computed_at, synced_at, content_hash")
    .eq("client_id", clientId)
    .gte("report_date", fromD)
    .lte("report_date", toD)
    .order("report_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getLatestSyncMeta(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_owner_daily_summaries")
    .select("synced_at, computed_at, report_date")
    .eq("client_id", clientId)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      last_synced_at: null,
      last_computed_at: null,
      last_report_date: null,
      stale: true,
      stale_message: "Programi nuk është lidhur",
    };
  }
  const syncedMs = new Date(data.synced_at).getTime();
  const stale = !Number.isFinite(syncedMs) || Date.now() - syncedMs > STALE_MS;
  return {
    last_synced_at: data.synced_at,
    last_computed_at: data.computed_at,
    last_report_date: data.report_date,
    stale,
    stale_message: stale ? "Programi nuk është lidhur" : "",
  };
}

function aggregateSummaries(rows) {
  const agg = emptyAgg();
  const byDay = [];
  let latestComputed = null;
  let latestSynced = null;
  for (const row of rows || []) {
    const p = row.payload || {};
    mergePayloadIntoAgg(agg, p);
    byDay.push({
      date: row.report_date,
      total: roundMoney(p.revenue_by_department?.total ?? 0),
      dhome: roundMoney(p.revenue_by_department?.dhome ?? 0),
      restorant: roundMoney(p.revenue_by_department?.restorant ?? 0),
      sherbime: roundMoney(p.revenue_by_department?.sherbime ?? 0),
      b2b: roundMoney(p.revenue_by_department?.b2b ?? 0),
      computed_at: row.computed_at,
      synced_at: row.synced_at,
    });
    if (!latestSynced || String(row.synced_at) > String(latestSynced)) {
      latestSynced = row.synced_at;
      latestComputed = row.computed_at;
    }
  }
  finalizeAgg(agg);
  return { aggregate: agg, by_day: byDay, latest_computed_at: latestComputed, latest_synced_at: latestSynced };
}

async function sumRevenueForRange(clientId, from, to) {
  const rows = await listSummaries(clientId, from, to);
  let total = 0;
  let count = 0;
  for (const row of rows) {
    total += Number(row.payload?.revenue_by_department?.total) || 0;
    count += 1;
  }
  return { total: roundMoney(total), count, days: count };
}

async function sumRevenueForClients(clientIds, from, to) {
  const ids = [...new Set((clientIds || []).filter(Boolean))];
  if (!ids.length) return { total: 0, count: 0 };
  let total = 0;
  let count = 0;
  for (const id of ids) {
    const s = await sumRevenueForRange(id, from, to);
    total += s.total;
    count += s.count;
  }
  return { total: roundMoney(total), count };
}

module.exports = {
  STALE_MS,
  upsertDailySummaries,
  listSummaries,
  getLatestSyncMeta,
  aggregateSummaries,
  sumRevenueForRange,
  sumRevenueForClients,
  eachDay,
};
