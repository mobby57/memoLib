const CACHE_NAME = 'iaposte-v3';
const STATIC_CACHE = 'iaposte-static-v3';
const DYNAMIC_CACHE = 'iaposte-dynamic-v3';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/auth/login',
  '/manifest.json'
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache auth API routes - let them go directly to network
  if (url.pathname.startsWith('/api/auth/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache des assets statiques
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Cache des API avec stratégie stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          const cachedTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
          const now = new Date();
          
          if (now.getTime() - cachedTime.getTime() < API_CACHE_DURATION) {
            // Retourner le cache si encore valide
            fetch(request).then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                responseClone.headers.set('sw-cache-time', now.toISOString());
                cache.put(request, responseClone);
              }
            }).catch(() => {});
            
            return cachedResponse;
          }
        }

        // Fetch et cache
        try {
          const response = await fetch(request);
          if (response.ok) {
            const responseClone = response.clone();
            responseClone.headers.set('sw-cache-time', new Date().toISOString());
            cache.put(request, responseClone);
          }
          return response;
        } catch (error) {
          // Return cached response if available, otherwise return a proper JSON error
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'Offline', message: 'Network unavailable' }), { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
    return;
  }

  // Stratégie network-first pour le reste
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});