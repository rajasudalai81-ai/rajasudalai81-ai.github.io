/* built by node build.js from sw.src.js — do not edit */
/* Kadai Tracker service worker — generated into sw.js by node build.js (do not edit sw.js).
 * Goals: the app opens with no internet, a new version always wins when online, voice is never touched.
 *  - Only same-origin GET requests for the app page (index.html / the folder URL) and manifest.webmanifest are handled.
 *    Everything else (Google speech, fonts, other origins, sw.js itself) goes straight to the network — untouched.
 *  - NETWORK-FIRST: ask the network (revalidated, never the HTTP cache); only if it fails or takes > 4 s use the copy saved last time.
 *  - The cache name carries the build id; old caches are deleted on activate, so nothing stale lives forever.
 *  - No skipWaiting on install: the page shows "Update available — tap to refresh" and then sends SKIP_WAITING. */
"use strict";
const BUILD = "bfb31aa1";
const CACHE = "kadai-" + BUILD;
const SCOPE = self.registration.scope;               // e.g. https://user.github.io/
const INDEX = new URL("index.html", SCOPE).href;
const MANIFEST = new URL("manifest.webmanifest", SCOPE).href;
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all([INDEX, MANIFEST].map((u) =>
        fetch(new Request(u, { cache: "reload" })).then((r) => (r.ok ? cache.put(u, r) : null))
      ))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf("kadai-") === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function cacheKeyFor(request) {
  const url = new URL(request.url);
  if (url.origin !== new URL(SCOPE).origin) return null;
  if (request.method !== "GET") return null;
  if (url.href.indexOf(SCOPE) !== 0) return null;
  const rel = url.pathname.slice(new URL(SCOPE).pathname.length);
  if (rel === "" || rel === "index.html") return INDEX;
  if (rel === "manifest.webmanifest") return MANIFEST;
  return null;
}

function networkFirst(event, key) {
  const network = fetch(new Request(key, { cache: "no-cache" })).then((resp) => {
    if (resp && resp.ok) {
      const copy = resp.clone();
      const saved = caches.open(CACHE).then((c) => c.put(key, copy)).catch(() => {});
      try { event.waitUntil(saved); } catch (e) { /* event already finished: the copy is still saved */ }
    }
    return resp;
  });
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
  return Promise.race([network.catch(() => null), timeout]).then((resp) => {
    if (resp && resp.ok) return resp;
    return caches.match(key).then((hit) => {
      if (hit) return hit;
      // nothing saved yet: wait for the real network answer (or fail normally)
      return network.catch(() => Response.error());
    });
  });
}

self.addEventListener("fetch", (event) => {
  const key = cacheKeyFor(event.request);
  if (!key) return;                                   // not ours → browser handles it normally
  event.respondWith(networkFirst(event, key));
});
