const { randomInt } = require("crypto");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { getClientBySlugOrId } = require("../lib/kitchenAccess");
const { signToken } = require("../middleware/auth");
const { buildOwnerAuthContext } = require("./ownerGroupService");
const { isEmailConfigured, sendSuperAdminEmergencyAccessEmail } = require("./emailService");
const { logAdminActivity } = require("./activityLogService");

const TTL_MS = 15 * 60 * 1000;
const MAX_TRIES = 5;
const MIN_GAP_MS = 2 * 60 * 1000;
const challenges = new Map();
const lastSent = new Map();

function sixDigitCode() {
  return String(randomInt(100000, 1000000));
}

function cleanSlug(raw) {
  const slug = String(raw || "").trim();
  if (!slug || slug.length > 80 || /[%_\\/?#]/.test(slug)) return "";
  return slug;
}

async function loadSuperAdmins() {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("id, email, emri")
    .eq("roli", "super_admin")
    .eq("aktiv", true);
  if (error) throw error;
  return (data || []).filter((row) => String(row.email || "").trim());
}

async function loadOwner(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("id, emri, email, roli, client_id")
    .eq("client_id", clientId)
    .eq("roli", "client_admin")
    .eq("aktiv", true)
    .limit(1);
  if (error) throw error;
  return (data || [])[0] || null;
}

async function requestSuperAdminEmergencyAccess(rawSlug) {
  const slug = cleanSlug(rawSlug);
  if (!slug) {
    const err = new Error("Shkruaj kodin e biznesit.");
    err.code = "EMPTY";
    throw err;
  }
  const client = await getClientBySlugOrId(slug);
  if (!client?.id) {
    const err = new Error("Biznesi nuk u gjet.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const now = Date.now();
  const prev = lastSent.get(client.id) || 0;
  if (now - prev < MIN_GAP_MS && challenges.has(client.id)) {
    return { ok: true, message: "Kodi është dërguar te emaili i Super Admin. Shikoje dhe shkruaje këtu." };
  }

  if (!isEmailConfigured()) {
    const err = new Error("Emaili nuk është i konfiguruar.");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const admins = await loadSuperAdmins();
  if (!admins.length) {
    const err = new Error("Super Admin nuk u gjet.");
    err.code = "NO_ADMIN";
    throw err;
  }

  const code = sixDigitCode();
  const hash = await bcrypt.hash(code, 10);
  challenges.set(client.id, { hash, expires: now + TTL_MS, tries: 0 });

  let sent = 0;
  for (const admin of admins) {
    try {
      await sendSuperAdminEmergencyAccessEmail({
        to: admin.email,
        clientName: client.emri || slug,
        code,
      });
      sent += 1;
    } catch (err) {
      console.error("[emergency-access] email", err && err.message);
    }
  }

  if (!sent) {
    challenges.delete(client.id);
    const err = new Error("Kodi nuk u dërgua. Provo përsëri.");
    err.code = "EMAIL_FAILED";
    throw err;
  }

  lastSent.set(client.id, now);
  return { ok: true, message: "Kodi u dërgua te emaili i Super Admin." };
}

async function sessionForClient(client) {
  const owner = await loadOwner(client.id);
  if (owner) {
    return buildOwnerAuthContext(owner, { clientId: client.id });
  }
  const admins = await loadSuperAdmins();
  const admin = admins[0];
  if (!admin) {
    const err = new Error("Super Admin nuk u gjet.");
    err.code = "NO_ADMIN";
    throw err;
  }
  return {
    sub: admin.id,
    email: admin.email,
    emri: admin.emri || "Super Admin",
    roli: "client_admin",
    client_id: client.id,
  };
}

async function verifySuperAdminEmergencyAccess(rawSlug, rawCode) {
  const slug = cleanSlug(rawSlug);
  const code = String(rawCode || "").trim();
  if (!slug || !/^\d{6}$/.test(code)) {
    const err = new Error("Shkruaj kodin 6-shifror.");
    err.code = "EMPTY";
    throw err;
  }
  const client = await getClientBySlugOrId(slug);
  if (!client?.id) {
    const err = new Error("Biznesi nuk u gjet.");
    err.code = "NOT_FOUND";
    throw err;
  }
  const row = challenges.get(client.id);
  if (!row || row.expires < Date.now()) {
    challenges.delete(client.id);
    const err = new Error("Kodi ka skaduar. Kërko një kod të ri.");
    err.code = "CODE_EXPIRED";
    throw err;
  }
  const ok = await bcrypt.compare(code, row.hash);
  if (!ok) {
    row.tries += 1;
    if (row.tries >= MAX_TRIES) challenges.delete(client.id);
    const err = new Error("Kodi është i gabuar.");
    err.code = "INVALID_CODE";
    throw err;
  }
  challenges.delete(client.id);
  const payload = await sessionForClient(client);
  const token = signToken(payload);
  try {
    const admins = await loadSuperAdmins();
    await logAdminActivity({
      actorUserId: admins[0]?.id || null,
      actorEmail: admins[0]?.email || "",
      action: "super_admin_emergency_owner_access",
      targetType: "client",
      targetId: client.id,
      targetLabel: client.emri || slug,
    });
  } catch {
    /* hyrja vazhdon edhe nëse shënimi dështon */
  }
  return {
    ok: true,
    token,
    portal: "restaurant",
    product_line: "restaurant",
    user: {
      id: payload.sub,
      emri: payload.emri,
      email: payload.email,
      roli: "client_admin",
      client_id: payload.client_id,
    },
  };
}

module.exports = {
  requestSuperAdminEmergencyAccess,
  verifySuperAdminEmergencyAccess,
};
