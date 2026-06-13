const CACHE_NAME = 'nilai-app-v4.0';
const ASSETS_TO_CACHE = [
  './',
  './nilai-pwa.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// INSTALL EVENT
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log('[Service Worker] Cache error:', err);
        // Jangan berhenti jika ada error caching
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// ACTIVATE EVENT
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH EVENT - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Network first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response untuk cache
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        // Fallback ke cache
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response(
            'Aplikasi tidak tersedia. Pastikan Anda online untuk mengakses resource ini.',
            { status: 503, statusText: 'Service Unavailable', headers: new Headers({ 'Content-Type': 'text/plain' }) }
          );
        });
      })
  );
});

// BACKGROUND SYNC (untuk future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Implementasi sync data di sini
    console.log('[Service Worker] Syncing data...');
  } catch (err) {
    console.error('[Service Worker] Sync error:', err);
  }
}

// MESSAGE EVENT (untuk komunikasi dengan client)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Registered successfully');
