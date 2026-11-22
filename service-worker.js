// service-worker.js
const VERSION =              '3.0.10'          /* UPDATE VERSION		    'X.X'		        */
const CACHE_NAME = `ffl-calc-v${VERSION}`      /* built from VERSION: one edit per release */
const UPDATE_DATE = '9.15 1952'               /*  'DATE OF UPLOAD'		                */
const urlsToCache = [
  './',
  './index.html',
  './scripts/app.js',
  './scripts/dose.js',
  './scripts/format.js',
  './scripts/results-table.js',
  './scripts/registry.js',
  './scripts/release.js',
  './scripts/session.js',
  './data/medications.js',
  './styles/FFL-Calc.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing, will cache:', urlsToCache);
  // addAll rejects if any file fails, so a half-cached version never installs
  // and the previous version (and its cache) stays in use.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
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