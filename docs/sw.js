const CACHE_NAME = "eigenforge-index-DTG3nmq-.js-index-GvV1zq0n.css";
const PRECACHE = [
  "/eigenforge/",
  "/eigenforge/index.html",
  "/eigenforge/manifest.webmanifest",
  "/eigenforge/apple-touch-icon.png",
  "/eigenforge/icon-192.png",
  "/eigenforge/icon-512.png",
  "/eigenforge/assets/index-DTG3nmq-.js",
  "/eigenforge/assets/index-GvV1zq0n.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("eigenforge-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/eigenforge/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put("/eigenforge/", copy));
          return response;
        })
        .catch(() => caches.match("/eigenforge/")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
      return cached ?? fresh;
    }),
  );
});
