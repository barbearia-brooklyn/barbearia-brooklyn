const CACHE_NAME = 'barbearia-brooklyn-v4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/perfil.html',
    '/manifest.json',
    '/css/public.css',
    '/js/utils.js',
    '/js/main.js',
    '/js/auth.js',
    '/header-footer/header.html',
    '/header-footer/footer.html',
    '/images/logos/logo-192px.png',
    '/images/logos/logo-512px.png'
];

// Instalar e cachear assets essenciais
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Ativar e limpar caches antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Estratégia: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
    // Ignorar requests que não são GET ou de APIs
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Apenas cachear respostas válidas
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
