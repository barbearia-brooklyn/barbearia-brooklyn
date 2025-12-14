// auth.js - Lógica de Autenticação

document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');

    // OAuth Buttons - Login
    const loginGoogleBtn = document.getElementById('loginGoogle');
    const loginFacebookBtn = document.getElementById('loginFacebook');
    const loginInstagramBtn = document.getElementById('loginInstagram');

    // OAuth Buttons - Register
    const registerGoogleBtn = document.getElementById('registerGoogle');
    const registerFacebookBtn = document.getElementById('registerFacebook');
    const registerInstagramBtn = document.getElementById('registerInstagram');

    // ===== TABS =====
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            if (targetTab === 'login') {
                loginForm.classList.add('active');
            } else {
                registerForm.classList.add('active');
            }
        });
    });

    // ===== OAUTH LOGIN =====
    if (loginGoogleBtn) {
        loginGoogleBtn.addEventListener('click', () => initiateOAuthLogin('google'));
    }
    if (loginFacebookBtn) {
        loginFacebookBtn.addEventListener('click', () => initiateOAuthLogin('facebook'));
    }
    if (loginInstagramBtn) {
        loginInstagramBtn.addEventListener('click', () => initiateOAuthLogin('instagram'));
    }

    // ===== OAUTH REGISTER =====
    if (registerGoogleBtn) {
        registerGoogleBtn.addEventListener('click', () => initiateOAuthRegister('google'));
    }
    if (registerFacebookBtn) {
        registerFacebookBtn.addEventListener('click', () => initiateOAuthRegister('facebook'));
    }
    if (registerInstagramBtn) {
        registerInstagramBtn.addEventListener('click', () => initiateOAuthRegister('instagram'));
    }

    // ===== FUNÇÃO OAUTH LOGIN =====
    async function initiateOAuthLogin(provider) {
        try {
            const response = await utils.apiRequest(`/api_auth/oauth/${provider}/authorize`);
            
            if (response.ok && response.data.authUrl) {
                // Redirecionar para o provedor OAuth
                window.location.href = response.data.authUrl;
            } else {
                utils.showError('login-error', 'Erro ao iniciar autenticação');
            }
        } catch (error) {
            console.error('Erro OAuth:', error);
            utils.showError('login-error', 'Erro ao iniciar autenticação');
        }
    }

    // ===== FUNÇÃO OAUTH REGISTER =====
    async function initiateOAuthRegister(provider) {
        try {
            // Guardar no sessionStorage que estamos em modo registo
            sessionStorage.setItem('oauth_flow', 'register');
            sessionStorage.setItem('oauth_provider', provider);
            
            const response = await utils.apiRequest(`/api_auth/oauth/${provider}/authorize`);
            
            if (response.ok && response.data.authUrl) {
                window.location.href = response.data.authUrl;
            } else {
                utils.showError('register-error', 'Erro ao iniciar autenticação');
            }
        } catch (error) {
            console.error('Erro OAuth:', error);
            utils.showError('register-error', 'Erro ao iniciar autenticação');
        }
    }

    // ===== VERIFICAR SE VOLTOU DO OAUTH (REGISTER) =====
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('oauth_register')) {
        // Trocar para tab de registo
        document.querySelector('[data-tab="register"]').click();
        
        // Recuperar dados do OAuth
        const oauthData = sessionStorage.getItem('oauth_user_data');
        if (oauthData) {
            try {
                const userData = JSON.parse(oauthData);
                
                // Preencher formulário
                if (userData.name) {
                    document.getElementById('register-name').value = userData.name;
                }
                if (userData.email) {
                    document.getElementById('register-email').value = userData.email;
                }
                
                // Guardar dados do provider
                document.getElementById('oauth-provider').value = sessionStorage.getItem('oauth_provider') || '';
                document.getElementById('oauth-user-data').value = oauthData;
                
                // Mostrar alerta
                document.getElementById('oauth-prefill-alert').style.display = 'block';
                
                // Limpar sessionStorage
                sessionStorage.removeItem('oauth_user_data');
                sessionStorage.removeItem('oauth_provider');
                sessionStorage.removeItem('oauth_flow');
                
                // Focar no primeiro campo vazio
                if (!document.getElementById('register-phone').value) {
                    document.getElementById('register-phone').focus();
                }
            } catch (error) {
                console.error('Erro ao processar dados OAuth:', error);
            }
        }
    }

    // ===== LOGIN TRADICIONAL =====
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            utils.hideMessages('login-error');
            
            const emailOrPhone = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            const response = await utils.apiRequest('/api_auth/login', {
                method: 'POST',
                body: JSON.stringify({ emailOrPhone, password })
            });
            
            if (response.ok) {
                window.location.href = 'perfil.html';
            } else {
                utils.showError('login-error', response.data?.error || 'Erro ao fazer login');
            }
        });
    }

    // ===== REGISTO TRADICIONAL =====
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            utils.hideMessages('register-error', 'register-success');
            
            const nome = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const telefone = document.getElementById('register-phone').value.trim();
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;
            
            // Validar passwords
            if (!utils.validatePasswords(password, passwordConfirm, 'register-error')) {
                return;
            }
            
            // Verificar se é registo OAuth
            const oauthProvider = document.getElementById('oauth-provider').value;
            const oauthUserData = document.getElementById('oauth-user-data').value;
            
            let requestData = { nome, email, telefone, password };
            
            if (oauthProvider && oauthUserData) {
                // Registo OAuth
                requestData.oauthProvider = oauthProvider;
                requestData.oauthData = JSON.parse(oauthUserData);
            }
            
            const response = await utils.apiRequest('/api_auth/register', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                utils.showSuccess('register-success', 'Conta criada! Verifique o seu email.');
                setTimeout(() => {
                    window.location.href = 'perfil.html';
                }, 2000);
            } else {
                utils.showError('register-error', response.data?.error || 'Erro ao criar conta');
            }
        });
    }

    // ===== FORGOT PASSWORD =====
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            utils.openModal('resetPasswordModal');
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            utils.hideMessages('reset-error', 'reset-success');
            
            const email = document.getElementById('reset-email').value.trim();
            
            const response = await utils.apiRequest('/api_auth_reset/request', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            
            if (response.ok) {
                utils.showSuccess('reset-success', 'Verifique o seu email para recuperar a password');
                document.getElementById('reset-email').value = '';
            } else {
                utils.showError('reset-error', response.data?.error || 'Erro ao enviar email');
            }
        });
    }
});