// main.js - Gestão global do site

// Carregar header e footer
async function loadHeaderFooter() {
    const isInSubfolder = window.location.pathname.includes('/infos/');
    const basePath = isInSubfolder ? '../' : './';

    // Carrega o header
    const headerHtml = await utils.loadHTML(`${basePath}header-footer/header.html`);
    if (headerHtml) {
        document.getElementById('header-placeholder').innerHTML = headerHtml;
        initializeMenu();
        // IMPORTANTE: Verificar auth DEPOIS do header carregar
        await utils.updateAuthUI();
    }

    // Carrega o footer
    const footerHtml = await utils.loadHTML(`${basePath}header-footer/footer.html`);
    if (footerHtml) {
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
    }
}

// Inicializar menu hambúrguer
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

// Smooth scroll para âncoras
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
            e.preventDefault();
            utils.scrollToElement(href);
        }
    }
});

// Listener para botão de login
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'loginBtn') {
        e.preventDefault();
        window.location.href = 'login.html';
    }
});

// Registar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registado:', registration.scope);
                registration.addEventListener('updatefound', () => {
                    console.log('Atualização do Service Worker encontrada');
                });
            })
            .catch(error => console.log('Falha no registo do Service Worker:', error));
    });
}

// Carregar header/footer quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeaderFooter);
} else {
    loadHeaderFooter();
}
