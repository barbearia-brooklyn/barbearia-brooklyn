const API_BASE = '/api';

// Alternar entre tabs
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;

        // Atualizar tabs
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Atualizar forms
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        if (targetTab === 'login') {
            document.getElementById('loginForm').classList.add('active');
        } else {
            document.getElementById('registerForm').classList.add('active');
        }
    });
});

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_BASE}/api_auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
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
            if (data.needsVerification) {
                errorDiv.textContent = 'Por favor, verifique o seu email antes de fazer login.';
            } else {
                errorDiv.textContent = data.error || 'Erro ao fazer login';
            }
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao processar login';
        errorDiv.style.display = 'block';
    }
});

// REGISTO
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nome = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const telefone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (password !== passwordConfirm) {
        errorDiv.textContent = 'As passwords não coincidem';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api_auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, telefone, password })
        });

        const data = await response.json();

        if (response.ok) {
            successDiv.textContent = data.message;
            successDiv.style.display = 'block';
            document.getElementById('registerForm').reset();

            // Alternar para tab de login após 3 segundos
            setTimeout(() => {
                document.querySelector('.auth-tab[data-tab="login"]').click();
            }, 3000);
        } else {
            errorDiv.textContent = data.error || 'Erro ao criar conta';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao processar registo';
        errorDiv.style.display = 'block';
    }
});

// MODAL DE RECUPERAÇÃO DE PASSWORD
const resetModal = document.getElementById('resetPasswordModal');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeModal = document.querySelector('.close');

forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    resetModal.style.display = 'block';
});

closeModal.addEventListener('click', function() {
    resetModal.style.display = 'none';
});

window.addEventListener('click', function(e) {
    if (e.target === resetModal) {
        resetModal.style.display = 'none';
    }
});

// RECUPERAR PASSWORD
document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('reset-email').value;
    const messageDiv = document.getElementById('reset-message');
    const errorDiv = document.getElementById('reset-error');

    messageDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/api_auth_reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.style.display = 'block';
            document.getElementById('resetPasswordForm').reset();
        } else {
            errorDiv.textContent = data.error || 'Erro ao processar pedido';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao processar pedido';
        errorDiv.style.display = 'block';
    }
});

// Abrir modal de reset password
document.getElementById('forgotPasswordLink').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('resetPasswordModal').style.display = 'block';
});

// Fechar modais
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
