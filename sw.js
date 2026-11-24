/* Offline copy of the site. Network first, so a new deploy shows on the next load;
   the saved copy is only used when there is no connection. Level files (levels/*.js) are saved the first time they load.
   Bump VERSION when the list below changes; old copies are deleted when the new worker starts. */
const VERSION = "20261124a";
const CACHE = "jlpt-review-" + VERSION;
const CORE = ["./", "index.html", "manifest.webmanifest", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("jlpt-review-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === "basic"){ const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy))); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true})
      .then(hit => hit || (req.mode === "navigate" ? caches.match("./") : undefined))
      .then(hit => hit || Response.error()))
  );
});
