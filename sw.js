const CACHE_NAME = 'bgg-hipoteca-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/icon.png',
  '/manifest.json'
];

// Instalación: pre-cachear los assets principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para CDN externos, cache-first para assets propios
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Recursos externos (CDN): intentar red, si falla usar caché
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets propios: cache-first, fallback a red
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
