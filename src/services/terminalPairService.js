const crypto = require("crypto");
const { getSupabase } = require("../db");
const { findLicenseByKey, normalizeKey } = require("./licenseService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");
const { dbForLicenseId } = require("../lib/productSupabase");
const {
  normalizeDeviceId,
  normalizeTerminalRole,
  normalizePairTerminalRole,
  isPrimaryTerminalRole,
  resolveTerminalAccess,
  getMaxTerminals,
  revokeTerminalAccess,
  clearTerminalRevocation,
  repairTerminalRolesForLicense,
} = require("./licenseTerminalService");

const PAIR_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
/** Kohë minimale nga gjenerimi — pronari/kamarieri të fusin kod + email pa nxitim. */
const PAIR_CODE_MIN_VALID_MS = 2 * 60 * 1000;

function normalizePairCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function randomPairSuffix(len = 4) {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    const idx = crypto.randomInt(0, PAIR_CHARSET.length);
    out += PAIR_CHARSET[idx];
  }
  return out;
}

function generatePairCodeValue() {
  return `KAF-${randomPairSuffix(4)}`;
}

function isTrialActive(license) {
  if (!license?.trial_ends_at) return false;
  return new Date(license.trial_ends_at).getTime() > Date.now();
}

function pairExpiresAtForLicense(license) {
  let iso;
  if (isTrialActive(license) && license.trial_ends_at) {
    iso = new Date(license.trial_ends_at).toISOString();
  } else {
    const day = String(license.data_skadimit || "").slice(0, 10);
    if (day) {
      iso = `${day}T23:59:59.999Z`;
    } else {
      iso = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    }
  }
  const minValid = Date.now() + PAIR_CODE_MIN_VALID_MS;
  const expTs = Date.parse(iso);
  if (!Number.isFinite(expTs) || expTs < minValid) {
    return new Date(minValid).toISOString();
  }
  return iso;
}

function licenseKeyFromBody(body) {
  return normalizeKey(body?.celesi || body?.license_key || "");
}

function normalizePosLanHost(raw) {
  const h = String(raw ?? "").trim();
  if (!h) return null;
  return h.slice(0, 64);
}

function normalizePosLanPort(raw) {
  if (raw == null || raw === "") return null;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1 || n > 65535) return null;
  return n;
}

async function resolveLicenseFromBody(body) {
  const key = licenseKeyFromBody(body);
  if (!key) {
    const err = new Error("Mungon çelësi i licencës.");
    err.code = "MISSING_LICENSE";
    throw err;
  }
  const license = await findLicenseByKey(key);
  assertLicenseUsable(license);
  if (!license.client_id) {
    const err = new Error("Licenca nuk është e lidhur me klient.");
    err.code = "NO_CLIENT";
    throw err;
  }
  return license;
}

async function generatePairCode(body) {
  const license = await resolveLicenseFromBody(body);
  const terminal_role = normalizePairTerminalRole(body.terminal_role);
  const db = getSupabase();
  const expires_at = pairExpiresAtForLicense(license);
  const pos_lan_host = normalizePosLanHost(body.pos_lan_host);
  const pos_lan_port = normalizePosLanPort(body.pos_lan_port);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generatePairCodeValue();
    const row = {
      client_id: license.client_id,
      license_id: license.id,
      code,
      terminal_role,
      expires_at,
      pos_lan_host,
      pos_lan_port,
    };
    const { data, error } = await db
      .from("terminal_pair_codes")
      .insert(row)
      .select("code, expires_at, terminal_role")
      .single();
    if (!error) {
      return {
        ok: true,
        code: data.code,
        expires_at: data.expires_at,
        terminal_role: data.terminal_role,
        license_id: license.id,
        client_id: license.client_id,
      };
    }
    if (!/duplicate|unique|23505/i.test(String(error.message || error.code || ""))) {
      throw error;
    }
  }
  const err = new Error("Nuk u gjenerua kod unik. Provo përsëri.");
  err.code = "CODE_GEN_FAILED";
  throw err;
}

async function fetchClientKitchenSlug(db, clientId) {
  const { data, error } = await db
    .from("clients")
    .select("kitchen_slug")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return String(data?.kitchen_slug || "").trim();
}

async function registerTerminalWithRole(licenseId, deviceId, terminal_role, { hostname = "", ip = "" } = {}) {
  const { db } = await dbForLicenseId(licenseId);
  const id = normalizeDeviceId(deviceId);
  const ts = new Date().toISOString();
  const role = normalizePairTerminalRole(terminal_role);
  const { error } = await db.from("license_terminals").upsert(
    {
      license_id: licenseId,
      device_id: id,
      device_hostname: String(hostname || "").trim().slice(0, 128),
      last_ip: String(ip || "").trim().slice(0, 64),
      terminal_role: role,
      first_activated_at: ts,
      last_seen_at: ts,
    },
    { onConflict: "license_id,device_id" },
  );
  if (error) throw error;
}

async function joinWithPairCode(body, { hostname = "", ip = "" } = {}) {
  const code = normalizePairCode(body.code);
  const deviceId = normalizeDeviceId(body.device_id);
  const hardware_id = String(body.hardware_id || "").trim();

  if (!code) {
    const err = new Error("Mungon kodi i pairing.");
    err.code = "MISSING_CODE";
    throw err;
  }
  if (!deviceId) {
    const err = new Error("Mungon device_id i terminalit.");
    err.code = "MISSING_DEVICE";
    throw err;
  }

  const db = getSupabase();
  const nowIso = new Date().toISOString();

  const { data: pending, error: loadErr } = await db
    .from("terminal_pair_codes")
    .select(
      "id, client_id, license_id, code, terminal_role, expires_at, used_at, pos_lan_host, pos_lan_port",
    )
    .eq("code", code)
    .maybeSingle();
  if (loadErr) throw loadErr;
  if (!pending) {
    const err = new Error("Kodi i pairing nuk u gjet.");
    err.code = "CODE_NOT_FOUND";
    throw err;
  }
  if (pending.used_at) {
    const err = new Error("Kodi është përdorur tashmë.");
    err.code = "CODE_USED";
    throw err;
  }
  if (pending.expires_at && new Date(pending.expires_at).getTime() <= Date.now()) {
    const err = new Error("Kodi i pairing ka skaduar (licenca ka mbaruar).");
    err.code = "CODE_EXPIRED";
    throw err;
  }

  const { data: license, error: licErr } = await db
    .from("licenses")
    .select("*, clients(emri, kitchen_slug, tipi, package_tier)")
    .eq("id", pending.license_id)
    .maybeSingle();
  if (licErr) throw licErr;
  if (!license) {
    const err = new Error("Licenca e kodit nuk u gjet.");
    err.code = "LICENSE_NOT_FOUND";
    throw err;
  }
  assertLicenseUsable(license);

  const access = await resolveTerminalAccess(license, deviceId, hostname, ip, hardware_id, {
    pendingPairRole: pending.terminal_role,
  });
  if (!access.allowed) {
    const err = new Error(access.message || "Terminali nuk lejohet për këtë licencë.");
    err.code = access.code || "TERMINAL_DENIED";
    throw err;
  }

  {
    const { db: licDb } = await dbForLicenseId(license.id);
    const { data: ownRow } = await licDb
      .from("license_terminals")
      .select("terminal_role")
      .eq("license_id", license.id)
      .eq("device_id", normalizeDeviceId(deviceId))
      .maybeSingle();
    const isPrimaryDevice =
      (ownRow?.terminal_role && isPrimaryTerminalRole(ownRow.terminal_role))
      || normalizeDeviceId(license.device_id) === normalizeDeviceId(deviceId);
    if (isPrimaryDevice) {
      const err = new Error("Kjo PC është arka Kryesore — nuk lidhet si arkë tjetër.");
      err.code = "PRIMARY_TERMINAL";
      throw err;
    }
  }

  const { data: marked, error: markErr } = await db
    .from("terminal_pair_codes")
    .update({
      used_at: nowIso,
      used_by_device_id: deviceId,
    })
    .eq("id", pending.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  if (markErr) throw markErr;
  if (!marked) {
    const err = new Error("Kodi u përdor nga një pajisje tjetër.");
    err.code = "CODE_RACE";
    throw err;
  }

  const terminal_role = normalizePairTerminalRole(pending.terminal_role);
  await registerTerminalWithRole(license.id, deviceId, terminal_role, { hostname, ip });
  await clearTerminalRevocation(license.id, deviceId);

  const kitchen_slug =
    license.clients?.kitchen_slug || (await fetchClientKitchenSlug(db, pending.client_id));

  return {
    ok: true,
    client_id: pending.client_id,
    license_id: pending.license_id,
    celesi: license.celesi,
    kitchen_slug,
    terminal_role,
    device_id: deviceId,
    pos_lan_host: pending.pos_lan_host ?? null,
    pos_lan_port: pending.pos_lan_port ?? null,
  };
}

async function listTerminalsForLicense(body) {
  const license = await resolveLicenseFromBody(body);
  await repairTerminalRolesForLicense(license);
  const { db } = await dbForLicenseId(license.id);
  const { data, error } = await db
    .from("license_terminals")
    .select(
      "id, device_id, device_hostname, last_ip, first_activated_at, last_seen_at, terminal_role",
    )
    .eq("license_id", license.id)
    .order("terminal_role", { ascending: true });
  if (error) throw error;
  const terminals = (data || []).map((row) => ({
    id: row.id,
    device_id: row.device_id,
    device_hostname: row.device_hostname || "",
    last_ip: row.last_ip || "",
    first_activated_at: row.first_activated_at,
    last_seen_at: row.last_seen_at,
    terminal_role: normalizeTerminalRole(row.terminal_role),
  }));
  return {
    ok: true,
    license_id: license.id,
    max_terminals: getMaxTerminals(license),
    terminals,
  };
}

async function removeTerminalForLicense(body, deviceIdRaw) {
  const license = await resolveLicenseFromBody(body);
  const deviceId = normalizeDeviceId(deviceIdRaw);
  if (!deviceId) {
    const err = new Error("Mungon ID e pajisjes.");
    err.code = "MISSING_DEVICE";
    throw err;
  }
  const { db } = await dbForLicenseId(license.id);
  const { data: row, error: selErr } = await db
    .from("license_terminals")
    .select("terminal_role, device_id")
    .eq("license_id", license.id)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (!row) {
    const err = new Error("Terminali nuk u gjet.");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (
    isPrimaryTerminalRole(row.terminal_role) ||
    normalizeDeviceId(license.device_id) === deviceId
  ) {
    const err = new Error("Arka kryesore (Arka 1) nuk mund të hiqet.");
    err.code = "PRIMARY_TERMINAL";
    throw err;
  }
  const { error } = await db
    .from("license_terminals")
    .delete()
    .eq("license_id", license.id)
    .eq("device_id", deviceId);
  if (error) throw error;
  await revokeTerminalAccess(license.id, deviceId);
  return { ok: true, device_id: deviceId };
}

module.exports = {
  generatePairCode,
  joinWithPairCode,
  listTerminalsForLicense,
  removeTerminalForLicense,
  normalizePairCode,
  normalizeTerminalRole,
};
