const PUBLIC_PAGE_THEMES = {
  "brown-gold": "#c4a574",
  "black-gold": "#d4af37",
  "blue-silver": "#8fa8c2",
  "white-warm": "#b08968",
  "green-cream": "#cbb892",
  "burgundy-gold": "#c9a34e",
};

const THEME_IDS = Object.keys(PUBLIC_PAGE_THEMES);

function accentForTheme(id) {
  return PUBLIC_PAGE_THEMES[id] || PUBLIC_PAGE_THEMES["brown-gold"];
}

function themeIdFromAccent(hex) {
  const color = String(hex || "").trim().toLowerCase();
  for (const [id, accent] of Object.entries(PUBLIC_PAGE_THEMES)) {
    if (accent.toLowerCase() === color) return id;
  }
  return "";
}

function resolvePublicPageTheme(settings) {
  const named = String(settings?.public_page_theme || "").trim();
  if (PUBLIC_PAGE_THEMES[named]) return named;
  return themeIdFromAccent(settings?.public_theme_color) || "brown-gold";
}

module.exports = {
  PUBLIC_PAGE_THEMES,
  THEME_IDS,
  accentForTheme,
  themeIdFromAccent,
  resolvePublicPageTheme,
};
