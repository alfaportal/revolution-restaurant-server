const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const { validateLicense } = require("../services/licenseService");
const { upsertDailySummaries } = require("../services/ownerDailyReportService");

const router = express.Router();

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "";
}

async function resolveLicenseClient(req) {
  const { celesi, license_key, device_id, hostname } = req.body || {};
  const key = celesi || license_key;
  if (!key) {
    const err = new Error("Mungon çelësi i licencës.");
    err.code = "MISSING_LICENSE";
    throw err;
  }
  const licenseResult = await validateLicense({
    celesi: key,
    device_id,
    hostname,
    client_ip: clientIp(req),
  });
  if (!licenseResult.valid) {
    const err = new Error(licenseResult.message || "Liçenca nuk është aktive.");
    err.code = licenseResult.code || "NOT_FOUND";
    throw err;
  }
  if (!licenseResult.client_id) {
    const err = new Error("Klienti nuk u gjet.");
    err.code = "NO_CLIENT";
    throw err;
  }
  return { clientId: licenseResult.client_id };
}

function collectSummaryItems(body) {
  if (Array.isArray(body?.summaries)) return body.summaries;
  if (body?.payload && body?.report_date) {
    return [
      {
        report_date: body.report_date,
        computed_at: body.computed_at,
        content_hash: body.content_hash,
        payload: body.payload,
      },
    ];
  }
  return [];
}

/** POST /api/v1/owner/daily-report — snapshot ditore nga desktop POS/hotel. */
router.post("/daily-report", licenseApiKeyOptional, async (req, res) => {
  try {
    const { clientId } = await resolveLicenseClient(req);
    const items = collectSummaryItems(req.body);
    const result = await upsertDailySummaries(clientId, items);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    const code = e.code || "ERROR";
    const status =
      code === "MISSING_LICENSE"
        ? 400
        : ["NOT_FOUND", "REVOKED", "SUSPENDED", "EXPIRED", "NO_CLIENT"].includes(code)
          ? 403
          : 400;
    res.status(status).json({ ok: false, code, gabim: e.message || "Gabim." });
  }
});

module.exports = router;
