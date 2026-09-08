/**
 * Bridge te serveri i Revolution Kontabilisti (projekt i ndarë).
 * Super Admin (telefon) regjistron/liston licencat — zero përzierje me Supabase të restorantit.
 */
const https = require("https");

const KONTABILISTI_UPSTREAM =
  process.env.KONTABILISTI_UPSTREAM || "revolution-kontabilisti-production.up.railway.app";
const KONTABILISTI_ADMIN_SECRET =
  process.env.KONTABILISTI_ADMIN_SECRET ||
  process.env.SUPER_ADMIN_SECRET ||
  process.env.ADMIN_SECRET ||
  "naser-kontabilisti-2026";

const KONTABILISTI_SECTORS = [
  {
    num: 1,
    id: "kontabiliste",
    label: "Kontabilistë / zyra kontabiliteti",
    keywords: ["kontabilist"],
  },
];

function kontabilistiRequest(path, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const host = KONTABILISTI_UPSTREAM.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const req = https.request(
      {
        hostname: host,
        port: 443,
        path: `/api/admin${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": KONTABILISTI_ADMIN_SECRET,
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
            const err = new Error(parsed.gabim || parsed.message || `Kontabilisti upstream ${res.statusCode}`);
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

function emptyKontabilistiSectors(bridgeError) {
  const sectors = KONTABILISTI_SECTORS.map((s) => ({
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
    product_line: "kontabilisti",
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

function mapLicenseRow(l) {
  const active = String(l.status || l.statusi || "").toLowerCase() === "active"
    || String(l.statusi || "").toLowerCase() === "aktive";
  return {
    id: l.id,
    client_id: l.client_id || l.id,
    client_name: l.client_name || l.business_name || "—",
    device_id: l.device_id || l.hardware_id || "",
    hardware_id: l.hardware_id || l.device_id || "",
    license_key: l.license_key || l.celesi || l.id || "",
    celesi: l.license_key || l.celesi || l.id || "",
    statusi: active ? "aktive" : l.statusi || l.status || "skaduar",
    status: l.status || (active ? "active" : "suspended"),
    data_skadimit: l.data_skadimit || String(l.expires_at || "").slice(0, 10) || null,
    expires_at: l.expires_at || l.data_skadimit || null,
    last_check_at: l.last_check_at || l.last_seen_at || null,
    product_line: "kontabilisti",
    app_type: "kontabilisti",
  };
}

async function getKontabilistiLicensesView() {
  try {
    const data = await kontabilistiRequest("/licenses");
    const licenses = Array.isArray(data.licenses) ? data.licenses.map(mapLicenseRow) : [];
    return { licenses, product_line: "kontabilisti" };
  } catch (e) {
    console.warn("[kontabilistiAdminBridge] licenses:", e.message || e);
    return {
      licenses: [],
      product_line: "kontabilisti",
      bridge_error: e.message || "Kontabilisti serveri nuk përgjigjet",
    };
  }
}

async function getKontabilistiClientsGrouped() {
  try {
    const licView = await getKontabilistiLicensesView();
    const licenses = licView.licenses || [];
    const sectors = KONTABILISTI_SECTORS.map((s) => ({
      num: s.num,
      id: s.id,
      label: s.label,
      keywords: s.keywords || [],
      clients: [],
      count: 0,
    }));
    const bucket = sectors[0];

    for (const l of licenses) {
      const cid = String(l.client_id || l.id || "").trim();
      if (!cid) continue;
      bucket.clients.push({
        id: cid,
        emri: l.client_name || "—",
        tipi: "kontabiliste",
        tipi_label: bucket.label,
        email: "",
        telefoni: "",
        status: ["aktive", "active", "aktiv"].includes(String(l.statusi || l.status || "").toLowerCase())
          ? "aktiv"
          : "joaktiv",
        sales_today: 0,
        icon: "📊",
        sector_num: bucket.num,
        sector_id: bucket.id,
        product_line: "kontabilisti",
        hardware_id: l.hardware_id || l.device_id || "",
        device_id: l.device_id || l.hardware_id || "",
        license_id: l.id,
      });
    }
    bucket.count = bucket.clients.length;

    return {
      sectors,
      groups: sectors,
      total: bucket.clients.length,
      product_line: "kontabilisti",
    };
  } catch (e) {
    console.warn("[kontabilistiAdminBridge] clients:", e.message || e);
    return emptyKontabilistiSectors(e.message || "Kontabilisti serveri nuk përgjigjet");
  }
}

async function getKontabilistiClientDetail(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit Kontabilisti.");

  const licView = await getKontabilistiLicensesView();
  const licenses = (licView.licenses || []).filter(
    (l) => String(l.client_id || l.id) === cid || String(l.id) === cid,
  );
  const first = licenses[0];
  const sector = KONTABILISTI_SECTORS[0];

  if (!first) {
    throw new Error("Klienti Kontabilisti nuk u gjet.");
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
      product_line: "kontabilisti",
    },
    licenses: licenses.map((l) => ({
      id: l.id,
      client_id: l.client_id || cid,
      celesi: l.license_key || l.celesi || "",
      license_key: l.license_key || l.celesi || "",
      hardware_id: l.hardware_id || l.device_id || "",
      device_id: l.device_id || l.hardware_id || "",
      statusi: l.statusi || "aktive",
      data_skadimit: l.data_skadimit || null,
      product_line: "kontabilisti",
      app_type: "kontabilisti",
    })),
    owners: [],
    product_line: "kontabilisti",
  };
}

async function getKontabilistiOverview() {
  try {
    const grouped = await getKontabilistiClientsGrouped();
    const licView = await getKontabilistiLicensesView();
    const active = (grouped.sectors || []).reduce(
      (n, s) => n + (s.clients || []).filter((c) => c.status === "aktiv").length,
      0,
    );
    const licActive = (licView.licenses || []).filter((l) =>
      ["aktive", "active", "aktiv"].includes(String(l.statusi || l.status || "").toLowerCase()),
    ).length;
    return {
      active_clients: active,
      licenses_active: licActive,
      licenses_total: (licView.licenses || []).length,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "kontabilisti",
      bridge_error: grouped.bridge_error || licView.bridge_error || "",
    };
  } catch (e) {
    return {
      active_clients: 0,
      licenses_active: 0,
      licenses_total: 0,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "kontabilisti",
      bridge_error: e.message || "Kontabilisti serveri nuk përgjigjet",
    };
  }
}

async function registerKontabilistiClient(body = {}) {
  const hw = String(body.hardware_id || body.hardwareId || body.device_id || "").trim();
  if (!hw) {
    const err = new Error("Hardware ID (XXXX-XXXX-XXXX-XXXX) është i detyrueshëm për Kontabilisti.");
    err.status = 400;
    throw err;
  }
  const result = await kontabilistiRequest("/clients/register-license", {
    method: "POST",
    body: {
      emri: body.emri,
      email: body.owner_email || body.email,
      telefon: body.telefoni || body.telefon,
      adresa: body.adresa,
      hardware_id: hw,
      device_id: hw,
      owner_emri: body.owner_emri,
      owner_name: body.owner_emri,
      nui: body.nui,
      muaj: body.muaj,
      duration_months: body.muaj || body.duration_months,
      plan: body.plan || "standard",
      app_type: "kontabilisti",
    },
  });
  return {
    client: result.client || null,
    license: result.license || null,
    license_key: result.license_key || result.license?.license_key || result.license?.id || "",
    hardware_id: hw,
    device_id: hw,
    product_line: "kontabilisti",
    app_type: "kontabilisti",
    already_exists: !!result.already_exists,
    expires_at: result.expires_at || result.license?.expires_at || null,
  };
}

module.exports = {
  KONTABILISTI_SECTORS,
  getKontabilistiClientsGrouped,
  getKontabilistiClientDetail,
  getKontabilistiLicensesView,
  getKontabilistiOverview,
  registerKontabilistiClient,
};
