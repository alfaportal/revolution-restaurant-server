(function (global) {
  const THEMES = [
    {
      id: "brown-gold",
      label: "Kafe Klasike",
      accent: "#c4a574",
      preview: { bg: "#14110e", bar: "#241e18", card: "#2a231c", chip: "#c4a574", text: "#f4efe6" },
    },
    {
      id: "black-gold",
      label: "Elegante e Zezë",
      accent: "#d4af37",
      preview: { bg: "#050505", bar: "#121212", card: "#1a1a1a", chip: "#d4af37", text: "#f7f3ea" },
    },
    {
      id: "blue-silver",
      label: "Blu Nate",
      accent: "#8fa8c2",
      preview: { bg: "#0b1220", bar: "#152033", card: "#1b2b44", chip: "#c5d4e2", text: "#e8eef5" },
    },
    {
      id: "white-warm",
      label: "E Bardhë e Pastër",
      accent: "#b08968",
      preview: { bg: "#f6f1e8", bar: "#ffffff", card: "#ffffff", chip: "#b08968", text: "#2c241c" },
    },
    {
      id: "green-cream",
      label: "E Gjelbër Natyrale",
      accent: "#cbb892",
      preview: { bg: "#0d1f16", bar: "#163024", card: "#1a2a20", chip: "#cbb892", text: "#f3efe4" },
    },
  ];
  const BY_ID = {};
  const BY_ACCENT = {};
  THEMES.forEach((t) => {
    BY_ID[t.id] = t;
    BY_ACCENT[String(t.accent).toLowerCase()] = t.id;
  });
  BY_ACCENT["#c9a34e"] = "black-gold";
  BY_ACCENT["#c2410c"] = "brown-gold";

  function resolveId(data) {
    const named = String(data?.page_theme || data?.public_page_theme || "").trim();
    if (named === "burgundy-gold") return "black-gold";
    if (BY_ID[named]) return named;
    const hex = String(data?.theme_color || data?.public_theme_color || "").trim().toLowerCase();
    return BY_ACCENT[hex] || "brown-gold";
  }

  function apply(data) {
    const q = new URLSearchParams(location.search).get("theme");
    const id = BY_ID[q] ? q : resolveId(data);
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
