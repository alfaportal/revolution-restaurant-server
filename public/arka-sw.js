importScripts("/arka-offline.js");

const CACHE = "revolution-arka-v1";
const ASSETS = ["/arka-offline.js", "/arka-sw.js", "/logo-icon.svg"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(ASSETS);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.indexOf("revolution-arka-") === 0 && key !== CACHE;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

function isArkaPage(url) {
  return /\/arka\/?$/.test(url.pathname);
}

async function pageFirst(request) {
  const cache = await caches.open(CACHE);
  const path = new URL(request.url).pathname;
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(path, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(path);
    if (hit) return hit;
    return new Response("Pa internet", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function assetFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const fresh = fetch(request).then(function (res) {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(function () { return hit; });
  return hit || fresh;
}

function apiParts(url) {
  const match = url.pathname.match(/^\/api\/arka\/([^/]+)(\/.*)$/);
  if (!match) return null;
  return { slug: decodeURIComponent(match[1]), path: match[2] };
}

async function apiFirst(request) {
  if (request.headers.get("X-Arka-Sync") === "1") return fetch(request);
  try {
    const res = await fetch(request);
    return res;
  } catch (e) {
    const url = new URL(request.url);
    const parts = apiParts(url);
    if (!parts || !self.ArkaOffline) {
      return new Response(JSON.stringify({ ok: false, gabim: "Pa internet" }), {
        status: 503,
        headers: { "Content-Type": "application/json", "X-Arka-Offline": "1" },
      });
    }
    let body = "";
    if (request.method !== "GET" && request.method !== "HEAD") {
      try { body = await request.clone().text(); } catch (err) { body = ""; }
    }
    return self.ArkaOffline.handle(parts.slug, parts.path, { method: request.method, body: body });
  }
}

self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate" && isArkaPage(url)) {
    event.respondWith(pageFirst(event.request));
    return;
  }
  if (ASSETS.indexOf(url.pathname) >= 0) {
    event.respondWith(assetFirst(event.request));
    return;
  }
  if (url.pathname.indexOf("/api/arka/") === 0) {
    event.respondWith(apiFirst(event.request));
  }
});
