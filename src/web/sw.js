// BLE Label Hub service worker — installable PWA + offline app shell.
// ponytail: bump CACHE on release to evict the old shell; no fancy precache manifest needed.
const CACHE = 'ble-label-hub-v3';

// App shell. JS modules are versioned via ?v= query strings in index.html, so the
// network-first HTML fetch pulls fresh module URLs and the cache fills lazily on first load.
const SHELL = [
  './',
  './index.html',
  './app.js',
  './canvas.js',
  './printer.js',
  './ble.js',
  './usb.js',
  './niimbot.js',
  './elements.js',
  './handles.js',
  './constants.js',
  './templates.js',
  './storage.js',
  './printers.json',
  './vendor/niimbluelib.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // Best-effort precache; don't fail install if one asset 404s.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle same-origin (skip Tailwind CDN etc. — let the network handle those).
  if (url.origin !== self.location.origin) return;
  // ponytail: localhost = always network, no cache friction during dev
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  const isHTML = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');
  if (isHTML) {
    // Network-first for navigations so new deploys are picked up; fall back to cached shell offline.
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for static assets (JS/JSON/icons/vendor).
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
    )
  );
});
