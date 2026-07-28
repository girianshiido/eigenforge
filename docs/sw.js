const CACHE_NAME = "eigenforge-exercises-DkGuSXcj.js-game-C0fgzut7.js-globals-Co4g3fCG.js-globals-DNm6ZXSY.css";
const PRECACHE = [
  "/eigenforge/",
  "/eigenforge/index.html",
  "/eigenforge/exercises/",
  "/eigenforge/exercises/index.html",
  "/eigenforge/manifest.webmanifest",
  "/eigenforge/apple-touch-icon.png",
  "/eigenforge/icon-192.png",
  "/eigenforge/icon-512.png",
  "/eigenforge/assets/exercises-DkGuSXcj.js",
  "/eigenforge/assets/game-C0fgzut7.js",
  "/eigenforge/assets/globals-Co4g3fCG.js",
  "/eigenforge/assets/globals-DNm6ZXSY.css"
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
    const fallback = url.pathname.startsWith("/eigenforge/exercises/")
      ? "/eigenforge/exercises/index.html"
      : "/eigenforge/";
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(fallback)),
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
