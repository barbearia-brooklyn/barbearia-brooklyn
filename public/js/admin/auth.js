/**
 * Gestão de autenticação
 */

class AuthManager {
    static LOGIN_API = '/api/admin/api_admin_login';
    static TOKEN_KEY = 'admin_token';
    static USER_KEY = 'admin_user';
    static turnstileToken = null;
    static turnstileWidgetId = null;

    static init() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('Login form inicializado');
        }

        if (document.querySelector('.admin-dashboard')) {
            this.checkAuth();
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    static async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        // Verificar se o Turnstile foi validado
        if (!this.turnstileToken) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Por favor, complete a verificação de segurança.';
            }
            return;
        }

        try {
            const response = await fetch(this.LOGIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username, 
                    password,
                    turnstileToken: this.turnstileToken 
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem(this.USER_KEY, JSON.stringify({
                    username: username
                }));

                // Redirect to dashboard
                window.location.href = '/admin/dashboard';
            } else {
                // Resetar Turnstile em caso de erro
                this.resetTurnstile();
                
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = data.error || 'Credenciais inválidas';
                }
            }
        } catch (error) {
            console.error('Erro de login:', error);
            
            // Resetar Turnstile em caso de erro
            this.resetTurnstile();
            
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Erro ao tentar fazer login. Tente novamente.';
            }
        }
    }

    static resetTurnstile() {
        if (window.turnstile && this.turnstileWidgetId !== null) {
            try {
                window.turnstile.reset(this.turnstileWidgetId);
            } catch (e) {
                console.error('Erro ao resetar Turnstile:', e);
            }
        }
        this.turnstileToken = null;
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.disabled = true;
        }
    }

    static checkAuth() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) {
            window.location.href = '/admin-login.html';
            return;
        }

        const user = JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
        if (user.username) {
            // Set user info if needed
            console.log('User logged in as:', user.username);
        }
    }

    static logout() {
        if (confirm('Tem a certeza que deseja sair?')) {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            window.location.href = '/admin-login.html';
        }
    }

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static getUser() {
        return JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
    }
}

// Função callback de sucesso do Turnstile (deve estar no escopo global)
window.onTurnstileSuccess = function(token) {
    console.log('Turnstile validado com sucesso');
    AuthManager.turnstileToken = token;
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = false;
    }
};

// Função callback de erro do Turnstile
window.onTurnstileError = function(errorCode) {
    console.error('Erro do Turnstile:', errorCode);
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        
        // Mensagens específicas para códigos de erro conhecidos
        let errorMessage = 'Erro na verificação de segurança.';
        
        switch(errorCode) {
            case '110200':
                errorMessage = 'Erro de rede ao verificar segurança. Verifique sua conexão e recarregue a página.';
                break;
            case '110100':
                errorMessage = 'Erro de configuração de segurança. Por favor, contacte o administrador.';
                break;
            case '110500':
                errorMessage = 'Serviço de segurança temporariamente indisponível. Tente novamente em alguns instantes.';
                break;
            case '110600':
                errorMessage = 'Timeout na verificação de segurança. Por favor, recarregue a página.';
                break;
            default:
                errorMessage = `Erro na verificação de segurança (${errorCode}). Por favor, recarregue a página.`;
        }
        
        errorDiv.textContent = errorMessage;
    }
    
    AuthManager.turnstileToken = null;
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = true;
    }
};

// Função callback de expiração do Turnstile
window.onTurnstileExpired = function() {
    console.warn('Token Turnstile expirado');
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Verificação de segurança expirada. Por favor, complete novamente.';
    }
    
    AuthManager.turnstileToken = null;
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = true;
    }
};

// Função callback quando o widget é renderizado
window.onTurnstileRender = function(widgetId) {
    console.log('Turnstile renderizado com ID:', widgetId);
    AuthManager.turnstileWidgetId = widgetId;
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM pronto, inicializando AuthManager');
    AuthManager.init();
});
