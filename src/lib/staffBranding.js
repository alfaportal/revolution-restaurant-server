const { getSupabase } = require("../db");

/** pos_settings (emri, adresa, a ka logo) — lexohet nga Supabase më së shumti 1× / 30 min për klient. */
const BRANDING_CACHE_MS = 30 * 60 * 1000;
const brandingCache = new Map();

async function loadBrandingSettings(clientId) {
  const cached = brandingCache.get(clientId);
  if (cached && Date.now() - cached.fetchedAt < BRANDING_CACHE_MS) return cached.settings;

  const db = getSupabase();
  const { data, error } = await db
    .from("pos_settings")
    .select("restaurant_name, address, public_logo")
    .eq("client_id", clientId)
    .maybeSingle();
  const settings = data
    ? {
        restaurant_name: data.restaurant_name,
        address: data.address,
        public_logo: Boolean(data.public_logo),
      }
    : null;
  if (!error) brandingCache.set(clientId, { settings, fetchedAt: Date.now() });
  return settings;
}

async function getStaffBrandingForClient(client, slug = "") {
  const clientId = client?.id;
  const slugSafe = String(slug || client?.kitchen_slug || "").trim();

  let settings = null;
  if (clientId) {
    settings = await loadBrandingSettings(clientId);
  }

  const restaurantName = String(settings?.restaurant_name || client?.emri || "").trim();
  const address = String(settings?.address || "").trim();

  return {
    client_name: client?.emri || "",
    restaurant_name: restaurantName || client?.emri || "",
    address,
    logo_url: settings?.public_logo && slugSafe ? `/api/r/${encodeURIComponent(slugSafe)}/logo` : null,
    revolution_logo_url: "/logo-source.png",
  };
}

module.exports = { getStaffBrandingForClient };
