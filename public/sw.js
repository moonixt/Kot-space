const CACHE_NAME = "fair-note-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  // Adicione outros recursos estáticos importantes
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// Função para verificar se há conexão com a internet
const isOnline = () => {
  return fetch("/online-check.txt?rand=" + Math.random())
    .then((response) => {
      return response.ok;
    })
    .catch(() => {
      return false;
    });
};

// Alterando para estratégia "network-first" com verificação de conexão
self.addEventListener("fetch", (event) => {
  event.respondWith(
    isOnline().then((online) => {
      // Se estiver online, tenta buscar da rede primeiro
      if (online) {
        return fetch(event.request)
          .then((response) => {
            // Cache a resposta nova para uso futuro
            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Se falhar a busca da rede, tenta o cache
            return caches.match(event.request);
          });
      } else {
        // Se estiver offline, vai direto para o cache
        return caches.match(event.request).then((response) => {
          return response || fetch(event.request);
        });
      }
    }),
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icon.png",
      badge: "/badge.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();
  event.waitUntil(clients.openWindow("<https://your-website.com>"));
});
