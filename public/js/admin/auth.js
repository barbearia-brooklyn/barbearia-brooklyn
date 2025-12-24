/**
 * Brooklyn Barbearia - Authentication Manager
 * Standalone authentication handler - no dependencies
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
            console.log('✅ Login form initialized');
        }

        // Check auth on dashboard pages
        if (document.querySelector('.admin-dashboard')) {
            this.checkAuth();
        }

        // Logout button
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
        const loginButton = document.getElementById('loginButton');

        // Check Turnstile
        if (!this.turnstileToken) {
            this.showError(errorDiv, 'Por favor, complete a verificação de segurança.');
            return;
        }

        try {
            // Disable button
            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A entrar...';

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
                // Save token and user
                localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem(this.USER_KEY, JSON.stringify({
                    username: username
                }));

                // Success message
                errorDiv.style.display = 'block';
                errorDiv.className = 'alert alert-success';
                errorDiv.textContent = '✅ Login realizado com sucesso!';
                loginButton.innerHTML = '✅ Sucesso!';

                // Redirect
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 800);
            } else {
                // Reset Turnstile on error
                this.resetTurnstile();
                
                this.showError(errorDiv, data.error || 'Credenciais inválidas');
                loginButton.disabled = false;
                loginButton.innerHTML = 'Entrar';
            }
        } catch (error) {
            console.error('Erro de login:', error);
            
            // Reset Turnstile on error
            this.resetTurnstile();
            
            this.showError(errorDiv, 'Erro ao tentar fazer login. Tente novamente.');
            loginButton.disabled = false;
            loginButton.innerHTML = 'Entrar';
        }
    }

    static showError(errorDiv, message) {
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-error';
        errorDiv.textContent = message;
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
            console.warn('⚠️ No token found, redirecting to login');
            window.location.href = '/admin-login.html';
            return false;
        }
        return true;
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
        try {
            return JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
}

// ===== TURNSTILE CALLBACKS (Global scope) =====

window.onTurnstileSuccess = function(token) {
    console.log('✅ Turnstile validated successfully');
    AuthManager.turnstileToken = token;
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = false;
    }
};

window.onTurnstileError = function(errorCode) {
    console.error('❌ Turnstile error:', errorCode);
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        let errorMessage = 'Erro na verificação de segurança.';
        
        switch(errorCode) {
            case '110200':
                errorMessage = 'Erro de rede. Verifique sua conexão e recarregue a página.';
                break;
            case '110100':
                errorMessage = 'Erro de configuração. Contacte o administrador.';
                break;
            case '110500':
                errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
                break;
            case '110600':
                errorMessage = 'Timeout. Recarregue a página.';
                break;
            default:
                errorMessage = `Erro na verificação (${errorCode}). Recarregue a página.`;
        }
        
        AuthManager.showError(errorDiv, errorMessage);
    }
    
    AuthManager.turnstileToken = null;
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = true;
    }
};

window.onTurnstileExpired = function() {
    console.warn('⚠️ Turnstile token expired');
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        AuthManager.showError(errorDiv, 'Verificação expirada. Complete novamente.');
    }
    
    AuthManager.turnstileToken = null;
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = true;
    }
};

window.onTurnstileRender = function(widgetId) {
    console.log('📍 Turnstile rendered with ID:', widgetId);
    AuthManager.turnstileWidgetId = widgetId;
};

// ===== INITIALIZE =====

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AuthManager.init();
    });
} else {
    AuthManager.init();
}

console.log('✅ Auth module loaded');
