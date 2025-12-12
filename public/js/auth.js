// auth.js - Gestão de autenticação (Login/Registo/Reset)

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthTabs();
    initializeLoginForm();
    initializeRegisterForm();
    initializeResetForm();
    initializeForgotPasswordLink();
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

// ===== LOGIN =====
function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        utils.hideMessages('login-error');

        const result = await utils.apiRequest('/api_auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.ok) {
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

        utils.hideMessages('register-error', 'register-success');

        // Validar passwords
        if (!utils.validatePasswords(password, passwordConfirm, 'register-error')) {
            return;
        }

        const result = await utils.apiRequest('/api_auth/register', {
            method: 'POST',
            body: JSON.stringify({ nome, email, telefone, password })
        });

        if (result.ok) {
            utils.showSuccess('register-success',
                result.data.message || 'Conta criada! Verifique o seu email.');
            document.getElementById('registerForm').reset();
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