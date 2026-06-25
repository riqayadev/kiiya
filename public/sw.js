// Kiiya service worker.
//
// Strategy by resource type:
//   • Static assets (/_next/static/, /icons/, /fonts/, hashed files) → Cache First
//   • HTML navigations → Network First, fall back to cache, then /offline.html
//   • Supabase API (*.supabase.co) → Network Only (never cache auth/data)
//   • Images (unsplash.com + user uploads) → Stale While Revalidate
//   • Everything else → Network First
//
// Bump the version suffix on a major deploy to invalidate old caches.
const VERSION = "v2";
const STATIC_CACHE = `kiiya-static-${VERSION}`;
const DYNAMIC_CACHE = `kiiya-dynamic-${VERSION}`;
const IMAGE_CACHE = `kiiya-images-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png"];

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".woff",
  ".woff2",
  ".ttf",
  ".ico",
];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"];

// ── Install: pre-cache the offline page + a logo so the fallback always works.
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: drop caches that aren't part of the current version.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !CURRENT_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
  );
}

function isImage(url) {
  return (
    url.hostname.endsWith("unsplash.com") ||
    IMAGE_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
  );
}

// Cache First — for long-lived, content-hashed assets.
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.status === 200) {
    const clone = res.clone();
    caches.open(cacheName).then((cache) => cache.put(request, clone));
  }
  return res;
}

// Stale While Revalidate — serve cache immediately, refresh in the background.
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return res;
    })
    .catch(() => null);
  return cached || network;
}

// Network First — try the network, fall back to cache, then offline page.
async function networkFirst(request, { navigation } = {}) {
  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      const clone = res.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (navigation) return caches.match(OFFLINE_URL);
    throw new Error("Network error and no cache available");
  }
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase API → Network Only (never cached). Let the browser handle it.
  if (url.hostname.endsWith("supabase.co")) return;

  // HTML navigations → Network First with offline fallback.
  if (request.mode === "navigate") {
    e.respondWith(networkFirst(request, { navigation: true }));
    return;
  }

  // Static assets → Cache First.
  if (isStaticAsset(url)) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images → Stale While Revalidate.
  if (isImage(url)) {
    e.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Everything else → Network First.
  e.respondWith(networkFirst(request));
});
