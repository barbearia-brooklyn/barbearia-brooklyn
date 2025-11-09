const CACHE_NAME = 'barbearia-brooklyn-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
    '/header-footer/header.html',
    '/header-footer/footer.html'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativação e limpeza de caches antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('A remover cache antiga:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone a resposta
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
