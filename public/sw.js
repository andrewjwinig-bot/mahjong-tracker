// Simple offline-first service worker for the Mahjong Tracker PWA.
// App shell is cached; navigations fall back to the cached shell when offline.
// All user data lives in IndexedDB (handled by the app), not here.

// Bumping this cache name forces every returning device to drop its old cached
// bundle on the next visit and pull a clean build — the fix for a phone stuck
// on a stale copy of the app.
const CACHE = 'mahjong-v124';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Let the page tell a waiting worker to take over immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Backend proxy (/sb/* → Supabase): never cache or intercept. These must
  // always hit the network fresh (auth tokens, live data), and serving a stale
  // cached API response would be wrong.
  if (new URL(req.url).pathname.startsWith('/sb/')) return;

  // Navigations: network-first, fall back to cached shell (offline support).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || caches.match(req)).then((r) => r || new Response('Offline', { status: 503 }))),
    );
    return;
  }

  // Static assets: cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok && res.type === 'basic') {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached || new Response('', { status: 504 })),
    ),
  );
});
