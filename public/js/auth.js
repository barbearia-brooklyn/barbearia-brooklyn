// auth.js - Gestão de autenticação (Login/Registo/Reset)

const { apiRequest, hideMessages, showError, showSuccess, validatePasswords, openModal } = utils;

// ===== NAVEGAÇÃO ENTRE TABS =====
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;

        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        const formId = targetTab === 'login' ? 'loginForm' : 'registerForm';
        document.getElementById(formId).classList.add('active');
    });
});

// ===== LOGIN =====
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    hideMessages('login-error');

    const result = await apiRequest('/api_auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (result.ok) {
        // Verificar se há reserva pendente no sessionStorage
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
        showError('login-error', result.data?.error || result.error);
    }
});

// ===== REGISTO =====
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nome = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const telefone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    hideMessages('register-error', 'register-success');

    // Validar passwords
    if (!validatePasswords(password, passwordConfirm, 'register-error')) {
        return;
    }

    const result = await apiRequest('/api_auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, telefone, password })
    });

    if (result.ok) {
        showSuccess('register-success',
            result.data.message || 'Conta criada! Verifique o seu email.');
        document.getElementById('registerForm').reset();
    } else {
        const isHtml = result.data?.isHtml;
        showError('register-error', result.data?.error || result.error, isHtml);

        // Se houver link para abrir modal de reset
        if (isHtml) {
            const resetLink = document.getElementById('openResetModal');
            if (resetLink) {
                resetLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    hideMessages('register-error');
                    openModal('resetPasswordModal');
                    document.getElementById('reset-email').value = email;
                });
            }
        }
    }
});

// ===== RESET PASSWORD =====
document.getElementById('resetPasswordForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('reset-email').value;

    hideMessages('reset-error', 'reset-success');

    const result = await apiRequest('/api_auth_reset/request', {
        method: 'POST',
        body: JSON.stringify({ email })
    });

    if (result.ok) {
        showSuccess('reset-success', 'Instruções enviadas para o seu email!');
        document.getElementById('reset-email').value = '';
    } else {
        showError('reset-error', result.data?.error || result.error);
    }
});

// ===== ABRIR MODAL DE RESET PASSWORD =====
document.getElementById('forgotPasswordLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('resetPasswordModal');
});
