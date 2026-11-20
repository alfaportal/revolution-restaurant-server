"use strict";

const express = require("express");
const { authOwner, ownerOnly } = require("../middleware/auth");
const { getPasqyra } = require("../services/adminCloudService");

const router = express.Router();

router.use(authOwner, ownerOnly);

router.get("/pasqyra", async (req, res) => {
  try {
    const data = await getPasqyra(req.user.client_id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

module.exports = router;
