/**
 * Bridge te serveri i Revolution Security (projekt i ndarë).
 * POS admin panel lexon/shkruan firmat Security përmes këtij moduli —
 * zero përzierje me Supabase të restorantit.
 */
const https = require("https");

const SECURITY_UPSTREAM =
  process.env.SECURITY_UPSTREAM || "revolution-security-production.up.railway.app";
const SECURITY_ADMIN_SECRET =
  process.env.SECURITY_ADMIN_SECRET ||
  process.env.SUPER_ADMIN_SECRET ||
  process.env.ADMIN_SECRET ||
  "naser-security-2026";

const SECURITY_SECTORS = [
  { num: 1, id: "kompani_sigurie", label: "Kompani sigurie (rojë, patrulla)", keywords: ["siguri", "roje"] },
  {
    num: 2,
    id: "transport_logjistike",
    label: "Kompani transporti (shoferë, autobusë, kamionë)",
    keywords: ["transport"],
  },
  { num: 3, id: "ndertimtari", label: "Kompani ndërtimi (punëtorë kantieri)", keywords: ["ndertim"] },
  { num: 4, id: "pastrim", label: "Kompani pastrimi (pastrues, sanitizim)", keywords: ["pastrim"] },
  {
    num: 5,
    id: "kuriere_dergesa",
    label: "Posta / shërbime dërgese (postierë, korrierë)",
    keywords: ["poste", "dergese"],
  },
  {
    num: 6,
    id: "mirembajtje_nderte",
    label: "Kompani mirëmbajtje (teknikanë, instalues)",
    keywords: ["mirembajtje"],
  },
  { num: 7, id: "magazinim", label: "Kompani magazinimi (depo, punëtorë magazine)", keywords: ["magazin"] },
  {
    num: 8,
    id: "agjenci_marketingu",
    label: "Agjenci marketingu në terren (promotorë)",
    keywords: ["marketing"],
  },
];

function sectorForVeprimtari(id) {
  return SECURITY_SECTORS.find((s) => s.id === id) || SECURITY_SECTORS[0];
}

function securityRequest(path, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: SECURITY_UPSTREAM,
        port: 443,
        path: `/security/api/admin${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": SECURITY_ADMIN_SECRET,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data || "{}");
          } catch {
            parsed = {};
          }
          if (res.statusCode >= 400) {
            const err = new Error(parsed.gabim || parsed.message || `Security upstream ${res.statusCode}`);
            err.status = res.statusCode;
            return reject(err);
          }
          resolve(parsed);
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function emptySecuritySectors(bridgeError) {
  const sectors = SECURITY_SECTORS.map((s) => ({
    num: s.num,
    id: s.id,
    label: s.label,
    keywords: s.keywords || [],
    clients: [],
    count: 0,
  }));
  return {
    sectors,
    groups: sectors,
    total: 0,
    product_line: "security",
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

async function getSecurityClientsGrouped() {
  try {
    const data = await securityRequest("/clients");
    const clients = Array.isArray(data.clients) ? data.clients : Array.isArray(data) ? data : [];
    const sectors = SECURITY_SECTORS.map((s) => ({
      num: s.num,
      id: s.id,
      label: s.label,
      keywords: s.keywords || [],
      clients: [],
      count: 0,
    }));
    const byId = new Map(sectors.map((s) => [s.id, s]));

    for (const c of clients) {
      const sector = sectorForVeprimtari(c.veprimtari || "kompani_sigurie");
      const bucket = byId.get(sector.id) || sectors[0];
      bucket.clients.push({
        id: c.id,
        emri: c.emri,
        tipi: sector.id,
        tipi_label: sector.label,
        email: c.email || "",
        telefoni: c.telefon || c.telefoni || "",
        status: "aktiv",
        sales_today: 0,
        icon: "🛡️",
        sector_num: bucket.num,
        sector_id: bucket.id,
        product_line: "security",
      });
      bucket.count = bucket.clients.length;
    }

    return {
      sectors,
      groups: sectors,
      total: clients.length,
      product_line: "security",
    };
  } catch (e) {
    console.warn("[securityAdminBridge] clients:", e.message || e);
    return emptySecuritySectors(e.message || "Security serveri nuk përgjigjet");
  }
}

async function getSecurityClientDetail(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit Security.");

  let client = null;
  let licenses = [];

  try {
    const data = await securityRequest(`/clients/${encodeURIComponent(cid)}`);
    client = data.client || data;
    licenses = Array.isArray(data.licenses) ? data.licenses : [];
  } catch (e) {
    const grouped = await getSecurityClientsGrouped();
    const all = (grouped.sectors || []).flatMap((s) => s.clients || []);
    client = all.find((c) => String(c.id) === cid) || null;
    if (!client) throw e;
  }

  if (!licenses.length) {
    try {
      const licView = await getSecurityLicensesView();
      licenses = (licView.licenses || []).filter((l) => String(l.client_id) === cid);
    } catch {
      licenses = [];
    }
  }

  const sector = sectorForVeprimtari(client.veprimtari || client.tipi || "kompani_sigurie");
  return {
    client: {
      id: client.id,
      emri: client.emri,
      tipi: sector.id,
      tipi_label: sector.label,
      email: client.email || "",
      telefoni: client.telefon || client.telefoni || "",
      adresa: client.adresa || "",
      status: client.status || "aktiv",
      product_line: "security",
      veprimtari: client.veprimtari || sector.id,
    },
    licenses: licenses.map((l) => ({
      id: l.id,
      client_id: l.client_id || cid,
      celesi: l.license_key || l.celesi || "",
      license_key: l.license_key || l.celesi || "",
      hardware_id: l.hardware_id || l.device_id || "",
      statusi: l.status || l.statusi || "aktive",
      data_skadimit: l.expires_at || l.data_skadimit || null,
      product_line: "security",
    })),
    owners: [],
    product_line: "security",
  };
}

async function getSecurityLicensesView() {
  try {
    const data = await securityRequest("/licenses");
    const licenses = Array.isArray(data.licenses) ? data.licenses : Array.isArray(data) ? data : [];
    return {
      licenses: licenses.map((l) => ({
        id: l.id,
        client_id: l.client_id,
        client_name: l.clients?.emri || l.client_name || "—",
        device_id: l.device_id || "",
        hardware_id: l.hardware_id || "",
        license_key: l.license_key || l.celesi || "",
        statusi: l.status || l.statusi || "aktive",
        activated_at: l.created_at || l.activated_at || null,
        last_seen_at: l.last_seen_at || null,
        product_line: "security",
      })),
      product_line: "security",
    };
  } catch (e) {
    console.warn("[securityAdminBridge] licenses:", e.message || e);
    return {
      licenses: [],
      product_line: "security",
      bridge_error: e.message || "Security serveri nuk përgjigjet",
    };
  }
}

async function getSecurityOverview() {
  try {
    const grouped = await getSecurityClientsGrouped();
    const licView = await getSecurityLicensesView();
    const active = (grouped.sectors || []).reduce(
      (n, s) => n + (s.clients || []).filter((c) => c.status === "aktiv").length,
      0,
    );
    const licActive = (licView.licenses || []).filter((l) =>
      ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase()),
    ).length;
    return {
      active_clients: active,
      licenses_active: licActive,
      licenses_total: (licView.licenses || []).length,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "security",
      bridge_error: grouped.bridge_error || licView.bridge_error || "",
    };
  } catch (e) {
    return {
      active_clients: 0,
      licenses_active: 0,
      licenses_total: 0,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "security",
      bridge_error: e.message || "Security serveri nuk përgjigjet",
    };
  }
}

async function registerSecurityClient(body = {}) {
  const hw = String(body.hardware_id || body.hardwareId || "").trim();
  if (!hw) {
    const err = new Error("ID e pajisjes (16 shenja) është e detyrueshme për Security.");
    err.status = 400;
    throw err;
  }
  const result = await securityRequest("/clients/register-license", {
    method: "POST",
    body: {
      emri: body.emri,
      email: body.email,
      telefon: body.telefoni || body.telefon,
      adresa: body.adresa,
      veprimtari: body.veprimtari || body.tipi || "kompani_sigurie",
      hardware_id: hw,
      license_key: body.celesi || body.license_key || undefined,
    },
  });
  return {
    client: result.client || null,
    license: result.license || null,
    license_key: result.license_key || result.license?.license_key || body.celesi || "",
    hardware_id: hw,
    product_line: "security",
    already_exists: !!result.already_exists,
  };
}

async function deleteSecurityClient(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit Security.");
  return securityRequest(`/clients/${encodeURIComponent(cid)}`, { method: "DELETE" });
}

async function deleteSecurityLicense(id) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës Security.");
  return securityRequest(`/licenses/${encodeURIComponent(lid)}`, { method: "DELETE" });
}

async function revokeSecurityLicense(id, { status = "revoked" } = {}) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës Security.");
  return securityRequest(`/licenses/${encodeURIComponent(lid)}/status`, {
    method: "POST",
    body: { status },
  });
}

function mapSecurityStatusToUpstream(statusi) {
  const s = String(statusi || "").toLowerCase();
  if (["aktive", "active", "aktiv"].includes(s)) return "active";
  if (["revokuar", "revoked"].includes(s)) return "revoked";
  if (["pezulluar", "suspended"].includes(s)) return "suspended";
  if (["skaduar", "expired"].includes(s)) return "expired";
  return s || "active";
}

function mapSecurityLicenseRow(l, clientId) {
  return {
    id: l.id,
    client_id: l.client_id || clientId,
    celesi: l.license_key || l.celesi || "",
    license_key: l.license_key || l.celesi || "",
    hardware_id: l.hardware_id || l.device_id || "",
    statusi:
      l.status === "active" || l.statusi === "aktive"
        ? "aktive"
        : l.status === "revoked" || l.statusi === "revokuar"
          ? "revokuar"
          : l.statusi || l.status || "aktive",
    data_skadimit: l.expires_at || l.data_skadimit || null,
    product_line: "security",
  };
}

async function updateSecurityClient(id, body = {}) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit Security.");
  const clientPatch = {};
  if (body.emri != null) clientPatch.emri = body.emri;
  if (body.email != null) clientPatch.email = body.email;
  if (body.telefoni != null || body.telefon != null) clientPatch.telefon = body.telefoni || body.telefon;
  if (body.adresa != null) clientPatch.adresa = body.adresa;
  if (body.tipi || body.veprimtari) clientPatch.veprimtari = body.tipi || body.veprimtari;

  let client = null;
  if (Object.keys(clientPatch).length) {
    const r = await securityRequest(`/clients/${encodeURIComponent(cid)}`, {
      method: "PATCH",
      body: clientPatch,
    });
    client = r.client;
  }

  const licenses = [];
  const license_errors = [];
  for (const lp of Array.isArray(body.licenses) ? body.licenses : []) {
    if (!lp?.id) continue;
    try {
      const patch = {};
      if (lp.statusi != null) patch.status = mapSecurityStatusToUpstream(lp.statusi);
      if (lp.hardware_id != null) patch.hardware_id = lp.hardware_id;
      if (lp.celesi != null) patch.license_key = lp.celesi;
      if (lp.data_skadimit != null) patch.expires_at = lp.data_skadimit;
      if (!Object.keys(patch).length) continue;
      const r = await securityRequest(`/licenses/${encodeURIComponent(lp.id)}`, {
        method: "PATCH",
        body: patch,
      });
      licenses.push(mapSecurityLicenseRow(r.license || r, cid));
    } catch (e) {
      license_errors.push({ id: lp.id, gabim: e.message || "Gabim licence" });
    }
  }

  if (!client) {
    const detail = await getSecurityClientDetail(cid);
    client = detail.client;
  }
  return { client, licenses, license_errors, product_line: "security" };
}

async function reactivateSecurityLicense(id) {
  return revokeSecurityLicense(id, { status: "active" });
}

async function extendSecurityLicense(id, months = 12) {
  const lid = String(id || "").trim();
  const detail = await securityRequest("/licenses");
  const licenses = Array.isArray(detail.licenses) ? detail.licenses : [];
  const lic = licenses.find((l) => String(l.id) === lid);
  const base =
    lic?.expires_at && String(lic.expires_at).slice(0, 10) > new Date().toISOString().slice(0, 10)
      ? String(lic.expires_at).slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  const d = new Date(base);
  d.setMonth(d.getMonth() + Math.max(1, Math.min(36, Number(months) || 12)));
  const r = await securityRequest(`/licenses/${encodeURIComponent(lid)}`, {
    method: "PATCH",
    body: { expires_at: d.toISOString().slice(0, 10), status: "active" },
  });
  return {
    license: mapSecurityLicenseRow(r.license || r),
    data_skadimit: d.toISOString().slice(0, 10),
    months,
  };
}

async function rotateSecurityLicenseKey(id) {
  const crypto = require("crypto");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(16);
  const part = (offset) => {
    let s = "";
    for (let i = 0; i < 4; i += 1) s += chars[bytes[offset + i] % chars.length];
    return s;
  };
  const key = `${part(0)}-${part(4)}-${part(8)}-${part(12)}`;
  const r = await securityRequest(`/licenses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { license_key: key },
  });
  return {
    license: mapSecurityLicenseRow(r.license || r),
    license_key: key,
    celesi: key,
    rotated: true,
  };
}

async function updateSecurityLicense(id, patch = {}) {
  const body = { ...patch };
  if (patch.statusi != null) body.status = mapSecurityStatusToUpstream(patch.statusi);
  if (patch.celesi != null) body.license_key = patch.celesi;
  delete body.statusi;
  delete body.celesi;
  delete body.product_line;
  const r = await securityRequest(`/licenses/${encodeURIComponent(id)}`, { method: "PATCH", body });
  return mapSecurityLicenseRow(r.license || r);
}

module.exports = {
  SECURITY_SECTORS,
  getSecurityClientsGrouped,
  getSecurityClientDetail,
  getSecurityLicensesView,
  getSecurityOverview,
  registerSecurityClient,
  updateSecurityClient,
  updateSecurityLicense,
  deleteSecurityClient,
  deleteSecurityLicense,
  revokeSecurityLicense,
  reactivateSecurityLicense,
  extendSecurityLicense,
  rotateSecurityLicenseKey,
};
