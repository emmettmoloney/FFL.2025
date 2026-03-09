// service-worker.js
const CACHE_NAME = 'static-v1';
const urlsToCache = [
  './',             // catch the root (index.html)
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', evt => {
  console.log('[SW] Installing, will cache:', urlsToCache);
  evt.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (let url of urlsToCache) {
        try {
          await cache.add(url);
          console.log('[SW] Cached:', url);
        } catch (err) {
          console.error('[SW] Failed to cache:', url, err);
        }
      }
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});