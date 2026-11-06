const https = require("https");
const { URL } = require("url");
const { getPublicAppOrigin } = require("./publicOrigin");

const PRODUCTS = {
  butika: {
    prefix: "/butika/api/admin",
    secretEnv: "BUTIKA_ADMIN_SECRET",
    defaultSecret: "naser-butika-2026",
    label: "Butik",
    app_type: "butika",
  },
  dyqanet: {
    prefix: "/dyqanet/api/admin",
    secretEnv: "DYQANET_ADMIN_SECRET",
    defaultSecret: "naser-dyqanet-2026",
    label: "Dyqan",
    app_type: "dyqanet",
  },
  argjendari: {
    prefix: "/argjendari/api/admin",
    secretEnv: "ARGJENDARI_ADMIN_SECRET",
    defaultSecret: "naser-argjendari-2026",
    label: "Argjendari",
    app_type: "argjendari",
  },
  barnatore: {
    prefix: "/barnatore/api/admin",
    secretEnv: "BARNATORE_ADMIN_SECRET",
    defaultSecret: "naser-barnatore-2026",
    label: "Barnatore",
    app_type: "barnatore",
  },
};

const RETAIL_PRODUCTS = new Set(Object.keys(PRODUCTS));

function isRetailProduct(product) {
  return RETAIL_PRODUCTS.has(String(product || "").trim().toLowerCase());
}

function cfg(product) {
  const c = PRODUCTS[String(product || "").trim().toLowerCase()];
  if (!c) throw new Error("Produkt i panjohur.");
  return c;
}

function secretFor(c) {
  return (
    process.env[c.secretEnv] ||
    process.env.SUPER_ADMIN_SECRET ||
    process.env.ADMIN_SECRET ||
    c.defaultSecret
  );
}

function request(product, path, { method = "GET", body } = {}) {
  const c = cfg(product);
  const origin = new URL(getPublicAppOrigin());
  const payload = body ? JSON.stringify(body) : null;
  const reqPath = `${c.prefix}${path.startsWith("/") ? path : `/${path}`}`;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: origin.hostname,
        port: origin.port || 443,
        path: reqPath,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-admin-secret": secretFor(c),
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
            const err = new Error(parsed.gabim || parsed.message || `${c.label} upstream ${res.statusCode}`);
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

function mapLicense(product, l) {
  const c = cfg(product);
  return {
    id: l.id,
    client_id: l.client_id || l.clients?.id || "",
    client_name: l.clients?.emri || l.client_name || "—",
    device_id: l.device_id || l.hardware_id || "",
    hardware_id: l.hardware_id || "",
    license_key: l.license_key || l.celesi || "",
    celesi: l.license_key || l.celesi || "",
    statusi: l.status || l.statusi || "aktive",
    data_skadimit: l.expires_at || l.data_skadimit || null,
    activated_at: l.created_at || null,
    last_seen_at: l.last_seen_at || null,
    product_line: product,
    app_type: l.app_type || c.app_type,
  };
}

function emptySectors(product, bridgeError) {
  const c = cfg(product);
  const sector = {
    num: 1,
    id: product,
    label: c.label,
    keywords: [product],
    clients: [],
    count: 0,
  };
  return {
    sectors: [sector],
    groups: [sector],
    total: 0,
    product_line: product,
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

async function getRetailLicensesView(product) {
  const data = await request(product, "/licenses");
  const licenses = Array.isArray(data.licenses) ? data.licenses : [];
  return {
    licenses: licenses.map((l) => mapLicense(product, l)),
    product_line: product,
  };
}

async function getRetailClientsGrouped(product) {
  try {
    const licView = await getRetailLicensesView(product);
    const packed = emptySectors(product);
    const bucket = packed.sectors[0];
    const seen = new Set();
    for (const l of licView.licenses || []) {
      const cid = String(l.client_id || "").trim();
      if (!cid || seen.has(cid)) continue;
      seen.add(cid);
      const active = ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase());
      bucket.clients.push({
        id: cid,
        emri: l.client_name || "—",
        tipi: product,
        tipi_label: cfg(product).label,
        email: "",
        telefoni: "",
        status: active ? "aktiv" : "joaktiv",
        sales_today: 0,
        icon: "🏪",
        sector_num: 1,
        sector_id: product,
        product_line: product,
        hardware_id: l.hardware_id || "",
        license_id: l.id,
      });
    }
    bucket.count = bucket.clients.length;
    packed.total = bucket.clients.length;
    return packed;
  } catch (e) {
    return emptySectors(product, e.message || "Serveri nuk përgjigjet");
  }
}

async function getRetailClientDetail(product, id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit.");
  const licView = await getRetailLicensesView(product);
  const licenses = (licView.licenses || []).filter((l) => String(l.client_id) === cid);
  const first = licenses[0];
  if (!first) throw new Error("Klienti nuk u gjet.");
  return {
    client: {
      id: cid,
      emri: first.client_name || "—",
      tipi: product,
      tipi_label: cfg(product).label,
      email: "",
      telefoni: "",
      adresa: "",
      status: "aktiv",
      product_line: product,
    },
    licenses,
    owners: [],
    product_line: product,
  };
}

async function getRetailOverview(product) {
  try {
    const grouped = await getRetailClientsGrouped(product);
    const licView = await getRetailLicensesView(product);
    const clients = grouped.sectors?.[0]?.clients || [];
    const active = clients.filter((row) => row.status === "aktiv").length;
    return {
      active_clients: active,
      clients_total: clients.length,
      licenses_total: (licView.licenses || []).length,
      licenses_active: (licView.licenses || []).filter((l) =>
        ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase()),
      ).length,
      trial_accounts: 0,
      online_count: 0,
      sales_today_total: 0,
      problem_clients: [],
      weekly_sales: [],
      product_line: product,
      expiring_count: 0,
      expired_count: 0,
      expiring_clients: [],
      expired_clients: [],
    };
  } catch (e) {
    return {
      active_clients: 0,
      clients_total: 0,
      licenses_total: 0,
      licenses_active: 0,
      product_line: product,
      bridge_error: e.message || "Serveri nuk përgjigjet",
    };
  }
}

async function updateRetailLicense(product, id, body = {}) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës.");
  const data = await request(product, `/licenses/${encodeURIComponent(lid)}`, {
    method: "PATCH",
    body: body || {},
  });
  const license = mapLicense(product, data.license || data);
  return { ok: true, license, product_line: product };
}

async function rotateRetailLicenseKey(product, id, body = {}) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës.");
  const data = await request(product, `/licenses/${encodeURIComponent(lid)}/rotate-key`, {
    method: "POST",
    body: {},
  });
  const hw = String(body?.hardware_id || body?.hardwareId || "").trim();
  let license = data.license || data;
  if (hw) {
    const patched = await request(product, `/licenses/${encodeURIComponent(lid)}`, {
      method: "PATCH",
      body: { hardware_id: hw },
    });
    license = patched.license || license;
  }
  const mapped = mapLicense(product, license);
  return {
    ok: true,
    license: mapped,
    license_key: mapped.license_key,
    celesi: mapped.celesi,
    product_line: product,
  };
}

async function deleteRetailClient(product, id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit.");
  return request(product, `/clients/${encodeURIComponent(cid)}`, { method: "DELETE" });
}

async function registerRetailClient(product, body = {}) {
  const data = await request(product, "/clients/register-license", {
    method: "POST",
    body: {
      emri: body.emri,
      email: body.email,
      telefon: body.telefon || body.telefoni,
      adresa: body.adresa,
      hardware_id: body.hardware_id || body.hardwareId,
      license_key: body.celesi || body.license_key,
    },
  });
  const lic = data.license || {};
  return {
    client: data.client || lic.clients || { id: lic.client_id, emri: body.emri || "" },
    license: lic,
    license_key: data.license_key || lic.license_key || "",
    hardware_id: lic.hardware_id || body.hardware_id || body.hardwareId || "",
    already_exists: !!data.already_exists,
    product_line: product,
  };
}

module.exports = {
  RETAIL_PRODUCTS,
  isRetailProduct,
  getRetailLicensesView,
  getRetailClientsGrouped,
  getRetailClientDetail,
  getRetailOverview,
  updateRetailLicense,
  rotateRetailLicenseKey,
  registerRetailClient,
  deleteRetailClient,
};
