const CACHE_NAME = 'barbearia-brooklyn-v8';
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
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requests de extensões do browser
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'moz-extension:' || 
        url.protocol === 'safari-extension:') {
        return;
    }

    // Ignorar requests que não são HTTP/HTTPS
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Ignorar requests que não são GET ou de APIs
    if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Apenas cachear respostas válidas
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});
