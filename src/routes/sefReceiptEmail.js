/**
 * POST /api/sef/receipt-email — dërgim kupon fiskal SEF te konsumatori (Resend).
 * Thirret nga Revolution POS SEF desktop (BIZNES).
 */
const express = require("express");
const {
  isEmailConfigured,
  sendFiscalReceiptConsumerEmail,
} = require("../services/emailService");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_PER_IP = 30;
const ipHits = new Map();

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  let bucket = ipHits.get(ip);
  if (!bucket || now - bucket.start > RATE_WINDOW_MS) {
    bucket = { start: now, count: 0 };
    ipHits.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX_PER_IP) {
    return false;
  }
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (now - v.start > RATE_WINDOW_MS) ipHits.delete(k);
    }
  }
  return true;
}

function isValidEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function verifyApiKey(req) {
  const expected = String(process.env.SEF_EMAIL_API_KEY || "").trim();
  if (!expected) return true;
  const got = String(req.headers["x-sef-email-key"] || "").trim();
  return got === expected;
}

router.post(
  "/receipt-email",
  asyncHandler(async (req, res) => {
    if (!verifyApiKey(req)) {
      return res.status(401).json({ ok: false, error: "API key i pavlefshëm" });
    }
    if (!checkRateLimit(clientIp(req))) {
      return res.status(429).json({ ok: false, error: "Shumë kërkesa — provoni më vonë." });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({
        ok: false,
        error: "Emaili nuk është i konfiguruar në server (RESEND_API_KEY).",
      });
    }

    const body = req.body || {};
    const to = String(body.to || "").trim().toLowerCase();
    if (!isValidEmail(to)) {
      return res.status(400).json({ ok: false, error: "Email i pavlefshëm." });
    }

    const receiptText = String(body.receipt_text || "").trim();
    if (!receiptText || receiptText.length > 50000) {
      return res.status(400).json({ ok: false, error: "Teksti i kuponit mungon ose është shumë i gjatë." });
    }

    const nuikf = String(body.nuikf || "").trim();
    const qr = body.qr_png_base64 ? String(body.qr_png_base64).slice(0, 600000) : null;
    const logo = body.logo_png_base64 ? String(body.logo_png_base64).slice(0, 400000) : null;
    const pdf = body.pdf_base64 ? String(body.pdf_base64).slice(0, 800000) : null;

    const data = await sendFiscalReceiptConsumerEmail({
      to,
      nuikf,
      receiptText,
      qrPngBase64: qr,
      logoPngBase64: logo,
      pdfBase64: pdf,
      businessName: body.business_name,
      taxpayerNui: body.taxpayer_nui,
      totalAmount: body.total_amount,
      fiscalDate: body.fiscal_date,
    });

    res.json({
      ok: true,
      message: "Kuponi u dërgua me email.",
      id: data.id || null,
    });
  }),
);

module.exports = router;
