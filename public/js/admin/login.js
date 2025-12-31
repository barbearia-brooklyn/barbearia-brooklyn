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
        this.submitButton = document.getElementById('loginButton');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.togglePasswordIcon = document.getElementById('togglePasswordIcon');
        this.turnstileToken = null;
        
        this.init();
    }

    init() {
        if (!this.form) {
            console.error('❌ Formulário de login não encontrado');
            return;
        }

        // Event listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Password toggle
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        // Verificar se já está autenticado
        this.checkExistingAuth();
        
        // Configurar callbacks globais do Turnstile
        this.setupTurnstileCallbacks();
        
        console.log('✅ AdminLogin inicializado');
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        
        // Toggle tipo de input
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        // Toggle ícone
        if (isPassword) {
            this.togglePasswordIcon.classList.remove('fa-eye');
            this.togglePasswordIcon.classList.add('fa-eye-slash');
            this.togglePasswordBtn.setAttribute('aria-label', 'Ocultar password');
            this.togglePasswordBtn.setAttribute('title', 'Ocultar password');
        } else {
            this.togglePasswordIcon.classList.remove('fa-eye-slash');
            this.togglePasswordIcon.classList.add('fa-eye');
            this.togglePasswordBtn.setAttribute('aria-label', 'Mostrar password');
            this.togglePasswordBtn.setAttribute('title', 'Mostrar password');
        }
    }

    setupTurnstileCallbacks() {
        // Callbacks globais para o Turnstile
        window.onTurnstileSuccess = (token) => {
            console.log('✅ Turnstile validado');
            this.turnstileToken = token;
        };

        window.onTurnstileError = (error) => {
            console.error('❌ Erro no Turnstile:', error);
            this.turnstileToken = null;
        };

        window.onTurnstileExpired = () => {
            console.log('⚠️  Turnstile expirado');
            this.turnstileToken = null;
        };
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

        // Validar campos
        if (!username || !password) {
            this.showError('Por favor, preencha todos os campos.');
            return;
        }

        // Obter Turnstile token
        const turnstileToken = this.getTurnstileToken();
        
        // Login
        await this.login(username, password, turnstileToken);
    }

    getTurnstileToken() {
        // Se já temos token guardado (callback foi chamado)
        if (this.turnstileToken) {
            return this.turnstileToken;
        }

        // Tentar obter via API do Turnstile
        if (window.turnstile) {
            try {
                const response = window.turnstile.getResponse();
                if (response) {
                    return response;
                }
            } catch (error) {
                console.error('Erro ao obter token Turnstile:', error);
            }
        }
        
        // Fallback: token dummy para desenvolvimento/testes
        console.log('⚠️  Usando token Turnstile dummy');
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
                try {
                    window.turnstile.reset();
                    this.turnstileToken = null;
                } catch (e) {
                    console.error('Erro ao resetar Turnstile:', e);
                }
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

console.log('✅ AdminLogin script carregado');
