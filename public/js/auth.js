// auth.js - Lógica de Autenticação

document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const setNewPasswordModal = document.getElementById('setNewPasswordModal');
    const setNewPasswordForm = document.getElementById('setNewPasswordForm');

    // OAuth Buttons - Login
    const loginGoogleBtn = document.getElementById('loginGoogle');
    const loginFacebookBtn = document.getElementById('loginFacebook');
    const loginInstagramBtn = document.getElementById('loginInstagram');

    // OAuth Buttons - Register
    const registerGoogleBtn = document.getElementById('registerGoogle');
    const registerFacebookBtn = document.getElementById('registerFacebook');
    const registerInstagramBtn = document.getElementById('registerInstagram');

    // ===== VERIFICAR PARÂMETROS URL =====
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar se é reset de password via email
    if (urlParams.has('reset_token')) {
        const token = urlParams.get('reset_token');
        // Abrir modal de nova password
        utils.openModal('setNewPasswordModal');
        document.getElementById('reset-token').value = token;
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Email verificado
    if (urlParams.has('verified')) {
        utils.showSuccess('login-error', 'Email verificado com sucesso! Pode agora fazer login.');
        document.querySelector('[data-tab="login"]').click();
    }
    
    // Erros de verificação
    if (urlParams.get('error') === 'token_invalido') {
        utils.showError('login-error', 'Link de verificação inválido.');
    }
    if (urlParams.get('error') === 'token_expirado') {
        utils.showError('login-error', 'Link de verificação expirado. Por favor, solicite um novo.');
    }
    
    // Verificar se tem redirect param
    const redirectUrl = urlParams.get('redirect');

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
                window.location.href = response.data.authUrl;
            } else {
                // Mostrar mensagem específica do servidor
                const errorMessage = response.data?.message || response.data?.error || 'Erro ao iniciar autenticação';
                utils.showError('login-error', errorMessage);
            }
        } catch (error) {
            console.error('Erro OAuth:', error);
            utils.showError('login-error', 'Erro ao iniciar autenticação. Por favor, tente novamente.');
        }
    }

    // ===== FUNÇÃO OAUTH REGISTER =====
    async function initiateOAuthRegister(provider) {
        try {
            const response = await utils.apiRequest(`/api_auth/oauth/${provider}/authorize?mode=register`);
            
            if (response.ok && response.data.authUrl) {
                window.location.href = response.data.authUrl;
            } else {
                // Mostrar mensagem específica do servidor
                const errorMessage = response.data?.message || response.data?.error || 'Erro ao iniciar autenticação';
                utils.showError('register-error', errorMessage);
            }
        } catch (error) {
            console.error('Erro OAuth:', error);
            utils.showError('register-error', 'Erro ao iniciar autenticação. Por favor, tente novamente.');
        }
    }

    // ===== VERIFICAR SE VOLTOU DO OAUTH (REGISTER) =====
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
            
            const identifier = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            // Obter token Turnstile
            const turnstileToken = document.querySelector('#loginForm .cf-turnstile [name="cf-turnstile-response"]')?.value;

            if (!turnstileToken) {
                utils.showError('login-error', 'Por favor, complete a verificação de segurança. Se o problema persistir, recarregue a página.');
                return;
            }
            
            const response = await utils.apiRequest('/api_auth/login', {
                method: 'POST',
                body: JSON.stringify({ identifier, password, turnstileToken })
            });
            
            if (response.ok) {
                // Verificar se tem reserva pendente ou redirect
                const pendingBooking = sessionStorage.getItem('pendingBooking');
                
                if (pendingBooking) {
                    // Redirecionar para reservar.html (reserva será restaurada lá)
                    window.location.href = 'reservar.html';
                } else if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'perfil.html';
                }
            } else {
                const errorData = response.data;
                
                // Se tem link de reset, mostrar com HTML
                if (errorData?.showResetLink) {
                    const errorDiv = document.getElementById('login-error');
                    errorDiv.innerHTML = errorData.error + ' <a href="#" id="openResetModalFromLoginError" class="error-link">Clique aqui</a>';
                    errorDiv.style.display = 'block';
                    
                    // Adicionar event listener ao link
                    setTimeout(() => {
                        const resetLink = document.getElementById('openResetModalFromLoginError');
                        if (resetLink) {
                            resetLink.addEventListener('click', (e) => {
                                e.preventDefault();
                                utils.openModal('resetPasswordModal');
                                document.getElementById('reset-email').value = identifier;
                            });
                        }
                    }, 100);
                } else {
                    utils.showError('login-error', errorData?.error || 'Erro ao fazer login');
                }
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
            
            // Adicionar token Turnstile apenas se não for OAuth
            if (!oauthProvider) {
                const turnstileToken = document.querySelector('#registerForm .cf-turnstile [name="cf-turnstile-response"]')?.value;
                
                if (!turnstileToken) {
                    utils.showError('register-error', 'Por favor, complete a verificação de segurança. Se o problema persistir, recarregue a página.');
                    return;
                }
                
                requestData.turnstileToken = turnstileToken;
            }
            
            if (oauthProvider && oauthUserData) {
                requestData.oauthProvider = oauthProvider;
                requestData.oauthData = JSON.parse(oauthUserData);
            }
            
            const response = await utils.apiRequest('/api_auth/register', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                // Verificar se tem reserva pendente
                const pendingBooking = sessionStorage.getItem('pendingBooking');
                
                if (pendingBooking) {
                    // Login automático e redirecionar para reservar.html
                    const loginResponse = await utils.apiRequest('/api_auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ identifier: email, password })
                    });
                    
                    if (loginResponse.ok) {
                        window.location.href = 'reservar.html';
                    } else {
                        // Se falhar login automático, trocar para tab de login
                        utils.showSuccess('register-success', 'Conta criada! Por favor, faça login para continuar com a reserva.');
                        setTimeout(() => {
                            document.querySelector('[data-tab="login"]').click();
                            document.getElementById('login-email').value = email;
                        }, 2000);
                    }
                } else {
                    // Sem reserva pendente - mostrar mensagem de sucesso normal
                    utils.showSuccess('register-success', 'Conta criada! Verifique o seu email para ativar a conta.');
                    
                    // Limpar formulário
                    registerForm.reset();
                    document.getElementById('oauth-provider').value = '';
                    document.getElementById('oauth-user-data').value = '';
                    document.getElementById('oauth-prefill-alert').style.display = 'none';
                }
                
            } else {
                const errorData = response.data;
                
                // Se tem link de reset, mostrar com HTML
                if (errorData?.showResetLink) {
                    const errorDiv = document.getElementById('register-error');
                    errorDiv.innerHTML = errorData.error + ' <a href="#" id="openResetModalFromError" class="error-link">Clique aqui</a>';
                    errorDiv.style.display = 'block';
                    
                    // Adicionar event listener ao link
                    setTimeout(() => {
                        const resetLink = document.getElementById('openResetModalFromError');
                        if (resetLink) {
                            resetLink.addEventListener('click', (e) => {
                                e.preventDefault();
                                utils.openModal('resetPasswordModal');
                                document.getElementById('reset-email').value = email;
                            });
                        }
                    }, 100);
                } else {
                    utils.showError('register-error', errorData?.error || 'Erro ao criar conta');
                }
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

    // ===== SET NEW PASSWORD =====
    if (setNewPasswordForm) {
        setNewPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            utils.hideMessages('set-password-error', 'set-password-success');
            
            const token = document.getElementById('reset-token').value;
            const newPassword = document.getElementById('new-password').value;
            const newPasswordConfirm = document.getElementById('new-password-confirm').value;
            
            // Validar passwords
            if (!utils.validatePasswords(newPassword, newPasswordConfirm, 'set-password-error')) {
                return;
            }
            
            const response = await utils.apiRequest('/api_auth_reset/reset', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword })
            });
            
            if (response.ok) {
                utils.showSuccess('set-password-success', 'Password redefinida com sucesso! Pode agora fazer login.');
                
                // Fechar modal após 2 segundos e trocar para tab de login
                setTimeout(() => {
                    utils.closeModal('setNewPasswordModal');
                    document.querySelector('[data-tab="login"]').click();
                    setNewPasswordForm.reset();
                }, 2000);
            } else {
                utils.showError('set-password-error', response.data?.error || 'Erro ao redefinir password');
            }
        });
    }
});