const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "../../public/site");
const SITE_OLD_DIR = path.join(__dirname, "../../public/site-old");

const PAGE_FILES = {
  "/": "index.html",
  "/hap": "hap.html",
  "/udhezuesi": "udhezuesi.html",
  "/privatesia": "privatesia.html",
  "/kushtet": "kushtet.html",
  "/cookies": "cookies.html",
  "/kafene": "kafene.html",
  "/hotel": "hotel.html",
  "/market": "market.html",
  "/furra": "furra.html",
  "/dyqane": "dyqane.html",
  "/butika": "butika.html",
  "/distributor": "distributor.html",
  "/argjendari": "argjendari.html",
  "/barnatore": "barnatore.html",
  "/fiskalizim": "fiskalizim.html",
  "/kontabilisti": "kontabilisti.html",
  "/security": "security.html",
  "/mjekesia": "mjekesia.html",
  "/posta-taxi": "posta-taxi.html",
  "/rentacar": "rentacar.html",
};

function readHtml(dir, fileName) {
  try {
    return fs.readFileSync(path.join(dir, fileName), "utf8");
  } catch (_err) {
    return null;
  }
}

function renderMarketingHtml(pathname) {
  const clean = String(pathname || "/").replace(/\/+$/, "") || "/";
  const fileName = PAGE_FILES[clean];
  if (fileName) return readHtml(SITE_DIR, fileName);
  if (clean === "/privacy" || clean === "/terms" || clean === "/blog" || clean.startsWith("/blog/")) {
    return readHtml(SITE_OLD_DIR, "index.html");
  }
  return null;
}

module.exports = {
  renderMarketingHtml,
};
