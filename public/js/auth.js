const API_BASE = '/api';

// Navegação entre tabs
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;

        // Atualizar tabs ativas
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Mostrar form correspondente
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        if (targetTab === 'login') {
            document.getElementById('loginForm').classList.add('active');
        } else if (targetTab === 'register') {
            document.getElementById('registerForm').classList.add('active');
        }
    });
});

// Login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.style.display = 'none';

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
            errorDiv.textContent = data.error || 'Erro ao fazer login';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao processar pedido';
        errorDiv.style.display = 'block';
    }
});

// Registo
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

    // Validações
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'As passwords não coincidem';
        errorDiv.style.display = 'block';
        return;
    }

    if (password.length < 8) {
        errorDiv.textContent = 'A password deve ter pelo menos 8 caracteres';
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
            successDiv.textContent = data.message || 'Conta criada! Verifique o seu email.';
            successDiv.style.display = 'block';

            // Limpar form
            document.getElementById('registerForm').reset();
        } else {
            if (data.isHtml) {
                errorDiv.innerHTML = data.error;
            } else {
                errorDiv.textContent = data.error || 'Erro ao criar conta';
            }
            errorDiv.style.display = 'block';

            const resetLink = document.getElementById('openResetModal');
            if (resetLink) {
                resetLink.addEventListener('click', function (e) {
                    e.preventDefault();

                    // Fechar mensagem de erro
                    errorDiv.style.display = 'none';

                    // Abrir modal de reset
                    const resetModal = document.getElementById('resetPasswordModal');
                    if (resetModal) {
                        resetModal.classList.add('active');

                        // Pré-preencher o email no modal
                        document.getElementById('reset-email').value = email;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao processar pedido';
        errorDiv.style.display = 'block';
    }
});

// Reset Password
document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('reset-email').value;
    const errorDiv = document.getElementById('reset-error');
    const successDiv = document.getElementById('reset-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/api_auth_reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            successDiv.textContent = 'Instruções enviadas para o seu email!';
            successDiv.style.display = 'block';
            document.getElementById('reset-email').value = '';
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

// ===== CONTROLO DE MODAIS =====

// Abrir modal de reset password
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        const modal = document.getElementById('resetPasswordModal');
        if (modal) {
            modal.classList.add('active');
        }
    });
}

// Fechar modais
document.addEventListener('click', function(e) {
    // Fechar ao clicar no botão close
    if (e.target.classList.contains('close') ||
        e.target.classList.contains('modal-close') ||
        e.target.classList.contains('close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Fechar ao clicar fora do modal (no backdrop)
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
