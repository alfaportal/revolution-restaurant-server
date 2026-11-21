const path = require("path");
const { asyncHandler } = require("../lib/asyncHandler");
const { getClientBySlugOrId } = require("../lib/kitchenAccess");
const { urlTipiSegment, tipiCategory, isReservedUrlTipi } = require("../lib/productUrls");

function querySuffix(req) {
  const i = req.url.indexOf("?");
  return i >= 0 ? req.url.slice(i) : "";
}

function registerArkaPageRoutes(app, ctx) {
  const publicDir = ctx.publicDir;

  app.get("/:tipi/:slug/arka", asyncHandler(async (req, res, next) => {
    if (isReservedUrlTipi(req.params.tipi)) return next("route");
    const client = await getClientBySlugOrId(req.params.slug);
    if (!client) {
      return res.status(404).type("html").send("Biznesi nuk u gjet.");
    }
    const expected = urlTipiSegment(client);
    if (req.params.tipi !== expected) {
      return res.redirect(
        302,
        `/${expected}/${encodeURIComponent(req.params.slug)}/arka${querySuffix(req)}`,
      );
    }
    if (tipiCategory(expected) !== "pos") {
      return res.status(404).type("html").send("Arka në shfletues është për restorantin.");
    }
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.join(publicDir, "arka.html"));
  }));

  app.get("/:tipi/:slug/arka/manifest.json", asyncHandler(async (req, res, next) => {
    if (isReservedUrlTipi(req.params.tipi)) return next("route");
    const client = await getClientBySlugOrId(req.params.slug);
    if (!client) return res.status(404).json({ gabim: "Biznesi nuk u gjet." });
    const expected = urlTipiSegment(client);
    if (tipiCategory(expected) !== "pos") return res.status(404).json({ gabim: "Vetëm për restorantin." });
    const start = `/${expected}/${encodeURIComponent(req.params.slug)}/arka`;
    res.set("Cache-Control", "no-store");
    res.type("application/manifest+json").json({
      name: "Revolution Arka",
      short_name: "Revolution Arka",
      start_url: start,
      scope: `/${expected}/${encodeURIComponent(req.params.slug)}/arka`,
      display: "standalone",
      background_color: "#0f1b3d",
      theme_color: "#0f1b3d",
      icons: [{ src: "/logo-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    });
  }));
}

module.exports = { registerArkaPageRoutes };
