const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { trimEnv } = require("../lib/env");
const { getPublicAppOrigin } = require("../lib/publicOrigin");
const { findUserByEmail, verifyUserPassword } = require("./licenseService");
const { buildOwnerAuthContext } = require("./ownerGroupService");
const { ownerEntryPath } = require("../lib/productUrls");
const {
  isEmailConfigured,
  sendOwnerPermanentPinEmail,
  sendOwnerAccessRecoveryEmail,
} = require("./emailService");

const WRONG = "Email ose fjalëkalimi gabim";
const MAX_TRIES = 5;
const tries = new Map();
const forgotAt = new Map();

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const STEP_COOKIE = { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 };
const PIN_COOKIE = { ...COOKIE_BASE, maxAge: 180 * 24 * 60 * 60 * 1000 };

function jwtSecret() {
  const secret = trimEnv("JWT_SECRET");
  if (!secret || secret.length < 16) return "";
  return secret;
}

function signKind(userId, kind, expiresIn) {
  const secret = jwtSecret();
  if (!secret || !userId) return "";
  return jwt.sign({ sub: String(userId), kind }, secret, { expiresIn });
}

function readKind(token, kind) {
  const secret = jwtSecret();
  if (!secret || !token) return "";
  try {
    const payload = jwt.verify(String(token), secret);
    if (payload?.kind !== kind || !payload.sub) return "";
    return String(payload.sub);
  } catch {
    return "";
  }
}

function issueStepToken(userId) {
  return signKind(userId, "kycu_step", "15m");
}

function readStepToken(token) {
  return readKind(token, "kycu_step");
}

function pinKey() {
  const secret = jwtSecret();
  if (!secret) return null;
  return crypto.createHash("sha256").update(`kycu-pin:${secret}`).digest();
}

function encryptPin(pin) {
  const key = pinKey();
  if (!key) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(pin), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${enc.toString("hex")}`;
}

function decryptPin(packed) {
  try {
    const key = pinKey();
    const [ivH, tagH, encH] = String(packed || "").split(".");
    if (!key || !ivH || !tagH || !encH) return "";
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivH, "hex"));
    decipher.setAuthTag(Buffer.from(tagH, "hex"));
    const pin = Buffer.concat([
      decipher.update(Buffer.from(encH, "hex")),
      decipher.final(),
    ]).toString("utf8");
    return /^\d{6}$/.test(pin) ? pin : "";
  } catch {
    return "";
  }
}

function newPin() {
  return String(crypto.randomInt(100000, 1000000));
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function tokenMatches(cookie, storedHash) {
  const stored = String(storedHash || "");
  if (!cookie || stored.length !== 64) return false;
  const hash = tokenHash(cookie);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(stored));
}

function missingColumn(error) {
  const msg = String(error?.message || error?.details || "");
  return error?.code === "PGRST204" || /security_pin|pin_saved_token/i.test(msg);
}

async function writePin(userId, pin, extra) {
  const db = getSupabase();
  const patch = {
    security_pin: await bcrypt.hash(pin, 12),
    security_pin_enc: encryptPin(pin),
    pin_saved_token: null,
    ...extra,
  };
  const { error } = await db.from("users").update(patch).eq("id", userId).eq("roli", "client_admin");
  if (error) {
    console.error("[kycu] pin:", missingColumn(error) ? "mungon kolona security_pin" : error.message);
    return false;
  }
  return true;
}

async function clearSavedPin(userId) {
  const db = getSupabase();
  await db
    .from("users")
    .update({ security_pin: null, security_pin_enc: null, pin_saved_token: null, aktiv: true })
    .eq("id", userId);
}

async function assignPermanentPin(user) {
  if (!user?.id || !user.email || !isEmailConfigured()) return false;
  const pin = newPin();
  const saved = await writePin(user.id, pin, { aktiv: false, invite_expires_at: null });
  if (!saved) return false;
  try {
    await sendOwnerPermanentPinEmail({
      to: user.email,
      emri: user.emri,
      code: pin,
    });
    return true;
  } catch (err) {
    await clearSavedPin(user.id);
    console.error("[kycu] pin email:", err.message);
    return false;
  }
}

async function loadClient(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("clients")
    .select("id, emri, tipi, kitchen_slug")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function panelUrl(client) {
  const entry = ownerEntryPath(client);
  if (!entry || entry.includes("?") || entry.includes("key=")) return "/owner/panel";
  return `${entry}/panel`;
}

async function finishSession(user) {
  if (user.aktiv === false) {
    const db = getSupabase();
    const { error } = await db
      .from("users")
      .update({ aktiv: true, invite_expires_at: null })
      .eq("id", user.id)
      .eq("roli", "client_admin");
    if (error) throw error;
    user.aktiv = true;
  }
  const client = await loadClient(user.client_id);
  const authPayload = await buildOwnerAuthContext(user, { clientId: user.client_id });
  return { authPayload, url: panelUrl(client) };
}

function ownerOk(user) {
  return Boolean(user && user.roli === "client_admin" && user.client_id && user.passwordi);
}

async function startKycu({ email, password, pinToken }) {
  const user = await findUserByEmail(email);
  if (!ownerOk(user)) return { status: 401, body: { ok: false, gabim: WRONG } };
  const ok = await verifyUserPassword(user, password);
  if (!ok) return { status: 401, body: { ok: false, gabim: WRONG } };

  if (!user.security_pin) {
    if (user.aktiv === false) {
      return { status: 403, body: { ok: false, gabim: "Llogaria është e çaktivizuar." } };
    }
    const session = await finishSession(user);
    return { status: 200, done: true, ...session };
  }

  if (user.aktiv !== false && tokenMatches(pinToken, user.pin_saved_token)) {
    const session = await finishSession(user);
    return { status: 200, done: true, ...session };
  }

  return { status: 200, stepUserId: user.id, body: { ok: true, step: "code" } };
}

async function confirmKycu({ email, code, remember, stepUserId }) {
  const user = await findUserByEmail(email);
  if (!ownerOk(user) || String(user.id) !== String(stepUserId) || !user.security_pin) {
    return {
      status: 401,
      body: { ok: false, gabim: "Hyrja skadoi. Shkruaj email-in dhe fjalëkalimin përsëri." },
    };
  }
  const given = String(code || "").trim();
  const match = /^\d{6}$/.test(given) && (await bcrypt.compare(given, user.security_pin));
  if (!match) {
    const n = (tries.get(user.id) || 0) + 1;
    tries.set(user.id, n);
    if (n >= MAX_TRIES) {
      tries.delete(user.id);
      return {
        status: 401,
        reset: true,
        body: { ok: false, gabim: "Kodi është gabim. Hyni përsëri." },
      };
    }
    return { status: 401, body: { ok: false, gabim: "Kodi është gabim." } };
  }
  tries.delete(user.id);

  const db = getSupabase();
  let pinCookie = "";
  if (remember) {
    pinCookie = crypto.randomBytes(32).toString("hex");
    const { error } = await db
      .from("users")
      .update({ pin_saved_token: tokenHash(pinCookie) })
      .eq("id", user.id);
    if (error) pinCookie = "";
  } else {
    await db.from("users").update({ pin_saved_token: null }).eq("id", user.id);
  }

  const session = await finishSession(user);
  return {
    status: 200,
    done: true,
    remember: Boolean(pinCookie),
    pinCookie,
    clearPinCookie: !pinCookie,
    ...session,
  };
}

async function forgotKycu({ email, newCode }) {
  const generic = {
    ok: true,
    message: "Nëse ky email është i regjistruar, shiko kutinë.",
  };
  const e = String(email || "").trim().toLowerCase();
  if (!e) return generic;
  const last = forgotAt.get(e) || 0;
  if (Date.now() - last < 60 * 1000) return generic;
  const user = await findUserByEmail(e);
  if (!ownerOk(user)) return generic;
  if (!isEmailConfigured()) {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    throw err;
  }

  let pin = decryptPin(user.security_pin_enc);
  let renewed = false;
  if (newCode || (user.security_pin && !pin)) {
    pin = newPin();
    const saved = await writePin(user.id, pin, {});
    if (!saved) {
      const err = new Error("Kodi nuk u ruajt.");
      throw err;
    }
    renewed = true;
    user.security_pin_enc = encryptPin(pin);
  }
  if (!pin && user.security_pin) pin = "";

  const resetToken = signKind(user.id, "kycu_reset", "1h");
  const link = `${getPublicAppOrigin()}/kycu?reset=${encodeURIComponent(resetToken)}`;
  await sendOwnerAccessRecoveryEmail({
    to: user.email,
    emri: user.emri,
    code: pin,
    renewed,
    link,
  });
  forgotAt.set(e, Date.now());
  return generic;
}

async function resetPasswordWithLink({ token, password }) {
  const userId = readKind(token, "kycu_reset");
  const pw = String(password || "").trim();
  if (!userId) {
    const err = new Error("Lidhja skadoi. Kërkoje përsëri.");
    err.code = "CODE_EXPIRED";
    throw err;
  }
  if (pw.length < 6) {
    const err = new Error("Fjalëkalimi min. 6 karaktere.");
    throw err;
  }
  const db = getSupabase();
  const { data: user, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!ownerOk(user)) {
    const err = new Error("Llogaria nuk u gjet.");
    throw err;
  }
  const hash = await bcrypt.hash(pw, 12);
  const nowIso = new Date().toISOString();
  const { error: updErr } = await db
    .from("users")
    .update({ passwordi: hash, password_set_at: nowIso })
    .eq("id", user.id);
  if (updErr) throw updErr;
  try {
    const { recordPosAdminPasswordSha256 } = require("./posAdminPasswordSyncService");
    if (user.client_id) await recordPosAdminPasswordSha256(user.client_id, pw, nowIso);
  } catch (err) {
    console.warn("[kycu] POS sync:", err.message);
  }
  return { ok: true, message: "Fjalëkalimi u ndryshua. Hyr me fjalëkalimin e ri dhe kodin." };
}

async function pinRemembered(userId, cookie) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("pin_saved_token")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return tokenMatches(cookie, data.pin_saved_token);
}

async function setPinRemember(userId, remember) {
  const db = getSupabase();
  if (!remember) {
    const { error } = await db.from("users").update({ pin_saved_token: null }).eq("id", userId);
    if (error) throw error;
    return { clear: true };
  }
  const token = crypto.randomBytes(32).toString("hex");
  const { error } = await db
    .from("users")
    .update({ pin_saved_token: tokenHash(token) })
    .eq("id", userId);
  if (error) throw error;
  return { token };
}

async function replaceOwnerPin(userId) {
  const db = getSupabase();
  const { data: user, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!ownerOk(user)) {
    const err = new Error("Llogaria nuk u gjet.");
    throw err;
  }
  if (!isEmailConfigured()) {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    throw err;
  }
  const pin = newPin();
  const saved = await writePin(user.id, pin, {});
  if (!saved) {
    const err = new Error("Kodi nuk u ruajt.");
    throw err;
  }
  await sendOwnerPermanentPinEmail({ to: user.email, emri: user.emri, code: pin, renewed: true });
  return { ok: true };
}

module.exports = {
  WRONG,
  STEP_COOKIE,
  PIN_COOKIE,
  assignPermanentPin,
  startKycu,
  confirmKycu,
  forgotKycu,
  resetPasswordWithLink,
  pinRemembered,
  setPinRemember,
  replaceOwnerPin,
  issueStepToken,
  readStepToken,
};
