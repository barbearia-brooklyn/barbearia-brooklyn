const CACHE_NAME = 'brooklyn-admin-v1';
const ADMIN_ASSETS_TO_CACHE = [
    '/admin/',
    '/admin/dashboard.html',
    '/admin/calendar.html',
    '/admin/reservations.html',
    '/admin/new-booking.html',
    '/admin/clients.html',
    '/admin/client-detail.html',
    '/admin/unavailable.html',
    '/admin/header.html',
    '/admin/login.html',
    '/css/public.css',
    '/css/admin.css',
    '/js/utils.js',
    '/js/admin.js',
    '/js/auth.js',
    '/images/logos/logo-192px.png',
    '/images/logos/logo-512px.png'
];

// Instalar e cachear assets do admin
self.addEventListener('install', (event) => {
    console.log('[Admin SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Admin SW] Caching admin assets');
                return cache.addAll(ADMIN_ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('[Admin SW] Installation failed:', error);
            })
    );
});

// Ativar e limpar caches antigas
self.addEventListener('activate', (event) => {
    console.log('[Admin SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('brooklyn-admin-') && name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[Admin SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Estratégia: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Apenas processar requests dentro do scope /admin/
    if (!url.pathname.startsWith('/admin/')) {
        return;
    }

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
            .catch(() => {
                // Fallback para cache se offline
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Se não houver cache, retornar página de erro offline
                    return caches.match('/admin/dashboard.html');
                });
            })
    );
});
