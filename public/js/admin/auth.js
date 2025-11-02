/**
 * Gestão de autenticação
 */

class AuthManager {
    static LOGIN_API = '/api/admin/api_admin_login';
    static TOKEN_KEY = 'adminToken';
    static USER_KEY = 'adminUser';

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

        try {
            UIHelper.showLoading(true);

            const response = await fetch(this.LOGIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem(this.USER_KEY, JSON.stringify({
                    username: username
                }));

                UIHelper.showAlert('Login realizado com sucesso!', 'success', 1500);

                setTimeout(() => {
                    window.location.href = '/admin-dashboard.html';
                }, 1500);
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = data.error || 'Credenciais inválidas';
                UIHelper.showAlert('Credenciais inválidas', 'error');
            }
        } catch (error) {
            console.error('Erro de login:', error);
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Erro ao tentar fazer login. Tente novamente.';
            UIHelper.showAlert('Erro ao tentar fazer login', 'error');
        } finally {
            UIHelper.showLoading(false);
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
            UIHelper.setUserInfo(user.username);
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

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM pronto, inicializando AuthManager');
    AuthManager.init();
});
