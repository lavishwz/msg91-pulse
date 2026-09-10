/* Pulse service worker.
   Scope is deliberately narrow: this makes the app installable and keeps the
   static shell (scripts, styles, icons) available offline, but every API call
   and every navigation goes to the network first — Pulse's data is live sales
   data, and a stale cached answer is worse than a spinner. */
const CACHE = "pulse-shell-v1";
const SHELL = [
  "/pulse.js",
  "/pulse-live.js",
  "/pulse-auth.js",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always live

  const isShellAsset = SHELL.includes(url.pathname) || url.pathname.startsWith("/icons/");
  if (!isShellAsset) return; // let navigations/pages hit the network normally

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
