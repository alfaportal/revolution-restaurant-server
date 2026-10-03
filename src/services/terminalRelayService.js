const { findLicenseByKey, normalizeKey } = require("./licenseService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");
const { dbForLicenseId } = require("../lib/productSupabase");
const {
  normalizeDeviceId,
  normalizeTerminalRole,
  listTerminalsOrdered,
  pickPrimaryTerminal,
  isTerminalRevoked,
  TERMINAL_REVOKED_MESSAGE,
} = require("./licenseTerminalService");

const SNAPSHOT_KINDS = ["staff", "menu", "stock", "master"];
const MAX_MESSAGE_CHARS = 6 * 1024 * 1024;
const MAX_PRESENCE_CHARS = 64 * 1024;
const MAX_SNAPSHOT_CHARS = 8 * 1024 * 1024;
const INBOX_LIMIT = 40;
const ACK_LIMIT = 200;

function relayError(code, message, status = 400) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

function isMissingRelation(error) {
  const code = String(error?.code || "");
  const msg = String(error?.message || error?.details || "");
  return code === "42P01" || code === "PGRST205" || /does not exist|schema cache|Could not find the table/i.test(msg);
}

function relayUnavailable() {
  return relayError("RELAY_UNAVAILABLE", "Lidhja përmes cloud-it nuk është aktivizuar ende në server.", 503);
}

function ensureEnvelope(raw, maxChars, label) {
  if (raw == null) return null;
  const s = String(raw);
  if (!/^v1:[A-Za-z0-9+/=]+$/.test(s)) throw relayError("BAD_PAYLOAD", `${label}: format i pavlefshëm.`);
  if (s.length > maxChars) throw relayError("PAYLOAD_TOO_LARGE", `${label}: shumë i madh.`, 413);
  return s;
}

function isoTime(v) {
  const t = Date.parse(v || "");
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/**
 * PC e regjistruar e licencës (jo e hequr). Kryesorja = arka1 / terminali i parë;
 * licencë pa terminale → vetëm license.device_id është Kryesore.
 */
async function resolveRelayTerminal(body) {
  const celesi = normalizeKey(body?.celesi || body?.license_key || "");
  const deviceId = normalizeDeviceId(body?.device_id);
  if (!celesi) throw relayError("MISSING_LICENSE", "Mungon çelësi i licencës.");
  if (!deviceId) throw relayError("MISSING_DEVICE", "Mungon device_id.");
  const license = await findLicenseByKey(celesi);
  try {
    assertLicenseUsable(license);
  } catch (e) {
    throw relayError(e.code || "LICENSE_INVALID", e.message || "Licenca nuk vlen.", 403);
  }
  if (await isTerminalRevoked(license.id, deviceId)) {
    throw relayError("TERMINAL_REVOKED", TERMINAL_REVOKED_MESSAGE, 403);
  }
  const terminals = await listTerminalsOrdered(license.id);
  const primary = pickPrimaryTerminal(terminals);
  const self = terminals.find((t) => t.device_id === deviceId) || null;
  const legacyPrimary = !terminals.length && normalizeDeviceId(license.device_id) === deviceId;
  if (!self && !legacyPrimary) {
    throw relayError("TERMINAL_UNKNOWN", "Kjo PC nuk është arkë e regjistruar e kësaj licence.", 403);
  }
  const isPrimary = legacyPrimary || (!!primary && primary.device_id === deviceId);
  let registerNumber = 1;
  if (!isPrimary) {
    const m = /^arka(\d+)$/.exec(normalizeTerminalRole(self.terminal_role));
    registerNumber = m ? Number(m[1]) : 0;
    if (registerNumber < 2) {
      throw relayError("TERMINAL_ROLE", "Roli i arkës nuk është caktuar — lidheni sërish me kod nga Kryesorja.", 409);
    }
  }
  const { db } = await dbForLicenseId(license.id);
  return { license, db, deviceId, isPrimary, registerNumber, terminals, primary };
}

function requirePrimary(ctx) {
  if (!ctx.isPrimary) throw relayError("NOT_PRIMARY", "Vetëm arka Kryesore e bën këtë veprim.", 403);
}

function requireSecondary(ctx) {
  if (ctx.isPrimary) throw relayError("IS_PRIMARY", "Kryesorja nuk dërgon raporte te vetja.", 409);
}

/** Arka 2+ → cloud: gjendja (gjithmonë) + paketa me shitje/ndërrime (kur ka). */
async function pushFromRegister(body) {
  const ctx = await resolveRelayTerminal(body);
  requireSecondary(ctx);
  const presence = ensureEnvelope(body?.presence, MAX_PRESENCE_CHARS, "presence");
  const message = ensureEnvelope(body?.message, MAX_MESSAGE_CHARS, "message");
  const nowIso = new Date().toISOString();

  if (presence) {
    const { error } = await ctx.db.from("terminal_relay_presence").upsert(
      {
        license_id: ctx.license.id,
        device_id: ctx.deviceId,
        register_number: ctx.registerNumber,
        payload: presence,
        updated_at: nowIso,
      },
      { onConflict: "license_id,device_id" },
    );
    if (error) throw isMissingRelation(error) ? relayUnavailable() : error;
  }

  let messageId = null;
  if (message) {
    const { data, error } = await ctx.db
      .from("terminal_relay_messages")
      .insert({
        license_id: ctx.license.id,
        from_device_id: ctx.deviceId,
        register_number: ctx.registerNumber,
        payload: message,
      })
      .select("id")
      .single();
    if (error) throw isMissingRelation(error) ? relayUnavailable() : error;
    messageId = Number(data.id);
  }

  return {
    ok: true,
    register_number: ctx.registerNumber,
    message_id: messageId,
    primary_last_seen_at: isoTime(ctx.primary?.last_seen_at),
    server_time: nowIso,
  };
}

/** Kryesore ← cloud: paketat e pa-konfirmuara + gjendja e arkave aktive. */
async function pullInbox(body) {
  const ctx = await resolveRelayTerminal(body);
  requirePrimary(ctx);
  const afterId = Math.max(0, Math.floor(Number(body?.after_id) || 0));
  const secondaries = ctx.terminals.filter((t) => !ctx.primary || t.device_id !== ctx.primary.device_id);
  const activeIds = new Set(secondaries.map((t) => t.device_id));

  const { data: msgs, error: msgErr } = await ctx.db
    .from("terminal_relay_messages")
    .select("id, from_device_id, register_number, payload, created_at")
    .eq("license_id", ctx.license.id)
    .is("acked_at", null)
    .gt("id", afterId)
    .order("id", { ascending: true })
    .limit(INBOX_LIMIT);
  if (msgErr) throw isMissingRelation(msgErr) ? relayUnavailable() : msgErr;

  let presence = [];
  if (activeIds.size) {
    const { data: pres, error: presErr } = await ctx.db
      .from("terminal_relay_presence")
      .select("device_id, register_number, payload, updated_at")
      .eq("license_id", ctx.license.id);
    if (presErr) throw isMissingRelation(presErr) ? relayUnavailable() : presErr;
    presence = (pres || [])
      .filter((p) => activeIds.has(normalizeDeviceId(p.device_id)))
      .map((p) => ({
        device_id: normalizeDeviceId(p.device_id),
        register_number: Number(p.register_number) || 0,
        payload: p.payload,
        updated_at: isoTime(p.updated_at),
      }));
  }

  return {
    ok: true,
    secondaries: secondaries.length,
    messages: (msgs || []).map((m) => ({
      id: Number(m.id),
      from_device_id: normalizeDeviceId(m.from_device_id),
      register_number: Number(m.register_number) || 0,
      payload: m.payload,
      created_at: isoTime(m.created_at),
    })),
    has_more: (msgs || []).length >= INBOX_LIMIT,
    presence,
    server_time: new Date().toISOString(),
  };
}

/** Kryesore: paketat e importuara shënohen të dorëzuara (nuk fshihen). */
async function ackInbox(body) {
  const ctx = await resolveRelayTerminal(body);
  requirePrimary(ctx);
  const ids = [...new Set((Array.isArray(body?.ids) ? body.ids : [])
    .map((x) => Math.floor(Number(x) || 0))
    .filter((x) => x > 0))].slice(0, ACK_LIMIT);
  if (!ids.length) return { ok: true, acked: 0 };
  const { data, error } = await ctx.db
    .from("terminal_relay_messages")
    .update({ acked_at: new Date().toISOString() })
    .eq("license_id", ctx.license.id)
    .in("id", ids)
    .is("acked_at", null)
    .select("id");
  if (error) throw isMissingRelation(error) ? relayUnavailable() : error;
  return { ok: true, acked: (data || []).length };
}

/** Kryesore → cloud: stafi / menuja / stoku / adresat LAN (vetëm Kryesorja shkruan). */
async function publishSnapshots(body) {
  const ctx = await resolveRelayTerminal(body);
  requirePrimary(ctx);
  const list = Array.isArray(body?.snapshots) ? body.snapshots : [];
  const rows = [];
  const nowIso = new Date().toISOString();
  for (const s of list) {
    const kind = String(s?.kind || "").trim().toLowerCase();
    if (!SNAPSHOT_KINDS.includes(kind)) throw relayError("BAD_KIND", `Lloj i panjohur: ${kind || "(bosh)"}.`);
    const hash = String(s?.hash || "").trim();
    if (!/^[a-f0-9]{16,128}$/.test(hash)) throw relayError("BAD_HASH", `Hash i pavlefshëm për ${kind}.`);
    rows.push({
      license_id: ctx.license.id,
      kind,
      hash,
      payload: ensureEnvelope(s?.payload, MAX_SNAPSHOT_CHARS, kind),
      updated_at: nowIso,
    });
  }
  if (!rows.length) return { ok: true, published: 0 };
  const { error } = await ctx.db.from("terminal_relay_snapshots").upsert(rows, { onConflict: "license_id,kind" });
  if (error) throw isMissingRelation(error) ? relayUnavailable() : error;
  return { ok: true, published: rows.length, server_time: nowIso };
}

/** Arka 2+ ← cloud: vetëm llojet që kanë ndryshuar (sipas hash-it që ka arka). */
async function fetchSnapshots(body) {
  const ctx = await resolveRelayTerminal(body);
  const have = body?.have && typeof body.have === "object" ? body.have : {};
  const { data, error } = await ctx.db
    .from("terminal_relay_snapshots")
    .select("kind, hash, payload, updated_at")
    .eq("license_id", ctx.license.id);
  if (error) throw isMissingRelation(error) ? relayUnavailable() : error;
  const snapshots = {};
  const known = {};
  for (const row of data || []) {
    const kind = String(row.kind);
    known[kind] = { hash: row.hash, updated_at: isoTime(row.updated_at) };
    if (String(have[kind] || "") === String(row.hash)) continue;
    snapshots[kind] = { hash: row.hash, payload: row.payload, updated_at: isoTime(row.updated_at) };
  }
  return {
    ok: true,
    register_number: ctx.registerNumber,
    snapshots,
    known,
    primary_last_seen_at: isoTime(ctx.primary?.last_seen_at),
    server_time: new Date().toISOString(),
  };
}

/** Pairing / heqje arke: kur POS dërgon device_id, lejohet vetëm nga Kryesorja. */
async function assertCallerIsPrimaryIfKnown(license, callerDeviceIdRaw) {
  const callerId = normalizeDeviceId(callerDeviceIdRaw);
  if (!callerId) return;
  const terminals = await listTerminalsOrdered(license.id);
  if (!terminals.length) return;
  const primary = pickPrimaryTerminal(terminals);
  if (primary && primary.device_id === callerId) return;
  if (!primary && normalizeDeviceId(license.device_id) === callerId) return;
  throw relayError("NOT_PRIMARY", "Arkat lidhen dhe hiqen vetëm nga paneli i Kryesores.", 403);
}

module.exports = {
  SNAPSHOT_KINDS,
  resolveRelayTerminal,
  pushFromRegister,
  pullInbox,
  ackInbox,
  publishSnapshots,
  fetchSnapshots,
  assertCallerIsPrimaryIfKnown,
};
