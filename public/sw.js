// Kiiya service worker.
// - Cache-first ONLY for static assets (js/css/images/fonts).
// - Network-first for everything else (HTML pages + API), so a new deploy is
//   always picked up immediately instead of serving stale HTML from cache.
const CACHE_NAME = "kiiya-v2";
const STATIC_EXTENSIONS = [".js", ".css", ".png", ".jpg", ".ico", ".woff2"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isStatic = STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));

  if (isStatic) {
    // Cache-first for static assets.
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
            return res;
          })
      )
    );
  } else {
    // Network-first for HTML and API — fall back to cache only when offline.
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});
