const CACHE_NAME = 'barbearia-brooklyn-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
    '/header-footer/header.html',
    '/header-footer/footer.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
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
    self.skipWaiting(); // Força a ativação imediata
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
    return self.clients.claim(); // Toma controlo imediatamente
});

// Estratégia: Network First para HTML, Cache First para assets
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('.html')) {
        // Network first para HTML
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache first para outros recursos
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
});