// auth.js - Gestão de autenticação (Login/Registo/Reset/OAuth)

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthTabs();
    initializeLoginForm();
    initializeRegisterForm();
    initializeResetForm();
    initializeForgotPasswordLink();
    initializeSocialLogin();
    checkForCompletionFlow();
});

// ===== NAVEGAÇÃO ENTRE TABS =====
function initializeAuthTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });

            const formId = targetTab === 'login' ? 'loginForm' : 'registerForm';
            document.getElementById(formId)?.classList.add('active');
        });
    });
}

// ===== OAUTH SOCIAL LOGIN =====
function initializeSocialLogin() {
    // Google
    document.getElementById('loginGoogle')?.addEventListener('click', () => {
        initiateOAuthLogin('google');
    });
    
    // Facebook
    document.getElementById('loginFacebook')?.addEventListener('click', () => {
        initiateOAuthLogin('facebook');
    });
    
    // Instagram
    document.getElementById('loginInstagram')?.addEventListener('click', () => {
        initiateOAuthLogin('instagram');
    });
}

async function initiateOAuthLogin(provider) {
    try {
        const result = await utils.apiRequest(`/api/api_auth/oauth/${provider}/authorize`, {
            method: 'GET'
        });
        
        if (result.ok) {
            window.location.href = result.data.authUrl;
        } else {
            utils.showError('login-error', result.data?.error || 'Erro ao iniciar login social');
        }
    } catch (error) {
        console.error('Erro OAuth:', error);
        utils.showError('login-error', 'Erro ao iniciar login social');
    }
}

// ===== VERIFICAÇÃO DE FLUXO DE CONCLUSÃO =====
function checkForCompletionFlow() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('complete') === 'true') {
        // Mudar para tab de registo
        document.querySelector('[data-tab="register"]')?.click();
        
        const incompleteProfile = sessionStorage.getItem('incompleteProfile');
        if (incompleteProfile) {
            const profile = JSON.parse(incompleteProfile);
            showCompletionMessage();
            prefillRegistrationForm(profile);
        }
    }
}

function showCompletionMessage() {
    const message = document.getElementById('completion-message');
    if (message) {
        message.style.display = 'block';
    }
    
    // Mudar texto do botão
    const submitBtn = document.getElementById('register-submit-btn');
    if (submitBtn) {
        submitBtn.textContent = 'Completar Perfil';
    }
}

function prefillRegistrationForm(profile) {
    if (profile.nome) document.getElementById('register-name').value = profile.nome;
    if (profile.email) document.getElementById('register-email').value = profile.email;
    if (profile.telefone) document.getElementById('register-phone').value = profile.telefone;
}

// ===== LOGIN =====
function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const identifier = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        utils.hideMessages('login-error');

        const result = await utils.apiRequest('/api/api_auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });

        if (result.ok) {
            // Verificar se precisa completar perfil
            if (result.data.needsCompletion) {
                sessionStorage.setItem('incompleteProfile', JSON.stringify(result.data.profile));
                window.location.href = 'login.html?tab=register&complete=true';
                return;
            }
            
            // Verificar se há reserva pendente
            const pendingBooking = sessionStorage.getItem('pendingBooking');
            if (pendingBooking) {
                sessionStorage.removeItem('pendingBooking');
                window.location.href = 'reservar.html';
            } else {
                // Verificar redirect na URL
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || 'perfil.html';
                window.location.href = redirect;
            }
        } else {
            utils.showError('login-error', result.data?.error || result.error);
        }
    });
}

// ===== REGISTO =====
function initializeRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const telefone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        // Verificar se é completamento de perfil
        const incompleteProfile = sessionStorage.getItem('incompleteProfile');
        const isCompletion = incompleteProfile !== null;
        
        utils.hideMessages('register-error', 'register-success');

        // Validar passwords
        if (!utils.validatePasswords(password, passwordConfirm, 'register-error')) {
            return;
        }

        const endpoint = isCompletion ? '/api/api_auth/complete-profile' : '/api/api_auth/register';
        const body = isCompletion 
            ? { id: JSON.parse(incompleteProfile).id, nome, email, telefone, password }
            : { nome, email, telefone, password };

        const result = await utils.apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (result.ok) {
            sessionStorage.removeItem('incompleteProfile');
            
            if (isCompletion) {
                utils.showSuccess('register-success', 'Perfil completado com sucesso!');
                setTimeout(() => window.location.href = 'perfil.html', 1500);
            } else {
                utils.showSuccess('register-success',
                    result.data.message || 'Conta criada! Verifique o seu email.');
                document.getElementById('registerForm').reset();
            }
        } else {
            const isHtml = result.data?.isHtml;
            utils.showError('register-error', result.data?.error || result.error, isHtml);

            // Se houver link para abrir modal de reset
            if (isHtml) {
                const resetLink = document.getElementById('openResetModal');
                if (resetLink) {
                    resetLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        utils.hideMessages('register-error');
                        utils.openModal('resetPasswordModal');
                        document.getElementById('reset-email').value = email;
                    });
                }
            }
        }
    });
}

// ===== RESET PASSWORD =====
function initializeResetForm() {
    const form = document.getElementById('resetPasswordForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('reset-email').value;

        utils.hideMessages('reset-error', 'reset-success');

        const result = await utils.apiRequest('/api_auth_reset/request', {
            method: 'POST',
            body: JSON.stringify({ email })
        });

        if (result.ok) {
            utils.showSuccess('reset-success', 'Instruções enviadas para o seu email!');
            document.getElementById('reset-email').value = '';
        } else {
            utils.showError('reset-error', result.data?.error || result.error);
        }
    });
}

// ===== ABRIR MODAL DE RESET PASSWORD =====
function initializeForgotPasswordLink() {
    const link = document.getElementById('forgotPasswordLink');
    if (!link) return;

    link.addEventListener('click', function(e) {
        e.preventDefault();
        utils.openModal('resetPasswordModal');
    });
}