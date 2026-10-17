const { buildWaiterUrl } = require("./kitchenAccess");
const { featuresForTier } = require("./packages");

/** Zëvendëson segmentin e rolit në URL LAN (p.sh. kamarier → kuzhina). */
function replaceLocalStaffRoleSegment(fromUrl, newRole) {
  const u = String(fromUrl || "").trim();
  const role = String(newRole || "").trim().toLowerCase();
  if (!u || !role) return "";
  const roles = "kamarier|recepsion|sherbimi|kuzhina|banaku|kuzhinë";
  const re = new RegExp(`/(${roles})(\\/\\d{3})?/?$`, "i");
  if (!re.test(u)) return "";
  return u.replace(re, `/${role}$2`);
}

/** Linket stafi për panelin e pronarit — cloud (ruhet) + WiFi/LAN nga sync POS. */
function buildOwnerWaiterLinks(baseUrl, client, localSnapshot = null) {
  const features = featuresForTier(client?.package_tier);
  const local = localSnapshot && typeof localSnapshot === "object" ? localSnapshot : {};
  const base = String(baseUrl || "").replace(/\/+$/, "");

  const waiterCloud = features.waiter && client ? buildWaiterUrl(base, client, "") : "";
  const waiterWifi = String(
    local.local_waiter_url || local.local_staff_wifi?.kamarier || "",
  ).trim();
  const hostnameUrls = Array.isArray(local.local_waiter_hostname_urls)
    ? local.local_waiter_hostname_urls.filter(e => e && e.url)
    : [];

  const kitchenWifi =
    String(local.local_kitchen_url || local.local_staff_wifi?.kuzhina || "").trim()
    || replaceLocalStaffRoleSegment(waiterWifi, "kuzhina");
  const barWifi =
    String(local.local_bar_url || local.local_staff_wifi?.banaku || "").trim()
    || replaceLocalStaffRoleSegment(waiterWifi, "banaku");

  return {
    waiter_cloud: waiterCloud,
    waiter_wifi: waiterWifi,
    kitchen_wifi: kitchenWifi,
    bar_wifi: barWifi,
    waiter_hostname_urls: hostnameUrls,
  };
}

module.exports = { buildOwnerWaiterLinks, replaceLocalStaffRoleSegment };
