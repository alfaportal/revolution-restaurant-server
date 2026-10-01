const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const {
  generatePairCode,
  joinWithPairCode,
  listTerminalsForLicense,
  removeTerminalForLicense,
} = require("../services/terminalPairService");
const { normalizeKey } = require("../services/licenseService");

const router = express.Router();

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "";
}

function licenseKeyFromReq(req) {
  const q = req.query || {};
  const b = req.body || {};
  return normalizeKey(
    q.celesi || q.license_key || b.celesi || b.license_key || req.headers["x-license-key"],
  );
}

router.post("/generate-pair-code", licenseApiKeyOptional, async (req, res) => {
  try {
    const result = await generatePairCode(req.body || {});
    res.status(201).json(result);
  } catch (e) {
    const code = e.code || "ERROR";
    const status =
      code === "MISSING_LICENSE" ? 400
        : ["NOT_FOUND", "REVOKED", "SUSPENDED", "EXPIRED"].includes(code) ? 403
          : 400;
    res.status(status).json({ ok: false, code, gabim: e.message || "Gabim." });
  }
});

router.get("/terminals", licenseApiKeyOptional, async (req, res) => {
  try {
    const celesi = licenseKeyFromReq(req);
    if (!celesi) {
      return res.status(400).json({ ok: false, gabim: "Mungon çelësi i licencës." });
    }
    const result = await listTerminalsForLicense({ celesi });
    res.json(result);
  } catch (e) {
    const code = e.code || "ERROR";
    const status = code === "MISSING_LICENSE" ? 400 : 403;
    res.status(status).json({ ok: false, code, gabim: e.message || "Gabim." });
  }
});

router.delete("/terminals/:deviceId", licenseApiKeyOptional, async (req, res) => {
  try {
    const celesi = licenseKeyFromReq(req);
    if (!celesi) {
      return res.status(400).json({ ok: false, gabim: "Mungon çelësi i licencës." });
    }
    const result = await removeTerminalForLicense({ celesi }, req.params.deviceId);
    res.json(result);
  } catch (e) {
    const code = e.code || "ERROR";
    const status = code === "PRIMARY_TERMINAL" ? 403 : 400;
    res.status(status).json({ ok: false, code, gabim: e.message || "Gabim." });
  }
});

router.post("/join", licenseApiKeyOptional, async (req, res) => {
  try {
    const body = req.body || {};
    const result = await joinWithPairCode(body, {
      hostname: body.hostname,
      ip: clientIp(req),
    });
    res.json(result);
  } catch (e) {
    const code = e.code || "ERROR";
    const status =
      code === "CODE_NOT_FOUND" ? 404
        : ["CODE_USED", "CODE_EXPIRED", "CODE_RACE"].includes(code) ? 409
          : code === "TERMINAL_DENIED" || code === "TERMINAL_LIMIT_EXCEEDED" ? 403
            : 400;
    res.status(status).json({ ok: false, code, gabim: e.message || "Gabim." });
  }
});

module.exports = router;
