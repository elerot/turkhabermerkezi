const CACHE_NAME = 'saatdakika-v1';
const STATIC_CACHE = 'saatdakika-static-v1';

// Service Worker kurulumu
self.addEventListener('install', (event) => {
  console.log('Service Worker kuruluyor...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Static cache açıldı');
        return cache.addAll([
          '/',
          '/manifest.json',
          '/icon.svg'
        ]);
      })
  );
  self.skipWaiting();
});

// Service Worker aktivasyonu
self.addEventListener('activate', (event) => {
  console.log('Service Worker aktifleştiriliyor...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch olaylarını yakala
self.addEventListener('fetch', (event) => {
  // Sadece GET isteklerini işle
  if (event.request.method !== 'GET') {
    return;
  }

  // Ana sayfa istekleri için network-first stratejisi
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Başarılı response'ları cache'le
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Network hatası durumunda cache'den döndür
          return caches.match(event.request)
            .then((response) => {
              return response || caches.match('/');
            });
        })
    );
    return;
  }

  // Static dosyalar için cache-first stratejisi
  if (event.request.url.includes('/_next/static/') || 
      event.request.url.includes('/manifest.json') ||
      event.request.url.includes('/icon.svg')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // Diğer istekler için network-first stratejisi
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});