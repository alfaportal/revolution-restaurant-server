const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { signToken, verifyToken } = require("../middleware/auth");
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

async function requireArkaStaff(req, res) {
  const staffTok = readStaff(req);
  if (!staffTok || String(staffTok.client_id) !== String(req.kitchenClient.id)) {
    if (staffTok) res.clearCookie(STAFF_COOKIE, { path: "/" });
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

router.get("/:slug/session", async (req, res) => {
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

router.post("/:slug/pin", async (req, res) => {
  try {
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

router.post("/:slug/logout-pin", (req, res) => {
  res.clearCookie(STAFF_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/:slug/tables", async (req, res) => {
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

router.get("/:slug/categories", async (req, res) => {
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

router.get("/:slug/products/search/:query", async (req, res) => {
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

router.get("/:slug/products/:categoryId", async (req, res) => {
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

router.post("/:slug/fiscal", async (req, res) => {
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

router.post("/:slug/print", async (req, res) => {
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

router.get("/:slug/print/job/:jobId", async (req, res) => {
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

router.post("/:slug/order", async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const result = await completeArkaSale(req.kitchenClient.id, staff, {
      ...(req.body || {}),
      keep_open: true,
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/z-report", async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const { buildDailyZReport } = require("../services/zReportService");
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const report = await buildDailyZReport(req.kitchenClient.id, day);
    const cash = Number(report.payment_totals && report.payment_totals.cash) || 0;
    const card = Number(report.payment_totals && report.payment_totals.karte) || 0;
    res.json({
      ok: true,
      date: report.report_date,
      business: report.business_name || "",
      cash,
      card,
      total: Math.round((cash + card) * 100) / 100,
      sales: Array.isArray(report.sales) ? report.sales.length : 0,
      coupons: report.coupon_count || 0,
    });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/sale", async (req, res) => {
  try {
    const staff = await requireArkaStaff(req, res);
    if (!staff) return;
    const result = await completeArkaSale(req.kitchenClient.id, staff, {
      ...(req.body || {}),
      keep_open: false,
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
