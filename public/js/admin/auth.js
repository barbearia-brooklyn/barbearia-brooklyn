/**
 * Admin Auth Helper
 * Funções de autenticação e autorização client-side
 */

class AdminAuth {
    constructor() {
        this.checkAuth();
    }

    /**
     * Verifica se o utilizador está autenticado
     */
    checkAuth() {
        const token = this.getToken();
        const currentPath = window.location.pathname;
        
        // Página de login não precisa de autenticação
        if (currentPath.includes('/admin/login')) {
            return;
        }

        // Verificar se tem token
        if (!token) {
            console.warn('⚠️ Token não encontrado - redirecionando para login');
            window.location.href = '/admin/login.html';
            return;
        }

        // Verificar expiração do token
        if (this.isTokenExpired(token)) {
            console.warn('⚠️ Token expirado - redirecionando para login');
            this.logout();
            return;
        }
    }

    /**
     * Obtém o token do localStorage
     */
    getToken() {
        return localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
    }

    /**
     * Obtém informações do utilizador
     */
    getUser() {
        const userStr = localStorage.getItem('admin_user');
        if (!userStr) return null;
        
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('❌ Erro ao parsear user:', error);
            return null;
        }
    }

    /**
     * Verifica se o token está expirado
     */
    isTokenExpired(token) {
        try {
            // Decodificar JWT (simples, sem validação de assinatura)
            const parts = token.split('.');
            if (parts.length !== 3) return true;
            
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            
            return payload.exp < now;
        } catch (error) {
            console.error('❌ Erro ao verificar token:', error);
            return true;
        }
    }

    /**
     * Verifica se o utilizador tem determinada permissão
     */
    hasPermission(permission) {
        const user = this.getUser();
        if (!user) return false;
        
        // Admin tem todas as permissões
        if (user.role === 'admin') return true;
        
        // Barbeiros têm permissões limitadas
        const barbeiroPermissions = [
            'view_own_bookings',
            'edit_own_bookings',
            'view_own_unavailable',
            'edit_own_unavailable',
            'view_calendar',
            'view_dashboard'
        ];
        
        return barbeiroPermissions.includes(permission);
    }

    /**
     * Verifica se é admin
     */
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }

    /**
     * Verifica se é barbeiro
     */
    isBarbeiro() {
        const user = this.getUser();
        return user && user.role === 'barbeiro';
    }

    /**
     * Faz logout
     */
    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login.html';
    }
}

// Criar instância global
window.adminAuth = new AdminAuth();

console.log('✅ AdminAuth loaded');
