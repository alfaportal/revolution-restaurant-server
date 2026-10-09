/** Rishkrim URL-ve kur hotel-server shërben nën /hotel (revolution-pos.com). */

const { stripLegacyKitchenSlugSuffix } = require("./kitchenSlug");

const HOTEL_PREFIX = "/hotel";

function publicHotelSlug(slug) {
  const raw = decodeURIComponent(String(slug || "").trim());
  return stripLegacyKitchenSlugSuffix(raw) || raw;
}

function prefixRootPath(path) {
  const p = String(path || "").trim();
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.startsWith(HOTEL_PREFIX)) return p;
  return `${HOTEL_PREFIX}${p}`;
}

/**
 * HTML nga hotel upstream: /js, /css, /waiter/… → /hotel/js, …
 */
function rewriteHotelProxyHtml(html, slug) {
  let out = String(html || "");
  out = out.replace(
    /(\s(?:href|src|action)\s*=\s*["'])\/(?!hotel\/)(?!\/)([^"'#?]*)/gi,
    `$1${HOTEL_PREFIX}/$2`,
  );
  if (slug) {
    const pub = publicHotelSlug(slug);
    const enc = encodeURIComponent(pub);
    out = out.replace(
      new RegExp(`${HOTEL_PREFIX}/waiter/${enc}/manifest\\.json`, "gi"),
      `${HOTEL_PREFIX}/${enc}/kamarier/manifest.json`,
    );
    out = out.replace(
      new RegExp(`/waiter/${enc}/manifest\\.json`, "gi"),
      `${HOTEL_PREFIX}/${enc}/kamarier/manifest.json`,
    );
    const legacyEnc = encodeURIComponent(String(slug).trim());
    if (legacyEnc !== enc) {
      out = out.replace(
        new RegExp(`/waiter/${legacyEnc}/manifest\\.json`, "gi"),
        `${HOTEL_PREFIX}/${enc}/kamarier/manifest.json`,
      );
    }
  }
  return out;
}

function rewriteHotelManifestJson(body, slug, search = "") {
  let data;
  try {
    data = JSON.parse(String(body || "{}"));
  } catch {
    return body;
  }
  const q = search && String(search).startsWith("?") ? search : search ? `?${search}` : "";
  const pub = publicHotelSlug(slug);
  if (pub) {
    data.start_url = `${HOTEL_PREFIX}/${encodeURIComponent(pub)}/kamarier${q}`;
  } else if (data.start_url && String(data.start_url).startsWith("/waiter/")) {
    data.start_url = prefixRootPath(data.start_url);
  }
  data.scope = `${HOTEL_PREFIX}/`;
  if (Array.isArray(data.icons)) {
    data.icons = data.icons.map((icon) => {
      if (!icon || typeof icon !== "object") return icon;
      const src = String(icon.src || "");
      return { ...icon, src: prefixRootPath(src) };
    });
  }
  return JSON.stringify(data);
}

module.exports = {
  HOTEL_PREFIX,
  prefixRootPath,
  rewriteHotelProxyHtml,
  rewriteHotelManifestJson,
};
