/**
 * Brooklyn Barbearia - Admin Header
 * Gestão do header e menu hamburguer
 */

class AdminHeader {
    constructor() {
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.headerNav = document.getElementById('headerNav');
        this.navOverlay = document.getElementById('navOverlay');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.navItems = document.querySelectorAll('.nav-item');
        
        this.init();
    }

    init() {
        // Verificar autenticação e carregar user
        this.loadUserInfo();
        
        // Event listeners
        if (this.hamburgerBtn) {
            this.hamburgerBtn.addEventListener('click', () => this.toggleMenu());
        }
        
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', () => this.closeMenu());
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Fechar menu ao clicar num item (mobile)
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMenu();
                }
            });
        });
        
        // Fechar menu ao redimensionar para desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMenu();
            }
        });
        
        // Fechar menu com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.headerNav.classList.contains('active')) {
                this.closeMenu();
            }
        });
        
        // Destacar item ativo baseado na URL
        this.highlightActiveItem();
        
        console.log('✅ AdminHeader inicializado');
    }

    toggleMenu() {
        const isActive = this.headerNav.classList.contains('active');
        
        if (isActive) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.headerNav.classList.add('active');
        this.hamburgerBtn.classList.add('active');
        this.navOverlay.classList.add('active');
        this.hamburgerBtn.setAttribute('aria-expanded', 'true');
        
        // Prevenir scroll no body
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.headerNav.classList.remove('active');
        this.hamburgerBtn.classList.remove('active');
        this.navOverlay.classList.remove('active');
        this.hamburgerBtn.setAttribute('aria-expanded', 'false');
        
        // Restaurar scroll no body
        document.body.style.overflow = '';
    }

    async loadUserInfo() {
        try {
            // Tentar obter do localStorage primeiro
            const adminUserStr = localStorage.getItem('admin_user');
            
            if (adminUserStr) {
                const adminUser = JSON.parse(adminUserStr);
                this.updateUserDisplay(adminUser);
            }
            
            // Verificar token válido (opcional)
            const token = localStorage.getItem('admin_token');
            if (!token) {
                console.warn('⚠️  Sem token de admin');
                // Redirecionar para login se necessário
                // window.location.href = '/admin/login.html';
            }
        } catch (error) {
            console.error('❌ Erro ao carregar info do user:', error);
        }
    }

    updateUserDisplay(user) {
        // Atualizar nome do user nos elementos
        const currentUserName = document.getElementById('currentUserName');
        const mobileUserName = document.getElementById('mobileUserName');
        
        const displayName = user.nome || user.username || 'Utilizador';
        
        if (currentUserName) {
            currentUserName.textContent = displayName;
        }
        
        if (mobileUserName) {
            mobileUserName.textContent = displayName;
        }
        
        // Esconder items admin-only se não for admin
        if (user.role !== 'admin') {
            document.querySelectorAll('[data-admin-only="true"]').forEach(item => {
                item.style.display = 'none';
            });
        }
    }

    highlightActiveItem() {
        const currentPath = window.location.pathname;
        
        this.navItems.forEach(item => {
            const itemPath = new URL(item.href).pathname;
            
            if (currentPath === itemPath) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    async handleLogout() {
        try {
            // Limpar localStorage
            localStorage.removeItem('admin_token');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('admin_user');
            
            console.log('✅ Logout efetuado');
            
            // Redirecionar para login
            window.location.href = '/admin/login.html';
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            alert('Erro ao fazer logout. Tente novamente.');
        }
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminHeader = new AdminHeader();
    });
} else {
    window.adminHeader = new AdminHeader();
}

console.log('✅ AdminHeader script carregado');
