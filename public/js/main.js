function scrollToTop() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

// Função para carregar header e footer
function loadHeaderFooter() {
    const isInSubfolder = window.location.pathname.includes('/infos/');
    const basePath = isInSubfolder ? '../' : './';

    // Carrega o header
    fetch(`${basePath}header-footer/header.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar header: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
            // INICIALIZAR MENU AQUI
            initializeMenu();
        })
        .catch(error => console.error('Erro ao carregar header:', error));

    // Carrega o footer
    fetch(`${basePath}header-footer/footer.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar footer: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('footer-placeholder').innerHTML = html;
        })
        .catch(error => console.error('Erro ao carregar footer:', error));
}

// Função para inicializar o menu hambúrguer
function initializeMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Fechar menu ao clicar em link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        console.log('Menu inicializado com sucesso');
    } else {
        console.error('Elementos do menu não encontrados');
    }
}

// Executa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeaderFooter);
} else {
    loadHeaderFooter();
}

// Smooth scroll
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (anchor) {
        const href = anchor.getAttribute('href');
        // Ignorar hrefs vazios ou apenas "#"
        if (href && href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }
});

// Registar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registado com sucesso:', registration.scope);

                // Verificar atualizações
                registration.addEventListener('updatefound', () => {
                    console.log('Atualização do Service Worker encontrada');
                });
            })
            .catch((error) => {
                console.log('Falha no registo do Service Worker:', error);
            });
    });
}

// Verificar estado de autenticação
async function checkAuth() {
    try {
        const response = await fetch('/api/api_auth/me');
        const loggedOutBtns = document.getElementById('logged-out-buttons');
        const loggedInBtns = document.getElementById('logged-in-buttons');

        if (response.ok) {
            const data = await response.json();
            // User está autenticado
            if (loggedOutBtns) loggedOutBtns.style.display = 'none';
            if (loggedInBtns) loggedInBtns.style.display = 'flex';

            // Armazenar dados do user globalmente
            window.currentUser = data.user;
        } else {
            // User NÃO está autenticado
            if (loggedOutBtns) loggedOutBtns.style.display = 'flex';
            if (loggedInBtns) loggedInBtns.style.display = 'none';

            window.currentUser = null;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        const loggedOutBtns = document.getElementById('logged-out-buttons');
        const loggedInBtns = document.getElementById('logged-in-buttons');
        if (loggedOutBtns) loggedOutBtns.style.display = 'flex';
        if (loggedInBtns) loggedInBtns.style.display = 'none';
    }
}

// Executar verificação ao carregar
document.addEventListener('DOMContentLoaded', checkAuth);

// Listener para botão de login
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'loginBtn') {
        e.preventDefault();
        window.location.href = 'login.html';
    }
});
