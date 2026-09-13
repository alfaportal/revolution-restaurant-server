/**
 * /sef/update — shërben latest.yml dhe instaluesët .exe për auto-update SEF.
 * Folder: SEF_UPDATE_DIR env ose public/sef/update/
 */
const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const UPDATE_DIR =
  process.env.SEF_UPDATE_DIR ||
  path.join(__dirname, "../../public/sef/update");

router.use((req, res, next) => {
  if (/\.yml$/i.test(req.path)) {
    res.type("text/yaml; charset=utf-8");
  } else if (/\.exe$/i.test(req.path)) {
    res.type("application/octet-stream");
  }
  res.set("Cache-Control", "public, max-age=120");
  next();
});

router.get("/health", (_req, res) => {
  let latestExists = false;
  let files = [];
  try {
    if (fs.existsSync(UPDATE_DIR)) {
      files = fs.readdirSync(UPDATE_DIR).filter((f) => /\.(exe|yml)$/i.test(f));
      latestExists = files.some((f) => /^latest\.yml$/i.test(f));
    }
  } catch {
    /* */
  }
  res.json({
    ok: true,
    dir: UPDATE_DIR,
    latest_yml: latestExists,
    files,
  });
});

router.use(
  express.static(UPDATE_DIR, {
    index: false,
    fallthrough: true,
    dotfiles: "deny",
  })
);

router.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: "SEF update file not found",
    hint: "Vendos latest.yml dhe .exe në folderin sef/update",
  });
});

module.exports = router;
