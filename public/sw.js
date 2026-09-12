/* Pulse service worker.
   Scope is deliberately narrow: this makes the app installable and keeps the
   static shell (scripts, styles, icons) available offline, but every API call
   and every navigation goes to the network first — Pulse's data is live sales
   data, and a stale cached answer is worse than a spinner. */
const CACHE = "pulse-shell-v2";
const SHELL = [
  "/pulse.js",
  "/pulse-live.js",
  "/pulse-auth.js",
  "/manifest.webmanifest",
  "/offline.html",
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

  /* A page navigation still always goes to the network first — the app shell
     itself is per-deploy (BUILD_ID-stamped scripts) and never cached here.
     The only thing this adds is somewhere to land if the network fetch
     fails outright: the browser's own offline interstitial instead of
     Pulse's own is a jarring, unbranded dead end mid-navigation. */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  const isShellAsset = SHELL.includes(url.pathname) || url.pathname.startsWith("/icons/");
  if (!isShellAsset) return; // let every other request hit the network normally

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
