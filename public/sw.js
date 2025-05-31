const CACHE_NAME = "fair-note-v2"; // Incrementar versão
const urlsToCache = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  // Remover recursos que podem não existir
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usar addAll com try/catch para evitar falhas
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Alguns recursos não puderam ser cacheados:', err);
        // Cache apenas a página principal se outros falharem
        return cache.add('/');
      });
    }),
  );
  // Remover skipWaiting() que pode causar reloads
  // self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => {
      // Usar clients.claim() apenas depois de limpar caches antigos
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Ignorar requests que podem causar problemas
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('chrome-extension') ||
    event.request.url.includes('_next/static/chunks') ||
    event.request.url.includes('hot-reload')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Fazer fetch em paralelo para atualizar cache
        fetch(event.request).then(fetchResponse => {
          if (fetchResponse && fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
        }).catch(() => {
          // Ignorar erros de rede silenciosamente
        });
        
        return response;
      }
      
      return fetch(event.request).catch(() => {
        // Fallback para página principal se offline
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
