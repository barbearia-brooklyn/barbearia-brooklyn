// auth.js - Gestão de autenticação (Login/Registo/Reset)

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthTabs();
    initializeLoginForm();
    initializeRegisterForm();
    initializeResetForm();
    initializeForgotPasswordLink();
    initializeSocialLogin();
    
    // Verificar se é redirect de erro OAuth
    checkOAuthErrors();
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
        const result = await utils.apiRequest(`/api_auth/oauth/${provider}/authorize`, {
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

function checkOAuthErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
        utils.showError('login-error', decodeURIComponent(error));
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ===== LOGIN COM EMAIL OU TELEFONE =====
function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const identifier = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        utils.hideMessages('login-error');

        const result = await utils.apiRequest('/api_auth/login', {
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

            // Login normal
            const pendingBooking = sessionStorage.getItem('pendingBooking');
            if (pendingBooking) {
                sessionStorage.removeItem('pendingBooking');
                window.location.href = 'reservar.html';
            } else {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || 'perfil.html';
                window.location.href = redirect;
            }
        } else {
            utils.showError('login-error', result.data?.error || result.error);
        }
    });
}

// ===== REGISTO COM PRÉ-PREENCHIMENTO =====
function initializeRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Verificar se há perfil incompleto
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('complete') === 'true') {
        const incompleteProfile = sessionStorage.getItem('incompleteProfile');
        if (incompleteProfile) {
            const profile = JSON.parse(incompleteProfile);
            showCompletionMessage();
            prefillRegistrationForm(profile);
            
            // Mudar para tab de registo
            document.querySelector('.auth-tab[data-tab="register"]').click();
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const telefone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        const isCompletion = sessionStorage.getItem('incompleteProfile') !== null;

        utils.hideMessages('register-error', 'register-success');

        if (!utils.validatePasswords(password, passwordConfirm, 'register-error')) {
            return;
        }

        const endpoint = isCompletion ? '/api_auth/complete-profile' : '/api_auth/register';

        const result = await utils.apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({ nome, email, telefone, password })
        });

        if (result.ok) {
            sessionStorage.removeItem('incompleteProfile');

            if (isCompletion) {
                utils.showSuccess('register-success', 'Perfil completado com sucesso!');
                setTimeout(() => window.location.href = 'perfil.html', 1500);
            } else {
                utils.showSuccess('register-success', result.data.message || 'Conta criada! Verifique o seu email.');
                form.reset();
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

function showCompletionMessage() {
    const alert = document.getElementById('completion-alert');
    if (alert) {
        alert.style.display = 'block';
    }
}

function prefillRegistrationForm(profile) {
    if (profile.nome) document.getElementById('register-name').value = profile.nome;
    if (profile.email) document.getElementById('register-email').value = profile.email;
    if (profile.telefone) document.getElementById('register-phone').value = profile.telefone;
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