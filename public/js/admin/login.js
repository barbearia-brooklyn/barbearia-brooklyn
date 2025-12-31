/**
 * Brooklyn Barbearia - Admin Login
 * Sistema de login com JWT e roles
 */

class AdminLogin {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.errorMessage = document.getElementById('errorMessage');
        this.submitButton = this.form?.querySelector('button[type="submit"]');
        
        this.init();
    }

    init() {
        if (!this.form) {
            console.error('❌ Formulário de login não encontrado');
            return;
        }

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Verificar se já está autenticado
        this.checkExistingAuth();
    }

    checkExistingAuth() {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
        if (token) {
            console.log('✅ Token existente encontrado - redirecionando...');
            window.location.href = '/admin/dashboard';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        if (!username || !password) {
            this.showError('Por favor, preencha todos os campos.');
            return;
        }

        // Obter Turnstile token
        const turnstileToken = await this.getTurnstileToken();
        if (!turnstileToken) {
            this.showError('Por favor, complete a verificação de segurança.');
            return;
        }

        await this.login(username, password, turnstileToken);
    }

    async getTurnstileToken() {
        // Implementação do Turnstile (se existir na página)
        if (window.turnstile) {
            try {
                return await window.turnstile.getResponse();
            } catch (error) {
                console.error('Erro ao obter token Turnstile:', error);
                return null;
            }
        }
        
        // Se não houver Turnstile, retornar token dummy para desenvolvimento
        return 'dummy-token-for-development';
    }

    async login(username, password, turnstileToken) {
        this.setLoading(true);
        this.hideError();

        try {
            const response = await fetch('/api/admin/api_admin_login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    turnstileToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }

            if (data.success && data.token && data.user) {
                // Guardar token e informações do utilizador
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('adminToken', data.token); // Backward compatibility
                localStorage.setItem('admin_user', JSON.stringify(data.user));

                console.log('✅ Login bem-sucedido:', data.user.username, 'Role:', data.user.role);

                // Redirecionar para dashboard
                window.location.href = '/admin/dashboard';
            } else {
                throw new Error('Resposta de login inválida');
            }

        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showError(error.message || 'Erro ao fazer login. Tente novamente.');
            this.setLoading(false);
            
            // Reset Turnstile se existir
            if (window.turnstile) {
                window.turnstile.reset();
            }
        }
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }

    setLoading(loading) {
        if (this.submitButton) {
            this.submitButton.disabled = loading;
            this.submitButton.innerHTML = loading 
                ? '<i class="fas fa-spinner fa-spin"></i> A entrar...' 
                : 'Entrar';
        }
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminLogin = new AdminLogin();
    });
} else {
    window.adminLogin = new AdminLogin();
}

console.log('✅ AdminLogin loaded');
