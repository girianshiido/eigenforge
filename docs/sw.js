const CACHE_NAME = "eigenforge-exercises-D2HV33vk.js-game-Aq8JDMi_.js-globals-Cp4na5-v.js-globals-DbCkU1BU.css";
const PRECACHE = [
  "/eigenforge/",
  "/eigenforge/index.html",
  "/eigenforge/exercises/",
  "/eigenforge/exercises/index.html",
  "/eigenforge/manifest.webmanifest",
  "/eigenforge/apple-touch-icon.png",
  "/eigenforge/icon-192.png",
  "/eigenforge/icon-512.png",
  "/eigenforge/assets/exercises-D2HV33vk.js",
  "/eigenforge/assets/game-Aq8JDMi_.js",
  "/eigenforge/assets/globals-Cp4na5-v.js",
  "/eigenforge/assets/globals-DbCkU1BU.css"
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
