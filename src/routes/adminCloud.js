"use strict";

const express = require("express");
const { authOwner, ownerOnly } = require("../middleware/auth");
const { getPasqyra, getDitari, buildDitariPreviewHtml, listNderrimet, getStoku, getProduktet, getKategorite, listFurnitoret } = require("../services/adminCloudService");

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

router.get("/ditari/preview", async (req, res) => {
  try {
    const { getClientById } = require("../services/salesService");
    const data = await getDitari(req.user.client_id, req.query);
    const client = await getClientById(req.user.client_id);
    res.json({ ok: true, html: buildDitariPreviewHtml(data, client?.emri || "") });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/refused-orders", async (req, res) => {
  try {
    const { listRefusedOrders } = require("../services/orderRefusalService");
    const result = await listRefusedOrders(req.user.client_id, {
      from: req.query.from,
      to: req.query.to,
      limit: Number(req.query.limit) || 150,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/ditari", async (req, res) => {
  try {
    const data = await getDitari(req.user.client_id, req.query);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/furnitoret", async (req, res) => {
  try {
    const data = await listFurnitoret(req.user.client_id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/kategorite", async (req, res) => {
  try {
    const data = await getKategorite(req.user.client_id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/produktet", async (req, res) => {
  try {
    const data = await getProduktet(req.user.client_id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/stoku", async (req, res) => {
  try {
    const data = await getStoku(req.user.client_id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/nderrimet", async (req, res) => {
  try {
    const data = await listNderrimet(req.user.client_id, req.query);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

router.get("/floor", async (req, res) => {
  try {
    const { getArkaTables } = require("../services/arkaService");
    const data = await getArkaTables(req.user.client_id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message || "Gabim" });
  }
});

module.exports = router;
