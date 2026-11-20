const crypto = require("crypto");
const https = require("https");
const http = require("http");
const { getSupabase } = require("../db");
const { trimEnv } = require("../lib/env");
const { arkaDeviceId } = require("./arkaService");

const KEY_DEVICE = "KEY";
const GENESIS_HASH = crypto
  .createHash("sha256")
  .update("REVOLUTION_FISCAL_HASH_CHAIN_GENESIS_v1")
  .digest("hex")
  .toUpperCase();
const VAT = { A: 0, B: 0, C: 0, D: 8, E: 18 };
const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function round4(n) {
  return Math.round((Number(n) || 0) * 10000) / 10000;
}

function toCents(eur) {
  return Math.round(round4(eur) * 100);
}

function toPriceUnits(eur) {
  return Math.round(round4(eur) * 10000);
}

function keyBytes() {
  const secret = trimEnv("JWT_SECRET");
  if (!secret || secret.length < 16) throw new Error("JWT_SECRET mungon");
  return crypto.createHash("sha256").update(`arka-fiscal:${secret}`).digest();
}

function encryptText(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${enc.toString("hex")}`;
}

function decryptText(packed) {
  const [ivH, tagH, encH] = String(packed || "").split(".");
  if (!ivH || !tagH || !encH) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(ivH, "hex"));
  decipher.setAuthTag(Buffer.from(tagH, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encH, "hex")), decipher.final()]).toString("utf8");
}

function varint(n) {
  let v = BigInt(n);
  if (v < 0n) v = (1n << 64n) + v;
  const out = [];
  while (v > 127n) {
    out.push(Number((v & 127n) | 128n));
    v >>= 7n;
  }
  out.push(Number(v));
  return Buffer.from(out);
}

function tag(field, wire) {
  return varint((field << 3) | wire);
}

function fieldVarint(field, n) {
  if (!n) return Buffer.alloc(0);
  return Buffer.concat([tag(field, 0), varint(n)]);
}

function fieldString(field, value) {
  const s = String(value || "");
  if (!s) return Buffer.alloc(0);
  const b = Buffer.from(s, "utf8");
  return Buffer.concat([tag(field, 2), varint(b.length), b]);
}

function fieldFloat(field, num) {
  const b = Buffer.alloc(4);
  b.writeFloatLE(Number(num) || 0, 0);
  return Buffer.concat([tag(field, 5), b]);
}

function fieldMsg(field, buf) {
  if (!buf || !buf.length) return Buffer.alloc(0);
  return Buffer.concat([tag(field, 2), varint(buf.length), buf]);
}

function encodeCouponItem(item) {
  return Buffer.concat([
    fieldString(1, item.name),
    fieldVarint(2, item.price),
    fieldString(3, item.unit),
    fieldFloat(4, item.quantity),
    fieldVarint(5, item.total),
    fieldString(6, item.taxRate),
    fieldString(7, item.type),
    fieldVarint(8, item.discount),
  ]);
}

function encodePayment(p) {
  return Buffer.concat([fieldVarint(1, p.type), fieldVarint(2, p.amount)]);
}

function encodeTax(g) {
  return Buffer.concat([
    fieldString(1, g.taxRate),
    fieldVarint(2, g.totalForTax),
    fieldVarint(3, g.totalTax),
  ]);
}

function encodePosCoupon(coupon) {
  const parts = [
    fieldVarint(1, coupon.businessId),
    fieldVarint(2, coupon.couponId),
    fieldVarint(3, coupon.branchId),
    fieldString(4, coupon.location),
    fieldString(5, coupon.operatorId),
    fieldVarint(6, coupon.posId),
    fieldVarint(7, coupon.applicationId),
    fieldString(8, coupon.verificationNo),
    fieldVarint(9, coupon.type),
    fieldVarint(10, coupon.time),
  ];
  for (const item of coupon.items || []) parts.push(fieldMsg(11, encodeCouponItem(item)));
  for (const pay of coupon.payments || []) parts.push(fieldMsg(12, encodePayment(pay)));
  parts.push(fieldVarint(13, coupon.total));
  for (const g of coupon.taxGroups || []) parts.push(fieldMsg(14, encodeTax(g)));
  parts.push(fieldVarint(15, coupon.totalTax));
  parts.push(fieldVarint(16, coupon.totalNoTax));
  parts.push(fieldVarint(17, coupon.referenceNo));
  parts.push(fieldVarint(18, coupon.transactionNo));
  parts.push(fieldVarint(19, coupon.totalDiscount));
  return Buffer.concat(parts);
}

function nuikf() {
  const ts = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const rnd = crypto.randomBytes(8).toString("hex").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (ts + rnd + ALPHANUM).replace(/[^A-Z0-9]/g, "").slice(0, 16).padEnd(16, "0");
}

function buildCoupon(sale, staff, state, number, code) {
  const items = Array.isArray(sale.items_json) ? sale.items_json : [];
  const lines = items.map((it) => {
    const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
    const gross = round4((Number(it.price) || 0) * qty);
    const letter = "E";
    const rate = VAT[letter];
    const tax = (gross * rate) / (100 + rate);
    return { name: String(it.name || "").slice(0, 128), qty, gross, letter, tax, net: gross - tax };
  });
  const grossTotal = lines.reduce((s, l) => s + l.gross, 0);
  const taxTotal = lines.reduce((s, l) => s + l.tax, 0);
  const couponItems = lines.map((l) => ({
    name: l.name,
    price: toPriceUnits(l.qty ? l.gross / l.qty : 0),
    unit: "EA",
    quantity: l.qty,
    total: toCents(l.gross),
    taxRate: l.letter,
    type: "TT",
    discount: 0,
  }));
  const taxGroups = [];
  const netE = lines.reduce((s, l) => s + l.net, 0);
  if (toCents(netE) || toCents(taxTotal)) {
    taxGroups.push({ taxRate: "E", totalForTax: toCents(netE), totalTax: toCents(taxTotal) });
  }
  const payType = String(sale.payment_method || "").toLowerCase() === "cash" ? 1 : 2;
  return {
    businessId: Number(String(state.atk_tin || "").replace(/\D/g, "")) || 0,
    couponId: number,
    branchId: Number(String(state.atk_bus_unit || "").replace(/\D/g, "")) || 1,
    location: "",
    operatorId: String(staff.id || "").slice(0, 64),
    posId: Number(String(state.atk_pos_id || "").replace(/\D/g, "")) || 0,
    applicationId: Number(String(state.atk_application_id || "").replace(/\D/g, "")) || 0,
    verificationNo: code,
    type: 1,
    time: Math.floor(Date.now() / 1000),
    items: couponItems,
    payments: [{ type: payType, amount: toCents(grossTotal) }],
    total: toCents(grossTotal),
    taxGroups,
    totalTax: toCents(taxTotal),
    totalNoTax: toCents(grossTotal - taxTotal),
    referenceNo: 0,
    transactionNo: 0,
    totalDiscount: 0,
  };
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function chainHash(prev, payload) {
  return crypto
    .createHash("sha256")
    .update(String(prev || GENESIS_HASH).trim().toUpperCase())
    .update("|")
    .update(stableStringify(payload))
    .digest("hex")
    .toUpperCase();
}

function signDetails(privatePem, details) {
  return crypto.sign("sha256", Buffer.from(details, "utf8"), { key: privatePem, dsaEncoding: "der" }).toString("base64");
}

function postJson(url, bodyObj) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve({ ok: false, error: "URL e ATK është e gabuar" });
      return;
    }
    const lib = parsed.protocol === "http:" ? http : https;
    const body = JSON.stringify(bodyObj);
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 25000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => { data += c; });
        res.on("end", () => {
          let json = null;
          try { json = data ? JSON.parse(data) : null; } catch { json = null; }
          const status = Number(res.statusCode) || 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json,
            body: data,
            unreachable: false,
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, unreachable: true, error: "ATK nuk u përgjigj" });
    });
    req.on("error", (err) => {
      resolve({ ok: false, unreachable: true, error: err.message || "ATK nuk u arrit" });
    });
    req.write(body);
    req.end();
  });
}

function atkUrl(raw) {
  const s = String(raw || "").trim().replace(/\/+$/, "");
  if (!s) return "https://fiskalizimi-test.atk-ks.org/pos/coupon";
  if (/\/pos\/coupon$/i.test(s)) return s;
  return `${s}/pos/coupon`;
}

async function loadKey(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("fiscal_state")
    .select("private_key_enc, certificate_pem, atk_tin, atk_bus_unit, atk_pos_id, atk_application_id, atk_api_url")
    .eq("business_id", clientId)
    .eq("device_id", KEY_DEVICE)
    .maybeSingle();
  if (error) throw error;
  if (!data?.private_key_enc) return null;
  let privateKey = "";
  try {
    privateKey = decryptText(data.private_key_enc);
  } catch {
    privateKey = "";
  }
  if (!privateKey.includes("PRIVATE KEY")) return null;
  return { ...data, privateKey };
}

async function saveFiscalKey(clientId, body) {
  const privateKey = String(body?.private_key_pem || "").trim();
  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    const err = new Error("Çelësi privat mungon.");
    err.status = 400;
    throw err;
  }
  if (!crypto.createPrivateKey(privateKey).asymmetricKeyType?.includes("ec")) {
    const err = new Error("Çelësi duhet të jetë ECDSA.");
    err.status = 400;
    throw err;
  }
  const tin = String(body?.atk_tin || "").replace(/\D/g, "");
  const unit = String(body?.atk_bus_unit || "").trim();
  const posId = String(body?.atk_pos_id || "").trim();
  const appId = String(body?.atk_application_id || "").trim();
  if (!tin || !unit || !posId || !appId) {
    const err = new Error("Plotësoni NUI, njësinë, POS dhe Application ID.");
    err.status = 400;
    throw err;
  }
  const db = getSupabase();
  const row = {
    business_id: clientId,
    device_id: KEY_DEVICE,
    certificate_pem: body?.certificate_pem ? encryptText(String(body.certificate_pem)) : "",
    private_key_enc: encryptText(privateKey),
    atk_tin: tin,
    atk_bus_unit: unit,
    atk_pos_id: posId,
    atk_application_id: appId,
    atk_api_url: String(body?.atk_api_url || "").trim(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("fiscal_state").upsert(row, { onConflict: "business_id,device_id" });
  if (error) throw new Error(error.message || "Çelësi nuk u ruajt.");
  return { ok: true };
}

async function nextNumber(clientId, deviceId, hash) {
  const db = getSupabase();
  for (let i = 0; i < 5; i += 1) {
    const { data: row } = await db
      .from("fiscal_state")
      .select("id, last_invoice_number, last_invoice_hash")
      .eq("business_id", clientId)
      .eq("device_id", deviceId)
      .maybeSingle();
    const current = Number(row?.last_invoice_number) || 0;
    const next = current + 1;
    if (!row) {
      const { error } = await db.from("fiscal_state").insert({
        business_id: clientId,
        device_id: deviceId,
        last_invoice_number: next,
        last_invoice_hash: hash || "",
        updated_at: new Date().toISOString(),
      });
      if (!error) return { number: next, previous: GENESIS_HASH };
      continue;
    }
    const { data: updated, error } = await db
      .from("fiscal_state")
      .update({
        last_invoice_number: next,
        last_invoice_hash: hash || row.last_invoice_hash || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("last_invoice_number", current)
      .select("last_invoice_number")
      .maybeSingle();
    if (!error && updated) {
      const prev = String(row.last_invoice_hash || "").trim().toUpperCase();
      return { number: next, previous: prev || GENESIS_HASH };
    }
  }
  throw new Error("Numri i kuponit nuk u rezervua.");
}

async function rememberHash(clientId, deviceId, hash) {
  const db = getSupabase();
  await db
    .from("fiscal_state")
    .update({ last_invoice_hash: hash, updated_at: new Date().toISOString() })
    .eq("business_id", clientId)
    .eq("device_id", deviceId);
}

function resultFrom(send, number, code, queued) {
  const tx = send?.json?.transaction_id || send?.json?.transactionId || "";
  return {
    ok: !queued && !!send?.ok,
    queued: !!queued,
    fiscal_number: number,
    nuikf: code,
    transaction_id: tx || "",
    gabim: queued ? "ATK nuk u arrit. Shitja u ruajt. Provoni përsëri." : "",
  };
}

async function sendStored(row, state) {
  const payload = row.payload || {};
  const send = await postJson(atkUrl(state.atk_api_url), {
    details: payload.details,
    signature: payload.signature,
  });
  const db = getSupabase();
  if (send.ok) {
    await db.from("fiscal_queue").update({
      status: "sent",
      attempts: Number(row.attempts || 0) + 1,
      last_error: "",
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    return resultFrom(send, row.coupon_number, row.nuikf, false);
  }
  const queued = !!send.unreachable || Number(send.status) >= 500;
  await db.from("fiscal_queue").update({
    status: queued ? "pending" : "failed",
    attempts: Number(row.attempts || 0) + 1,
    last_error: String(send.error || send.body || "ATK refuzoi").slice(0, 300),
    updated_at: new Date().toISOString(),
  }).eq("id", row.id);
  if (queued) return resultFrom(send, row.coupon_number, row.nuikf, true);
  const err = new Error(send.error || "ATK e refuzoi kuponin.");
  err.status = 400;
  throw err;
}

async function fiscalizeArkaSale(clientId, staff, saleId) {
  const db = getSupabase();
  const { data: sale, error } = await db
    .from("sales_orders")
    .select("id, items_json, total, payment_method, status, client_id")
    .eq("id", saleId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!sale) {
    const err = new Error("Shitja nuk u gjet.");
    err.status = 404;
    throw err;
  }
  const state = await loadKey(clientId);
  if (!state) {
    const err = new Error("Çelësi fiskal nuk është konfiguruar — kontakto administratorin");
    err.status = 409;
    err.code = "NO_KEY";
    throw err;
  }
  const deviceId = arkaDeviceId(staff.id);
  const { data: pending } = await db
    .from("fiscal_queue")
    .select("id, payload, attempts, coupon_number, nuikf, status")
    .eq("business_id", clientId)
    .eq("sale_id", sale.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pending?.payload?.details) return sendStored(pending, state);

  const code = nuikf();
  const reserved = await nextNumber(clientId, deviceId, "");
  const coupon = buildCoupon(sale, staff, state, reserved.number, code);
  const details = encodePosCoupon(coupon).toString("base64");
  const signature = signDetails(state.privateKey, details);
  const payloadObj = {
    v: 1,
    sale_id: sale.id,
    nuikf: code,
    daily_number: reserved.number,
    total_number: reserved.number,
    total_amount: round4(sale.total),
    payment_method: sale.payment_method || "cash",
  };
  const hash = chainHash(reserved.previous, payloadObj);
  await rememberHash(clientId, deviceId, hash);
  const send = await postJson(atkUrl(state.atk_api_url), { details, signature });
  const queued = !send.ok && (!!send.unreachable || Number(send.status) >= 500 || !send.status);
  await db.from("fiscal_queue").insert({
    business_id: clientId,
    device_id: deviceId,
    sale_id: sale.id,
    nuikf: code,
    coupon_number: reserved.number,
    payload: { details, signature },
    status: send.ok ? "sent" : queued ? "pending" : "failed",
    last_error: send.ok ? "" : String(send.error || send.body || "").slice(0, 300),
    attempts: 1,
    updated_at: new Date().toISOString(),
  });
  if (send.ok) return resultFrom(send, reserved.number, code, false);
  if (queued) return resultFrom(send, reserved.number, code, true);
  const err = new Error("ATK e refuzoi kuponin. Shitja mbetet e ruajtur.");
  err.status = 400;
  throw err;
}

const RETRY_MS = 60 * 1000;
let retryTimer = null;

async function processFiscalQueue() {
  const db = getSupabase();
  const { data, error } = await db
    .from("fiscal_queue")
    .select("id, business_id, payload, attempts, coupon_number, nuikf, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);
  if (error || !data?.length) return;
  const keys = new Map();
  for (const row of data) {
    if (!row?.payload?.details) continue;
    let state = keys.get(row.business_id);
    if (state === undefined) {
      try {
        state = await loadKey(row.business_id);
      } catch {
        state = null;
      }
      keys.set(row.business_id, state);
    }
    if (!state) continue;
    try {
      await sendStored(row, state);
    } catch {
      /* refuzimi i ATK mbetet i shënuar te radha */
    }
  }
}

function startFiscalRetryMonitor() {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    processFiscalQueue().catch(() => {});
  }, RETRY_MS);
  if (typeof retryTimer.unref === "function") retryTimer.unref();
}

module.exports = {
  saveFiscalKey,
  fiscalizeArkaSale,
  startFiscalRetryMonitor,
  encodePosCoupon,
  GENESIS_HASH,
};
