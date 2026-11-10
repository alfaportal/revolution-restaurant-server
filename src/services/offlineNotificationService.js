const { getSupabase } = require("../db");
const {
  isEmailConfigured,
  sendOwnerClientOfflineEmail,
} = require("./emailService");

const OFFLINE_MS = 48 * 60 * 60 * 1000;
const ONLINE_MS = 15 * 60 * 1000;
const businesses = new Map();

function blankState() {
  return { last_seen_online: 0, offline_email_sent: false };
}

function decideOfflineEmail(state, { seenAtMs, fiscalActive, now }) {
  if (!fiscalActive || !state) return "skip";
  const seenOk = Number.isFinite(seenAtMs) && seenAtMs > 0 && seenAtMs <= now + 60 * 1000;
  const onlineNow = seenOk && now - seenAtMs <= ONLINE_MS;
  if (onlineNow) {
    state.last_seen_online = seenAtMs;
    state.offline_email_sent = false;
    return "online";
  }
  if (seenOk && seenAtMs > state.last_seen_online) state.last_seen_online = seenAtMs;
  if (!state.last_seen_online || state.offline_email_sent) return "wait";
  if (now - state.last_seen_online < OFFLINE_MS) return "wait";
  return "send";
}

function fiscalActive(row) {
  if (!row) return false;
  if (row.fiscal_enabled === true) return true;
  return String(row.fiscal_nr || "").trim().length > 0;
}

function latestMs(values) {
  let best = 0;
  for (const v of values) {
    if (!v) continue;
    const ms = new Date(v).getTime();
    if (Number.isFinite(ms) && ms > best) best = ms;
  }
  return best;
}

async function resolveOwnerEmail(clientId, clientEmail) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("email")
    .eq("client_id", clientId)
    .eq("roli", "client_admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const ownerEmail = String(data?.email || "").trim().toLowerCase();
  if (ownerEmail) return ownerEmail;
  return String(clientEmail || "").trim().toLowerCase() || null;
}

async function loadPosSettings(db) {
  const full = await db.from("pos_settings").select("client_id, fiscal_enabled, fiscal_nr, synced_at");
  if (!full.error) return full.data || [];
  const slim = await db.from("pos_settings").select("client_id, fiscal_enabled, synced_at");
  if (slim.error) throw slim.error;
  return slim.data || [];
}

async function fetchFiscalBusinesses() {
  const db = getSupabase();
  const [{ data: clients, error: clientErr }, settings, { data: licenses, error: licErr }, { data: terminals, error: termErr }] =
    await Promise.all([
      db.from("clients").select("id, emri, email, aktiv, kitchen_slug"),
      loadPosSettings(db),
      db.from("licenses").select("id, client_id, statusi, last_validation_at").neq("statusi", "revokuar"),
      db.from("license_terminals").select("license_id, last_seen_at"),
    ]);
  if (clientErr) throw clientErr;
  if (licErr) throw licErr;
  if (termErr) console.warn("[offline-48h] terminals:", termErr.message || termErr);

  const settingsByClient = new Map();
  for (const row of settings) {
    if (row?.client_id) settingsByClient.set(row.client_id, row);
  }
  const seenByLicense = new Map();
  for (const t of terminals || []) {
    if (!t.license_id || !t.last_seen_at) continue;
    const prev = seenByLicense.get(t.license_id) || 0;
    const ms = new Date(t.last_seen_at).getTime();
    if (ms > prev) seenByLicense.set(t.license_id, ms);
  }
  const licenseSeen = new Map();
  for (const lic of licenses || []) {
    if (!lic.client_id) continue;
    const ms = latestMs([
      lic.last_validation_at,
      seenByLicense.get(lic.id) ? new Date(seenByLicense.get(lic.id)).toISOString() : null,
    ]);
    const prev = licenseSeen.get(lic.client_id) || 0;
    if (ms > prev) licenseSeen.set(lic.client_id, ms);
  }

  const out = [];
  for (const client of clients || []) {
    if (!client?.id || client.aktiv === false) continue;
    const slug = String(client.kitchen_slug || "").trim().toLowerCase();
    if (!slug) continue;
    const setting = settingsByClient.get(client.id);
    if (!fiscalActive(setting)) continue;
    const seenAtMs = latestMs([
      licenseSeen.get(client.id) ? new Date(licenseSeen.get(client.id)).toISOString() : null,
      setting?.synced_at,
    ]);
    out.push({
      slug,
      client_id: client.id,
      client_name: client.emri || slug,
      client_email: client.email || "",
      seenAtMs,
    });
  }
  return out;
}

async function processOfflineNotifications(now = Date.now()) {
  if (!isEmailConfigured()) {
    return { skipped: true, reason: "email_not_configured" };
  }
  const rows = await fetchFiscalBusinesses();
  const stats = { checked: rows.length, sent: 0, online: 0, wait: 0, errors: 0 };
  for (const row of rows) {
    let state = businesses.get(row.slug);
    if (!state) {
      state = blankState();
      businesses.set(row.slug, state);
    }
    const action = decideOfflineEmail(state, {
      seenAtMs: row.seenAtMs,
      fiscalActive: true,
      now,
    });
    if (action === "online") {
      stats.online += 1;
      continue;
    }
    if (action !== "send") {
      stats.wait += 1;
      continue;
    }
    state.offline_email_sent = true;
    try {
      const ownerEmail = await resolveOwnerEmail(row.client_id, row.client_email);
      if (!ownerEmail) {
        state.offline_email_sent = false;
        stats.wait += 1;
        continue;
      }
      const hours = Math.round((now - state.last_seen_online) / (60 * 60 * 1000));
      await sendOwnerClientOfflineEmail({
        to: ownerEmail,
        clientName: row.client_name,
        hoursOffline: hours,
        milestoneHours: 48,
        lastSeenAt: new Date(state.last_seen_online).toISOString(),
        atkWarning: true,
      });
      stats.sent += 1;
    } catch (err) {
      state.offline_email_sent = false;
      stats.errors += 1;
      console.error(`[offline-48h] ${row.slug}:`, err.message || err);
    }
  }
  return stats;
}

module.exports = {
  processOfflineNotifications,
  decideOfflineEmail,
  businesses,
  OFFLINE_MS,
  ONLINE_MS,
};
