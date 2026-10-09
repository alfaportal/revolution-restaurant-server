const { buildWaiterUrl } = require("./kitchenAccess");
const { featuresForTier } = require("./packages");

/** Linket kamarier për panelin e pronarit — cloud + WiFi (sync nga KAFENE desktop). */
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

  return {
    waiter_cloud: waiterCloud,
    waiter_wifi: waiterWifi,
    waiter_hostname_urls: hostnameUrls,
  };
}

module.exports = { buildOwnerWaiterLinks };
