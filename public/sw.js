const CACHE_NAME = 'barbearia-brooklyn-v3'; // Incrementar versão
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/perfil.html',
    '/reservar.html',
    '/reset-password.html',

    // CSS
    '/css/public.css',
    '/css/base/reset.css',
    '/css/base/variables.css',
    '/css/base/typography.css',
    '/css/layout/header.css',
    '/css/layout/footer.css',
    '/css/components/buttons.css',
    '/css/components/forms.css',
    '/css/components/modals.css',
    '/css/pages/home.css',
    '/css/pages/booking.css',
    '/css/pages/auth.css',
    '/css/pages/profile.css',

    // JavaScript
    '/js/main.js',
    '/js/auth.js',
    '/js/reservar.js',

    // Header e Footer
    '/header-footer/header.html',
    '/header-footer/footer.html',

    // Manifest e ícones
    '/manifest.json',
    '/images/logos/logo-192px.png',
    '/images/logos/logo-512px.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cache aberto');
                return cache.addAll(urlsToCache).catch((err) => {
                    console.error('[SW] Erro ao adicionar ao cache:', err);
                });
            })
    );
    self.skipWaiting();
});

// Ativação e limpeza de caches antigas
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antiga:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Estratégia de fetch
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Não fazer cache de APIs
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Network First para HTML (exceto perfil que requer autenticação)
    if (request.destination === 'document' || request.url.includes('.html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Apenas fazer cache se for resposta válida
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Se offline, tentar obter do cache
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Se não estiver em cache, mostrar página offline (opcional)
                        return new Response(
                            '<html><body><h1>Está offline</h1><p>Verifique a sua ligação à internet.</p></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
                })
        );
    }
    // Cache First para CSS, JS, imagens e fonts
    else if (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request).then((response) => {
                        // Fazer cache de novos recursos
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return response;
                    });
                })
        );
    }
    // Para outros requests, network only
    else {
        event.respondWith(fetch(request));
    }
});

// Listener para mensagens (útil para forçar atualização)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
