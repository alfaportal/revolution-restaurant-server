const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");

const MIN_POS_PASSWORD = 4;

function sha256Hex(plain) {
  return crypto.createHash("sha256").update(String(plain || ""), "utf8").digest("hex");
}

function parseIsoMs(iso) {
  if (!iso) return 0;
  const t = Date.parse(String(iso));
  return Number.isFinite(t) ? t : 0;
}

async function getClientPosPasswordRow(clientId) {
  const id = String(clientId || "").trim();
  if (!id) return null;
  const db = getSupabase();
  const { data, error } = await db
    .from("clients")
    .select("id, pos_admin_password_sha256, pos_admin_password_set_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Ruaj hash-in POS (SHA-256) pas ndryshimit të fjalëkalimit të pronarit në cloud.
 */
async function recordPosAdminPasswordSha256(clientId, plainPassword, setAtIso) {
  const id = String(clientId || "").trim();
  const plain = String(plainPassword || "").trim();
  if (!id || !plain) return null;
  const setAt = setAtIso || new Date().toISOString();
  const db = getSupabase();
  const { data, error } = await db
    .from("clients")
    .update({
      pos_admin_password_sha256: sha256Hex(plain),
      pos_admin_password_set_at: setAt,
    })
    .eq("id", id)
    .select("pos_admin_password_sha256, pos_admin_password_set_at")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * POS desktop → cloud: bcrypt për users.passwordi + SHA-256 për clients (pull nga POS).
 */
async function pushOwnerAdminPasswordFromPos(clientId, plainPassword) {
  const id = String(clientId || "").trim();
  const plain = String(plainPassword || "").trim();
  if (!id) {
    const err = new Error("Klienti nuk u gjet.");
    err.code = "NO_CLIENT";
    throw err;
  }
  if (!plain || plain.length < MIN_POS_PASSWORD) {
    const err = new Error(`Fjalëkalimi min. ${MIN_POS_PASSWORD} karaktere.`);
    err.code = "WEAK_PASSWORD";
    throw err;
  }

  const nowIso = new Date().toISOString();
  const sha = sha256Hex(plain);
  const bcryptHash = await bcrypt.hash(plain, 12);
  const db = getSupabase();

  const { data: owners, error: findErr } = await db
    .from("users")
    .select("id")
    .eq("client_id", id)
    .eq("roli", "client_admin")
    .eq("aktiv", true);
  if (findErr) throw findErr;

  if (owners?.length) {
    for (const o of owners) {
      const { error: updErr } = await db
        .from("users")
        .update({
          passwordi: bcryptHash,
          password_set_at: nowIso,
        })
        .eq("id", o.id);
      if (updErr) throw updErr;
    }
  }

  const { data: clientRow, error: clientErr } = await db
    .from("clients")
    .update({
      pos_admin_password_sha256: sha,
      pos_admin_password_set_at: nowIso,
    })
    .eq("id", id)
    .select("pos_admin_password_sha256, pos_admin_password_set_at")
    .maybeSingle();
  if (clientErr) throw clientErr;

  return {
    password_sha256: clientRow?.pos_admin_password_sha256 || sha,
    password_set_at: clientRow?.pos_admin_password_set_at || nowIso,
  };
}

/**
 * Cloud → POS: kthe hash SHA-256 nëse cloud ka version më të ri se synced_at lokale.
 */
async function pullOwnerAdminPasswordForPos(clientId, localSyncedAt) {
  const row = await getClientPosPasswordRow(clientId);
  if (!row?.pos_admin_password_sha256) {
    return { changed: false, password_sha256: null, password_set_at: null };
  }

  const cloudMs = parseIsoMs(row.pos_admin_password_set_at);
  const localMs = parseIsoMs(localSyncedAt);

  if (cloudMs <= localMs) {
    return {
      changed: false,
      password_sha256: row.pos_admin_password_sha256,
      password_set_at: row.pos_admin_password_set_at,
    };
  }

  return {
    changed: true,
    password_sha256: row.pos_admin_password_sha256,
    password_set_at: row.pos_admin_password_set_at,
  };
}

module.exports = {
  MIN_POS_PASSWORD,
  sha256Hex,
  recordPosAdminPasswordSha256,
  pushOwnerAdminPasswordFromPos,
  pullOwnerAdminPasswordForPos,
};
