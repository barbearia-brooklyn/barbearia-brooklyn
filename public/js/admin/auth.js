/**
 * Gestão de autenticação
 */

class AuthManager {
    static LOGIN_API = '/api/admin/login';
    static TOKEN_KEY = 'adminToken';
    static USER_KEY = 'adminUser';

    static init() {
        // Se está na página de login
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Se está no dashboard, verificar token
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

        try {
            UIHelper.showLoading(true);

            const response = await fetch(this.LOGIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));

                // Redirecionar com delay pequeno
                setTimeout(() => {
                    window.location.href = '/admin-dashboard.html';
                }, 300);
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Credenciais inválidas';
            }
        } catch (error) {
            console.error('Erro de login:', error);
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Erro ao tentar fazer login. Tente novamente.';
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static checkAuth() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) {
            window.location.href = '/admin-login.html';
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

// Inicializar autenticação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => AuthManager.init());
