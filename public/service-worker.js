// Service Worker - iaPosteManager PWA
// Gère le cache offline et les notifications push

const CACHE_NAME = 'iapostemanager-v1';
const RUNTIME_CACHE = 'iapostemanager-runtime-v1';

// Fichiers à mettre en cache au premier chargement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/offline.html'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des ressources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[SW] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Stratégie de cache: Network First, fallback sur Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer requêtes non-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API: toujours network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cloner pour mettre en cache
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback sur cache si offline
          return caches.match(request)
            .then(cached => {
              if (cached) {
                return cached;
              }
              // Retourner réponse offline
              return new Response(
                JSON.stringify({ error: 'Offline', offline: true }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Assets statiques: Cache First
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached;
          }
          return fetch(request).then(response => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
            return response;
          });
        })
    );
    return;
  }

  // Pages HTML: Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cached => {
            if (cached) {
              return cached;
            }
            // Page offline par défaut
            return caches.match('/offline.html');
          });
      })
  );
});

// Notifications Push
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'iaPosteManager';
  const options = {
    body: data.body || 'Nouveau message',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: false,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Si une fenêtre existe déjà, la focus
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Synchronisation en arrière-plan (optionnel)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-emails') {
    event.waitUntil(
      fetch('/api/sync')
        .then(response => {
          if (response.ok) {
            console.log('[SW] Synchronisation réussie');
          }
        })
        .catch(err => {
          console.error('[SW] Erreur sync:', err);
        })
    );
  }
});

// Messages du client
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      })
    );
  }
});
