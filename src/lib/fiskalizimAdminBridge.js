/**
 * Bridge te serveri i Revolution Fiskalizim (projekt i ndarë).
 * POS admin panel lexon/shkruan licencat Fiskalizim përmes këtij moduli —
 * zero përzierje me Supabase të restorantit.
 */
const https = require("https");

const FISKALIZIM_UPSTREAM =
  process.env.FISKALIZIM_UPSTREAM || "fiskalizim-production-6573.up.railway.app";
const FISKALIZIM_ADMIN_SECRET =
  process.env.FISKALIZIM_ADMIN_SECRET ||
  process.env.SUPER_ADMIN_SECRET ||
  process.env.ADMIN_SECRET ||
  "naser-fiskalizim-2026";

const FISKALE_SECTORS = [
  {
    num: 1,
    id: "fiskale",
    label: "Kasa fiskale / biznes fiskal",
    keywords: ["fiskale", "fiscal"],
  },
];

function fiskalizimRequest(path, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: FISKALIZIM_UPSTREAM.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        port: 443,
        path: `/fiskalizim/api/admin${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": FISKALIZIM_ADMIN_SECRET,
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
            const err = new Error(parsed.gabim || parsed.message || `Fiskalizim upstream ${res.statusCode}`);
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

function emptyFiskaleSectors(bridgeError) {
  const sectors = FISKALE_SECTORS.map((s) => ({
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
    product_line: "fiskale",
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

async function getFiskalizimClientsGrouped() {
  try {
    const licView = await getFiskalizimLicensesView();
    const licenses = licView.licenses || [];
    const sectors = FISKALE_SECTORS.map((s) => ({
      num: s.num,
      id: s.id,
      label: s.label,
      keywords: s.keywords || [],
      clients: [],
      count: 0,
    }));
    const bucket = sectors[0];
    const seen = new Set();

    for (const l of licenses) {
      const cid = String(l.client_id || "").trim();
      if (!cid || seen.has(cid)) continue;
      seen.add(cid);
      bucket.clients.push({
        id: cid,
        emri: l.client_name || "—",
        tipi: "fiskale",
        tipi_label: bucket.label,
        email: "",
        telefoni: "",
        status: ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase())
          ? "aktiv"
          : "joaktiv",
        sales_today: 0,
        icon: "🧾",
        sector_num: bucket.num,
        sector_id: bucket.id,
        product_line: "fiskale",
        hardware_id: l.hardware_id || "",
        license_id: l.id,
      });
    }
    bucket.count = bucket.clients.length;

    return {
      sectors,
      groups: sectors,
      total: bucket.clients.length,
      product_line: "fiskale",
    };
  } catch (e) {
    console.warn("[fiskalizimAdminBridge] clients:", e.message || e);
    return emptyFiskaleSectors(e.message || "Fiskalizim serveri nuk përgjigjet");
  }
}

async function getFiskalizimClientDetail(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit Fiskalizim.");

  const licView = await getFiskalizimLicensesView();
  const licenses = (licView.licenses || []).filter((l) => String(l.client_id) === cid);
  const first = licenses[0];
  const sector = FISKALE_SECTORS[0];

  if (!first) {
    throw new Error("Klienti Fiskalizim nuk u gjet.");
  }

  return {
    client: {
      id: cid,
      emri: first.client_name || "—",
      tipi: sector.id,
      tipi_label: sector.label,
      email: "",
      telefoni: "",
      adresa: "",
      status: "aktiv",
      product_line: "fiskale",
    },
    licenses: licenses.map((l) => ({
      id: l.id,
      client_id: l.client_id || cid,
      celesi: l.license_key || l.celesi || "",
      license_key: l.license_key || l.celesi || "",
      hardware_id: l.hardware_id || l.device_id || "",
      statusi: l.statusi || "aktive",
      data_skadimit: l.data_skadimit || null,
      product_line: "fiskale",
      app_type: "fiskalizim",
    })),
    owners: [],
    product_line: "fiskale",
  };
}

async function getFiskalizimLicensesView() {
  try {
    const data = await fiskalizimRequest("/licenses");
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
        product_line: "fiskale",
        app_type: l.app_type || "fiskalizim",
      })),
      product_line: "fiskale",
    };
  } catch (e) {
    console.warn("[fiskalizimAdminBridge] licenses:", e.message || e);
    return {
      licenses: [],
      product_line: "fiskale",
      bridge_error: e.message || "Fiskalizim serveri nuk përgjigjet",
    };
  }
}

async function getFiskalizimOverview() {
  try {
    const grouped = await getFiskalizimClientsGrouped();
    const licView = await getFiskalizimLicensesView();
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
      product_line: "fiskale",
      bridge_error: grouped.bridge_error || licView.bridge_error || "",
    };
  } catch (e) {
    return {
      active_clients: 0,
      licenses_active: 0,
      licenses_total: 0,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "fiskale",
      bridge_error: e.message || "Fiskalizim serveri nuk përgjigjet",
    };
  }
}

async function registerFiskalizimClient(body = {}) {
  const hw = String(body.hardware_id || body.hardwareId || "").trim();
  if (!hw) {
    const err = new Error("ID e pajisjes (16 shenja) është e detyrueshme për Fiskalizim.");
    err.status = 400;
    throw err;
  }
  const result = await fiskalizimRequest("/clients/register-license", {
    method: "POST",
    body: {
      emri: body.emri,
      email: body.owner_email || body.email,
      telefon: body.telefoni || body.telefon,
      adresa: body.adresa,
      hardware_id: hw,
      license_key: body.celesi || body.license_key || undefined,
      app_type: "fiskalizim",
    },
  });
  return {
    client: result.client || null,
    license: result.license || null,
    license_key: result.license_key || result.license?.license_key || body.celesi || "",
    hardware_id: hw,
    product_line: "fiskale",
    app_type: "fiskalizim",
    already_exists: !!result.already_exists,
  };
}

async function deleteFiskalizimClient(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit Fiskalizim.");
  return fiskalizimRequest(`/clients/${encodeURIComponent(cid)}`, { method: "DELETE" });
}

async function deleteFiskalizimLicense(id) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës Fiskalizim.");
  return fiskalizimRequest(`/licenses/${encodeURIComponent(lid)}`, { method: "DELETE" });
}

async function revokeFiskalizimLicense(id, { status = "revoked" } = {}) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës Fiskalizim.");
  return fiskalizimRequest(`/licenses/${encodeURIComponent(lid)}/status`, {
    method: "POST",
    body: { status },
  });
}

module.exports = {
  FISKALE_SECTORS,
  getFiskalizimClientsGrouped,
  getFiskalizimClientDetail,
  getFiskalizimLicensesView,
  getFiskalizimOverview,
  registerFiskalizimClient,
  deleteFiskalizimClient,
  deleteFiskalizimLicense,
  revokeFiskalizimLicense,
};
