// service-worker.js
const CACHE_NAME = 'ffl-calc-v1.4.10' /* UPDATE CACHE NAME		'ffl-calc-v1.x' */
const VERSION =  '1.4.10' /* UPDATE VERSION		'1.x'		*/
const UPDATE_DATE = '4.12.26 00:07' /*  'UPDATE DATE OF UPLOAD'		*/
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

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'getVersion') {
    event.source.postMessage({ version: VERSION, date: UPDATE_DATE });
  }
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});