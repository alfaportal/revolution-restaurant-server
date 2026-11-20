const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { authOwner, signToken, verifyToken } = require("../middleware/auth");
const { OWNER_COOKIE_OPTS } = require("../lib/ownerSession");
const {
  loginArkaWithPin,
  getArkaStaffById,
  getArkaTables,
  listArkaCategories,
  listArkaProducts,
  searchArkaProducts,
  completeArkaSale,
  arkaDeviceId,
} = require("../services/arkaService");
const { fiscalizeArkaSale } = require("../services/fiscalServerService");
const {
  queueArkaPrint,
  pollPrintJobs,
  reportPrintStatus,
  getPrintJob,
} = require("../services/printServerService");

const router = express.Router();
const STAFF_COOKIE = "arka_staff";

function staffCookieOpts() {
  return { ...OWNER_COOKIE_OPTS, path: "/" };
}

function readStaff(req) {
  const raw = req.cookies?.[STAFF_COOKIE];
  if (!raw) return null;
  try {
    const payload = verifyToken(raw);
    if (payload?.kind !== "arka_staff") return null;
    return payload;
  } catch {
    return null;
  }
}

function sameClient(req) {
  return String(req.user?.client_id || "") === String(req.kitchenClient?.id || "");
}

async function requireArkaStaff(req, res) {
  if (!sameClient(req)) {
    res.status(403).json({ ok: false, gabim: "Kjo arkë është e biznesit tjetër.", code: "WRONG_BUSINESS" });
    return null;
  }
  const staffTok = readStaff(req);
  if (!staffTok || String(staffTok.client_id) !== String(req.kitchenClient.id)) {
    res.status(401).json({ ok: false, gabim: "Hyni me PIN të arkës.", code: "PIN_REQUIRED" });
    return null;
  }
  const staff = await getArkaStaffById(req.kitchenClient.id, staffTok.staff_id);
  if (!staff) {
    res.clearCookie(STAFF_COOKIE, { path: "/" });
    res.status(403).json({ ok: false, gabim: "Ky person nuk është i arkës.", code: "NOT_ARKA" });
    return null;
  }
  return staff;
}

router.use("/:slug", resolveKitchenClient);

router.get("/:slug/session", authOwner, async (req, res) => {
  if (!sameClient(req)) {
    return res.status(403).json({ ok: false, gabim: "Kjo arkë është e biznesit tjetër.", code: "WRONG_BUSINESS" });
  }
  const staffTok = readStaff(req);
  let staff = null;
  if (staffTok && String(staffTok.client_id) === String(req.kitchenClient.id)) {
    staff = await getArkaStaffById(req.kitchenClient.id, staffTok.staff_id);
    if (!staff) res.clearCookie(STAFF_COOKIE, { path: "/" });
  }
  res.set("Cache-Control", "no-store");
  res.json({
    ok: true,
    kycu: true,
    business: req.kitchenClient.emri || req.kitchenClient.kitchen_slug || "",
    staff,
  });
});

router.post("/:slug/pin", authOwner, async (req, res) => {
  try {
    if (!sameClient(req)) {
      return res.status(403).json({ ok: false, gabim: "Kjo arkë është e biznesit tjetër.", code: "WRONG_BUSINESS" });
    }
    const staff = await loginArkaWithPin(req.kitchenClient.id, req.body?.pin);
    const token = signToken({
      kind: "arka_staff",
      staff_id: staff.id,
      client_id: req.kitchenClient.id,
      name: staff.name,
    });
    res.cookie(STAFF_COOKIE, token, staffCookieOpts());
    res.json({ ok: true, staff: { id: staff.id, name: staff.name } });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/logout-pin", authOwner, (req, res) => {
  res.clearCookie(STAFF_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/:slug/tables", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const data = await getArkaTables(req.kitchenClient.id);
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, staff, ...data });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/categories", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const categories = await listArkaCategories(req.kitchenClient.id);
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, categories });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/products/search/:query", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const products = await searchArkaProducts(req.kitchenClient.id, req.params.query);
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, products });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/products/:categoryId", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const products = await listArkaProducts(req.kitchenClient.id, req.params.categoryId);
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, products });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/fiscal", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const saleId = String(req.body?.sale_id || "").trim();
    if (!saleId) return res.status(400).json({ ok: false, gabim: "Shitja mungon." });
    const out = await fiscalizeArkaSale(req.kitchenClient.id, staff, saleId);
    res.json(out);
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message, code: e.code || "" });
  }
});

router.post("/:slug/print", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const out = await queueArkaPrint(
      req.kitchenClient.id,
      staff,
      req.body || {},
      req.kitchenClient.emri || "",
    );
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/print/poll/:deviceId", async (req, res) => {
  try {
    const jobs = await pollPrintJobs(req.kitchenClient.id, String(req.params.deviceId || ""));
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, jobs });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/print/status", async (req, res) => {
  try {
    const out = await reportPrintStatus(req.kitchenClient.id, req.body || {});
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/print/job/:jobId", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const out = await getPrintJob(req.kitchenClient.id, arkaDeviceId(staff.id), req.params.jobId);
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/sale", authOwner, async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const result = await completeArkaSale(req.kitchenClient.id, staff, req.body || {});
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
