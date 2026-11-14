(function (global) {
  const THEMES = [
    { id: "brown-gold", label: "Kafe / ar", accent: "#c4a574", swatch: ["#14110e", "#241e18", "#c4a574"] },
    { id: "black-gold", label: "Zi / ar", accent: "#d4af37", swatch: ["#050505", "#161616", "#d4af37"] },
    { id: "blue-silver", label: "Blu / argjend", accent: "#8fa8c2", swatch: ["#0b1220", "#152033", "#8fa8c2"] },
    { id: "white-warm", label: "E bardhë / e ngrohtë", accent: "#b08968", swatch: ["#f6f1e8", "#ffffff", "#b08968"] },
    { id: "green-cream", label: "E gjelbër / krem", accent: "#cbb892", swatch: ["#0f1a14", "#1a2a20", "#cbb892"] },
    { id: "burgundy-gold", label: "Burgundy / ar", accent: "#c9a34e", swatch: ["#1a0b10", "#2a1418", "#c9a34e"] },
  ];
  const BY_ID = {};
  const BY_ACCENT = {};
  THEMES.forEach(t => {
    BY_ID[t.id] = t;
    BY_ACCENT[String(t.accent).toLowerCase()] = t.id;
  });

  function resolveId(data) {
    const named = String(data?.page_theme || data?.public_page_theme || "").trim();
    if (BY_ID[named]) return named;
    const hex = String(data?.theme_color || data?.public_theme_color || "").trim().toLowerCase();
    return BY_ACCENT[hex] || "brown-gold";
  }

  function apply(data) {
    const id = resolveId(data);
    document.body.setAttribute("data-theme", id);
    const accent = BY_ID[id]?.accent || "#c4a574";
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-dark", accent);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", accent);
    return id;
  }

  global.RPublicTheme = {
    THEMES,
    BY_ID,
    resolveId,
    apply,
    accent(id) {
      return BY_ID[id]?.accent || "#c4a574";
    },
  };
})(window);
