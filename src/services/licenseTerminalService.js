const { dbForLicenseId, getSupabaseForProduct } = require("../lib/productSupabase");

/** Pa shtim terminali të ri gjatë grace — vetëm mesazh. Overflow i ri = bllokim. */
const TERMINAL_GRACE_MS = 2 * 60 * 60 * 1000;

function normalizeDeviceId(deviceId) {
  return String(deviceId || "").trim().toUpperCase().replace(/\s+/g, "");
}

const MAX_ARKA = 16;
const PRIMARY_TERMINAL_ROLE = "arka1";

function normalizeTerminalRole(raw) {
  const r = String(raw || PRIMARY_TERMINAL_ROLE).trim().toLowerCase().replace(/\s+/g, "");
  const m = /^arka(\d+)$/.exec(r);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= MAX_ARKA) return `arka${n}`;
  }
  return PRIMARY_TERMINAL_ROLE;
}

function normalizePairTerminalRole(raw) {
  const m = /^arka(\d+)$/.exec(normalizeTerminalRole(raw));
  const n = m ? Math.max(2, Number(m[1])) : 2;
  return `arka${n}`;
}

function isPrimaryTerminalRole(role) {
  return normalizeTerminalRole(role) === PRIMARY_TERMINAL_ROLE;
}

function roleForDirectTerminalRegistration(terminals) {
  const hasArka1 = (terminals || []).some((t) => isPrimaryTerminalRole(t.terminal_role));
  if (!hasArka1) return PRIMARY_TERMINAL_ROLE;
  const used = new Set((terminals || []).map((t) => normalizeTerminalRole(t.terminal_role)));
  for (let i = 2; i <= MAX_ARKA; i += 1) {
    const r = `arka${i}`;
    if (!used.has(r)) return r;
  }
  return "arka2";
}

function isMissingRelation(error) {
  const code = String(error?.code || "");
  const msg = String(error?.message || error?.details || "");
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist|schema cache|Could not find the table/i.test(msg)
  );
}

function getMaxTerminals(license) {
  return Math.max(1, Number(license?.max_terminals) || 1);
}

function getGraceState(license) {
  const raw = license?.terminal_limit_grace_at;
  if (!raw) return { started: false, withinGrace: false, graceUntil: null };
  const startedAt = new Date(raw).getTime();
  if (!Number.isFinite(startedAt)) return { started: false, withinGrace: false, graceUntil: null };
  const graceUntil = startedAt + TERMINAL_GRACE_MS;
  return {
    started: true,
    withinGrace: Date.now() < graceUntil,
    graceUntil: new Date(graceUntil).toISOString(),
  };
}

function terminalLimitMessage(graceUntil) {
  const until = graceUntil
    ? new Date(graceUntil).toLocaleString("sq-AL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return until
    ? `Keni arritur limitin e terminaleve. Kontaktoni Revolution Invest për të shtuar terminale. Perioda e provës deri më ${until}.`
    : "Keni arritur limitin e terminaleve. Kontaktoni Revolution Invest për të shtuar terminale.";
}

function mapTerminalRow(row) {
  return {
    id: row.id,
    device_id: row.device_id,
    device_hostname: row.device_hostname || "",
    last_ip: row.last_ip || "",
    first_activated_at: row.first_activated_at,
    last_seen_at: row.last_seen_at,
    terminal_role: row.terminal_role ? normalizeTerminalRole(row.terminal_role) : null,
  };
}

async function dbOf(licenseId) {
  const { db } = await dbForLicenseId(licenseId);
  return db;
}

async function listTerminalsOrdered(licenseId) {
  const db = await dbOf(licenseId);
  const { data, error } = await db
    .from("license_terminals")
    .select("id, device_id, device_hostname, last_ip, first_activated_at, last_seen_at, terminal_role")
    .eq("license_id", licenseId)
    .order("first_activated_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data || []).map(mapTerminalRow);
}

/** Kryesorja = rreshti arka1; nëse s'ka, terminali i regjistruar i pari. */
function pickPrimaryTerminal(terminals) {
  if (!Array.isArray(terminals) || !terminals.length) return null;
  const sorted = [...terminals].sort(
    (a, b) => new Date(a.first_activated_at || 0).getTime() - new Date(b.first_activated_at || 0).getTime(),
  );
  return sorted.find((t) => t.terminal_role && isPrimaryTerminalRole(t.terminal_role)) || sorted[0];
}

async function migrateLegacyTerminal(license) {
  const deviceId = normalizeDeviceId(license.device_id);
  if (!deviceId) return;

  const db = await dbOf(license.id);
  const { count, error: countErr } = await db
    .from("license_terminals")
    .select("id", { count: "exact", head: true })
    .eq("license_id", license.id);
  if (countErr) throw countErr;
  if ((count || 0) > 0) return;

  const now = license.last_activated_at || new Date().toISOString();
  await db.from("license_terminals").insert({
    license_id: license.id,
    device_id: deviceId,
    device_hostname: license.device_hostname || "",
    last_ip: license.last_ip || "",
    first_activated_at: now,
    last_seen_at: license.last_validation_at || now,
    terminal_role: PRIMARY_TERMINAL_ROLE,
  });
}

async function touchTerminal(licenseId, deviceId, { hostname = "", ip = "", now = null } = {}) {
  const db = await dbOf(licenseId);
  const ts = now || new Date().toISOString();
  const id = normalizeDeviceId(deviceId);
  const { error } = await db
    .from("license_terminals")
    .update({
      last_seen_at: ts,
      ...(hostname ? { device_hostname: String(hostname).trim().slice(0, 128) } : {}),
      ...(ip ? { last_ip: String(ip).trim().slice(0, 64) } : {}),
    })
    .eq("license_id", licenseId)
    .eq("device_id", id);
  if (error) throw error;
}

async function insertTerminal(
  licenseId,
  deviceId,
  { hostname = "", ip = "", now = null, terminal_role = null } = {},
) {
  const id = normalizeDeviceId(deviceId);
  if (!id) return;

  // Bug 2 fix: mos lejo insertim nëse terminali është i revokuar
  if (await isTerminalRevoked(licenseId, id)) {
    return;
  }

  const db = await dbOf(licenseId);
  const ts = now || new Date().toISOString();

  // Bug 3 fix: gjithmonë vendos terminal_role — mos u mbështet te DB default 'arka1'
  let role = terminal_role;
  if (!role) {
    const existing = await listTerminalsOrdered(licenseId);
    role = roleForDirectTerminalRegistration(existing);
  }

  const row = {
    license_id: licenseId,
    device_id: id,
    device_hostname: String(hostname || "").trim().slice(0, 128),
    last_ip: String(ip || "").trim().slice(0, 64),
    first_activated_at: ts,
    last_seen_at: ts,
    terminal_role: normalizeTerminalRole(role),
  };
  const { data: existingRow, error: findErr } = await db
    .from("license_terminals")
    .select("id, terminal_role")
    .eq("license_id", licenseId)
    .eq("device_id", id)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existingRow) {
    /* first_activated_at mbetet data e regjistrimit të parë; Kryesorja mbetet arka1 */
    const { first_activated_at: _keep, ...updateRow } = row;
    if (existingRow.terminal_role && isPrimaryTerminalRole(existingRow.terminal_role)) {
      updateRow.terminal_role = PRIMARY_TERMINAL_ROLE;
    }
    const { error } = await db.from("license_terminals").update(updateRow).eq("id", existingRow.id);
    if (error) throw error;
    return;
  }
  const { error } = await db.from("license_terminals").insert(row);
  if (error) throw error;
}

async function clearTerminalLimitGrace(licenseId) {
  const db = await dbOf(licenseId);
  await db.from("licenses").update({ terminal_limit_grace_at: null }).eq("id", licenseId);
}

async function startTerminalLimitGrace(licenseId) {
  const db = await dbOf(licenseId);
  const now = new Date().toISOString();
  const { data } = await db
    .from("licenses")
    .select("terminal_limit_grace_at")
    .eq("id", licenseId)
    .maybeSingle();
  if (!data?.terminal_limit_grace_at) {
    await db.from("licenses").update({ terminal_limit_grace_at: now }).eq("id", licenseId);
    return now;
  }
  return data.terminal_limit_grace_at;
}

/** Fshin vetëm arkat shtesë; Kryesorja mbetet. Kthen Kryesoren (ose null kur s'ka terminale). */
async function clearSecondaryTerminals(licenseId) {
  const terminals = await listTerminalsOrdered(licenseId);
  const primary = pickPrimaryTerminal(terminals);
  if (!primary) {
    await clearTerminalLimitGrace(licenseId);
    return null;
  }
  const db = await dbOf(licenseId);
  if (!(primary.terminal_role && isPrimaryTerminalRole(primary.terminal_role))) {
    await db.from("license_terminals").update({ terminal_role: PRIMARY_TERMINAL_ROLE }).eq("id", primary.id);
  }
  const { error } = await db
    .from("license_terminals")
    .delete()
    .eq("license_id", licenseId)
    .neq("id", primary.id);
  if (error && !isMissingRelation(error)) throw error;
  await clearTerminalLimitGrace(licenseId);
  return primary;
}

function blockedResult(activeCount, maxTerminals) {
  return {
    allowed: false,
    code: "TERMINAL_LIMIT_EXCEEDED",
    message: "Kontaktoni Revolution Invest për të shtuar terminale.",
    force_logout: true,
    active_count: activeCount,
    max_terminals: maxTerminals,
  };
}

const TERMINAL_REVOKED_MESSAGE =
  "Kjo arkë është çaktivizuar nga administratori. Kontaktoni administratorin për ta riaktivizuar.";

async function isTerminalRevoked(licenseId, deviceId) {
  const id = normalizeDeviceId(deviceId);
  if (!id) return false;
  const db = await dbOf(licenseId);
  const { data, error } = await db
    .from("license_terminal_revocations")
    .select("device_id")
    .eq("license_id", licenseId)
    .eq("device_id", id)
    .maybeSingle();
  if (error && !isMissingRelation(error)) throw error;
  return !!data?.device_id;
}

async function revokeTerminalAccess(licenseId, deviceId) {
  const id = normalizeDeviceId(deviceId);
  if (!id) return;
  const db = await dbOf(licenseId);
  const nowIso = new Date().toISOString();
  const { error } = await db.from("license_terminal_revocations").upsert(
    { license_id: licenseId, device_id: id, revoked_at: nowIso },
    { onConflict: "license_id,device_id" },
  );
  if (error && !isMissingRelation(error)) throw error;
}

async function clearTerminalRevocation(licenseId, deviceId) {
  const id = normalizeDeviceId(deviceId);
  if (!id) return;
  const db = await dbOf(licenseId);
  const { error } = await db
    .from("license_terminal_revocations")
    .delete()
    .eq("license_id", licenseId)
    .eq("device_id", id);
  if (error && !isMissingRelation(error)) throw error;
}

function arkaNumberOf(role) {
  if (!role) return MAX_ARKA + 1;
  const m = /^arka(\d+)$/.exec(normalizeTerminalRole(role));
  return m ? Number(m[1]) : MAX_ARKA + 1;
}

/** Arkat shtesë mbi limitin e Super Admin — numri më i lartë del i pari; Kryesorja kurrë. */
function secondaryTerminalsOverLimit(terminals, maxTerminals) {
  const primary = pickPrimaryTerminal(terminals);
  const secondaries = (terminals || [])
    .filter((t) => !primary || t.id !== primary.id)
    .sort((a, b) =>
      arkaNumberOf(a.terminal_role) - arkaNumberOf(b.terminal_role)
      || new Date(a.first_activated_at || 0).getTime() - new Date(b.first_activated_at || 0).getTime());
  return secondaries.slice(Math.max(0, Math.max(1, Number(maxTerminals) || 1) - 1));
}

/** Super Admin uli numrin e arkave → arkat e tepërta hiqen dhe çaktivizohen (të dhënat e tyre mbeten). */
async function enforceTerminalLimit(licenseId, maxTerminals) {
  const terminals = await listTerminalsOrdered(licenseId);
  const over = secondaryTerminalsOverLimit(terminals, maxTerminals);
  if (!over.length) return [];
  const db = await dbOf(licenseId);
  const removed = [];
  for (const t of over) {
    const { error } = await db.from("license_terminals").delete().eq("id", t.id);
    if (error) throw error;
    await revokeTerminalAccess(licenseId, t.device_id);
    removed.push(t.device_id);
  }
  return removed;
}

async function repairTerminalRolesForLicense(license) {
  const db = await dbOf(license.id);
  const { data: rows, error } = await db
    .from("license_terminals")
    .select("id, device_id, terminal_role, first_activated_at")
    .eq("license_id", license.id);
  if (error) throw error;
  if (!rows?.length) return;

  const primaryId = normalizeDeviceId(license.device_id);
  const sorted = [...rows].sort(
    (a, b) => new Date(a.first_activated_at || 0).getTime() - new Date(b.first_activated_at || 0).getTime(),
  );
  /* Kryesorja ekzistuese nuk zëvendësohet kurrë nga një arkë tjetër */
  let primaryRow =
    sorted.find((r) => r.terminal_role && isPrimaryTerminalRole(r.terminal_role))
    || (primaryId && rows.find((r) => normalizeDeviceId(r.device_id) === primaryId))
    || pickPrimaryTerminal(rows);
  if (!primaryRow) return;

  const primaryKey = normalizeDeviceId(primaryRow.device_id);
  if (!isPrimaryTerminalRole(primaryRow.terminal_role)) {
    await db
      .from("license_terminals")
      .update({ terminal_role: PRIMARY_TERMINAL_ROLE })
      .eq("id", primaryRow.id);
  }

  const used = new Set([PRIMARY_TERMINAL_ROLE]);
  for (const r of rows) {
    if (normalizeDeviceId(r.device_id) === primaryKey) continue;
    let role = normalizeTerminalRole(r.terminal_role);
    if (isPrimaryTerminalRole(role) || used.has(role)) {
      role = "arka2";
      for (let i = 2; i <= MAX_ARKA; i += 1) {
        const candidate = `arka${i}`;
        if (!used.has(candidate)) {
          role = candidate;
          break;
        }
      }
      await db.from("license_terminals").update({ terminal_role: role }).eq("id", r.id);
    }
    used.add(role);
  }
}

async function resolveTerminalAccess(license, deviceId, hostname, ip, hardwareId, opts = {}) {
  const id = normalizeDeviceId(deviceId);
  /* 1 PC = 1 çelës: pa device_id → refuzo (mos anashkalo) */
  if (!id) {
    return {
      allowed: false,
      code: "DEVICE_REQUIRED",
      message: "Mungon ID e pajisjes. Riaktivizoni licencën.",
      force_logout: true,
      active_count: 0,
      max_terminals: getMaxTerminals(license),
    };
  }

  if (await isTerminalRevoked(license.id, id)) {
    return {
      allowed: false,
      code: "TERMINAL_REVOKED",
      message: TERMINAL_REVOKED_MESSAGE,
      force_logout: true,
      active_count: 0,
      max_terminals: getMaxTerminals(license),
    };
  }

  const maxTerminals = getMaxTerminals(license);
  let terminals = await listTerminalsOrdered(license.id);
  let slotIndex = terminals.findIndex((t) => t.device_id === id);

  if (slotIndex < 0 && terminals.length === 0 && normalizeDeviceId(license.device_id) === id) {
    await migrateLegacyTerminal(license);
    terminals = await listTerminalsOrdered(license.id);
    slotIndex = terminals.findIndex((t) => t.device_id === id);
  }

  if (slotIndex >= 0) {
    await touchTerminal(license.id, id, { hostname, ip });
    const existing = terminals[slotIndex];
    if (
      existing &&
      !existing.terminal_role &&
      normalizeDeviceId(license.device_id) === id &&
      !(terminals || []).some((t) => isPrimaryTerminalRole(t.terminal_role))
    ) {
      const db = await dbOf(license.id);
      await db
        .from("license_terminals")
        .update({ terminal_role: PRIMARY_TERMINAL_ROLE })
        .eq("license_id", license.id)
        .eq("device_id", id);
    }
    terminals = await listTerminalsOrdered(license.id);
    slotIndex = terminals.findIndex((t) => t.device_id === id);
    if (terminals.length <= maxTerminals) await clearTerminalLimitGrace(license.id);

    const self = terminals[slotIndex];
    const isPrimarySelf = Boolean(self?.terminal_role && isPrimaryTerminalRole(self.terminal_role));
    const overSlot =
      !isPrimarySelf
      && secondaryTerminalsOverLimit(terminals, maxTerminals).some((t) => t.device_id === id);
    if (overSlot) {
      await enforceTerminalLimit(license.id, maxTerminals);
      return {
        allowed: false,
        code: "TERMINAL_REVOKED",
        message: TERMINAL_REVOKED_MESSAGE,
        force_logout: true,
        active_count: terminals.length,
        max_terminals: maxTerminals,
      };
    }
    return {
      allowed: true,
      active_count: terminals.length,
      max_terminals: maxTerminals,
      slot: slotIndex + 1,
    };
  }

  const pendingPairRole = opts.pendingPairRole
    ? normalizePairTerminalRole(opts.pendingPairRole)
    : null;
  const directRole = pendingPairRole || roleForDirectTerminalRegistration(terminals);

  /* Kryesorja (arka e parë) nuk fshihet dhe nuk zëvendësohet kurrë nga PC tjetër.
     Kur s'ka vend, PC e re bllokohet. */

  if (terminals.length < maxTerminals) {
    await insertTerminal(license.id, id, { hostname, ip, terminal_role: directRole });
    await clearTerminalLimitGrace(license.id);
    return {
      allowed: true,
      is_new: true,
      active_count: terminals.length + 1,
      max_terminals: maxTerminals,
    };
  }

  await startTerminalLimitGrace(license.id);
  return blockedResult(terminals.length, maxTerminals);
}

async function getTerminalSummaryForLicense(license) {
  await migrateLegacyTerminal(license);
  const terminals = await listTerminalsOrdered(license.id);
  const maxTerminals = getMaxTerminals(license);
  const activeCount = terminals.length;
  const grace = getGraceState(license);
  const limitReached = activeCount >= maxTerminals;
  const overLimit = activeCount > maxTerminals;

  return {
    max_terminals: maxTerminals,
    active_terminal_count: activeCount,
    terminal_price: Number(license.terminal_price) || 0,
    base_price: Number(license.base_price) || 0,
    total_price:
      (Number(license.base_price) || 0) +
      Math.max(0, maxTerminals - 1) * (Number(license.terminal_price) || 0),
    limit_reached: limitReached,
    over_limit: overLimit,
    in_grace: overLimit && grace.withinGrace,
    grace_until: grace.graceUntil,
    terminals,
  };
}

async function countOverLimitOnDb(db) {
  const { data: licenses, error } = await db
    .from("licenses")
    .select("id, max_terminals, terminal_limit_grace_at, statusi");
  if (error) throw error;

  let count = 0;
  for (const lic of licenses || []) {
    if (lic.statusi !== "aktive") continue;
    const { count: terminalCount, error: tErr } = await db
      .from("license_terminals")
      .select("id", { count: "exact", head: true })
      .eq("license_id", lic.id);
    if (tErr) continue;
    const max = getMaxTerminals(lic);
    if ((terminalCount || 0) >= max) count += 1;
  }
  return count;
}

async function countLicensesOverTerminalLimit() {
  let total = 0;
  for (const product of ["kafene"]) {
    try {
      total += await countOverLimitOnDb(getSupabaseForProduct(product));
    } catch {
      /* produkti mund të mos jetë i konfiguruar */
    }
  }
  return total;
}

module.exports = {
  TERMINAL_GRACE_MS,
  PRIMARY_TERMINAL_ROLE,
  normalizeDeviceId,
  normalizeTerminalRole,
  normalizePairTerminalRole,
  isPrimaryTerminalRole,
  getMaxTerminals,
  listTerminalsOrdered,
  migrateLegacyTerminal,
  repairTerminalRolesForLicense,
  resolveTerminalAccess,
  getTerminalSummaryForLicense,
  clearSecondaryTerminals,
  pickPrimaryTerminal,
  secondaryTerminalsOverLimit,
  enforceTerminalLimit,
  revokeTerminalAccess,
  clearTerminalRevocation,
  isTerminalRevoked,
  TERMINAL_REVOKED_MESSAGE,
  countLicensesOverTerminalLimit,
  calcLicenseTotalPrice(basePrice, maxTerminals, terminalPrice) {
    const base = Number(basePrice) || 0;
    const max = Math.max(1, Number(maxTerminals) || 1);
    const extra = Math.max(0, max - 1);
    return base + extra * (Number(terminalPrice) || 0);
  },
  insertTerminal,
};
