const { getSupabase } = require("../db");
const { deliverEmail, isEmailConfigured, resolveAdminNotifyEmail } = require("../services/emailService");
const { getZonedParts } = require("../services/aiDailyReportService");

const EXPORT_TZ = process.env.REPORT_CRON_TZ || "Europe/Belgrade";
let lastRunWeek = "";

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function buildDataExportBundle() {
  const db = getSupabase();

  const { data: clients, error: cErr } = await db
    .from("clients")
    .select("id, emri, kitchen_slug, package_tier, tipi, created_at")
    .order("created_at", { ascending: false });
  if (cErr) throw cErr;

  const { data: licenses, error: lErr } = await db
    .from("licenses")
    .select("id, client_id, statusi, data_skadimit, created_at")
    .order("created_at", { ascending: false });
  if (lErr) throw lErr;

  const clientCsv = rowsToCsv(
    ["id", "emri", "kitchen_slug", "package_tier", "tipi", "created_at"],
    clients || [],
  );
  const licenseCsv = rowsToCsv(
    ["id", "client_id", "statusi", "data_skadimit", "created_at"],
    licenses || [],
  );

  const now = new Date().toISOString();
  const body = [
    "Export Revolution POS — Supabase backup CSV.",
    "",
    `Klientë: ${(clients || []).length}`,
    `Licenca: ${(licenses || []).length}`,
    `Gjeneruar: ${now}`,
    "",
    "=== CLIENTS ===",
    clientCsv,
    "",
    "=== LICENSES ===",
    licenseCsv,
  ].join("\n");

  return {
    now,
    clients: clients || [],
    licenses: licenses || [],
    body,
  };
}

async function sendDataExportEmail(bundle) {
  const to = resolveAdminNotifyEmail();
  await deliverEmail({
    to,
    subject: `Revolution POS — export CSV (${bundle.now.slice(0, 10)})`,
    text: bundle.body,
    html: `<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap">${bundle.body.replace(/</g, "&lt;")}</pre>`,
  });
  return {
    to,
    clients: bundle.clients.length,
    licenses: bundle.licenses.length,
  };
}

async function exportWeeklyDataCsv() {
  const bundle = await buildDataExportBundle();
  const result = await sendDataExportEmail(bundle);
  console.log(`[cron] weeklyDataExport: dërguar te ${result.to}`);
  return result;
}

function startWeeklyDataExportCron() {}

module.exports = {
  buildDataExportBundle,
  sendDataExportEmail,
  exportWeeklyDataCsv,
  startWeeklyDataExportCron,
};
