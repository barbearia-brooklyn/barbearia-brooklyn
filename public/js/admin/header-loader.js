/**
 * Brooklyn Barbearia - Admin Header Loader
 * Carrega header e aplica permissões baseadas em roles
 */

function loadAdminHeader(activePage) {
    const headerContainer = document.getElementById('headerContainer');
    if (!headerContainer) return;

    fetch('/admin/header.html')
        .then(response => response.text())
        .then(html => {
            headerContainer.innerHTML = html;
            
            // Marcar item ativo
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-view') === activePage) {
                    item.classList.add('active');
                }
            });

            // Aplicar permissões baseadas no role
            applyRolePermissions();
            
            // Setup logout
            setupLogout();
            
            // Setup hamburger menu
            setupHamburgerMenu();
        })
        .catch(error => console.error('❌ Erro ao carregar header:', error));
}

/**
 * Setup do menu hamburguer
 */
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const headerNav = document.getElementById('headerNav');
    const navOverlay = document.getElementById('navOverlay');

    if (!hamburgerBtn || !headerNav || !navOverlay) {
        console.warn('⚠️  Elementos do menu hamburguer não encontrados');
        return;
    }

    // Toggle menu ao clicar no hamburguer
    hamburgerBtn.addEventListener('click', () => {
        const isActive = headerNav.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Fechar menu ao clicar no overlay
    navOverlay.addEventListener('click', () => {
        closeMenu();
    });

    // Fechar menu ao clicar num item do menu
    const navItems = headerNav.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && headerNav.classList.contains('active')) {
            closeMenu();
        }
    });

    function openMenu() {
        headerNav.classList.add('active');
        navOverlay.classList.add('active');
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }

    function closeMenu() {
        headerNav.classList.remove('active');
        navOverlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    console.log('✅ Menu hamburguer configurado');
}

/**
 * Aplica permissões baseadas no role do utilizador
 */
function applyRolePermissions() {
    // Obter user info do localStorage
    const userStr = localStorage.getItem('admin_user');
    if (!userStr) {
        console.warn('⚠️  User info não encontrada');
        return;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (error) {
        console.error('❌ Erro ao parsear user info:', error);
        return;
    }

    console.log('👤 User:', user.nome, 'Role:', user.role);

    // Mostrar nome do utilizador (desktop)
    const userNameElement = document.getElementById('currentUserName');
    if (userNameElement) {
        userNameElement.textContent = user.nome;
    }

    // Mostrar nome do utilizador (mobile)
    const mobileUserName = document.getElementById('mobileUserName');
    if (mobileUserName) {
        mobileUserName.textContent = user.nome;
    }

    // Se for barbeiro, esconder itens admin-only
    if (user.role === 'barbeiro') {
        console.log('🔒 Aplicando restrições de barbeiro...');
        
        // Esconder itens marcados com data-admin-only="true"
        const adminOnlyItems = document.querySelectorAll('[data-admin-only="true"]');
        adminOnlyItems.forEach(item => {
            item.style.display = 'none';
        });

        // Redirecionar se estiver numa página restrita
        const currentPath = window.location.pathname;
        const restrictedPaths = ['/admin/clients', '/admin/clients.html', '/admin/client-detail.html', '/admin/new-booking', '/admin/new-booking.html'];
        
        if (restrictedPaths.some(path => currentPath.includes(path))) {
            console.warn('⚠️  Acesso negado a página restrita');
            window.location.href = '/admin/dashboard';
        }
    }
}

/**
 * Setup do botão de logout
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Limpar dados de autenticação
            localStorage.removeItem('admin_token');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('admin_user');
            
            // Redirecionar para login
            window.location.href = '/admin/login.html';
        });
    }
}

// Auto-load on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const pageAttr = document.body.getAttribute('data-page');
        if (pageAttr) {
            loadAdminHeader(pageAttr);
        }
    });
} else {
    const pageAttr = document.body.getAttribute('data-page');
    if (pageAttr) {
        loadAdminHeader(pageAttr);
    }
}
