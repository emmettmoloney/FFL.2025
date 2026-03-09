// service-worker.js
const CACHE_NAME = 'ffl-calc-v1.2';
const urlsToCache = [
  './',
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

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});