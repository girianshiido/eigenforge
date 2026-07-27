import { readdir, writeFile } from "node:fs/promises";

const base = "/eigenforge/";
const files = await readdir(new URL("../docs/assets/", import.meta.url));
const assets = files.map((file) => `${base}assets/${file}`);
const cacheName = `eigenforge-${files.sort().join("-")}`;
const precache = [
  base,
  `${base}index.html`,
  `${base}manifest.webmanifest`,
  `${base}apple-touch-icon.png`,
  `${base}icon-192.png`,
  `${base}icon-512.png`,
  ...assets,
];

const serviceWorker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(precache, null, 2)};

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
  if (url.origin !== self.location.origin || !url.pathname.startsWith(${JSON.stringify(base)})) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(${JSON.stringify(base)}, copy));
          return response;
        })
        .catch(() => caches.match(${JSON.stringify(base)})),
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
`;

await writeFile(new URL("../docs/sw.js", import.meta.url), serviceWorker);
