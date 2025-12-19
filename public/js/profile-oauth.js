// profile-oauth.js - Gestão de contas vinculadas OAuth

// ===== GESTÃO DE CONTAS VINCULADAS =====
async function loadLinkedAccounts() {
    const container = document.getElementById('linkedAccounts');
    if (!container) return;

    const result = await utils.apiRequest('/api_auth/linked-accounts', {
        method: 'GET'
    });

    if (result.ok) {
        const accounts = result.data.authMethods || [];
        const hasPassword = result.data.hasPassword;

        container.innerHTML = `
            <div class="account-item btn-google">
                <span><i class="fab fa-google"></i> Google</span>
                ${accounts.includes('google')
            ? `<button class="btn-small btn-unlink" data-provider="google" data-has-password="${hasPassword}">Desassociar</button>`
            : `<button class="btn-small btn-link btn-google" data-provider="google">Associar</button>`
        }
            </div>
            <div class="account-item btn-facebook">
                <span><i class="fab fa-facebook-f"></i> Facebook</span>
                ${accounts.includes('facebook')
            ? `<button class="btn-small btn-unlink" data-provider="facebook" data-has-password="${hasPassword}">Desassociar</button>`
            : `<button class="btn-small btn-link btn-facebook" data-provider="facebook">Associar</button>`
        }
            </div>
            <div class="account-item btn-instagram">
                <span><i class="fab fa-instagram"></i> Instagram</span>
                ${accounts.includes('instagram')
            ? `<button class="btn-small btn-unlink" data-provider="instagram" data-has-password="${hasPassword}">Desassociar</button>`
            : `<div class="oauth-button-wrapper"><button class="btn-small btn-link btn-instagram" data-provider="instagram">Associar</button><div class="oauth-single-overlay"><span>Em breve</span></div></div>`
        }
            </div>
        `;

        // Adicionar event listeners
        container.querySelectorAll('.btn-link').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const provider = this.dataset.provider;
                await linkAccount(provider);
            });
        });

        container.querySelectorAll('.btn-unlink').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const provider = this.dataset.provider;
                const hasPassword = this.dataset.hasPassword === 'true';
                await unlinkAccount(provider, hasPassword);
            });
        });
    }
}

async function linkAccount(provider) {
    try {
        const result = await utils.apiRequest(`/api_auth/oauth/${provider}/link`, {
            method: 'GET'
        });

        if (result.ok && result.data.authUrl) {
            window.location.href = result.data.authUrl;
        } else {
            alert('Erro ao iniciar associação');
        }
    } catch (error) {
        console.error('Erro no linkAccount:', error);
        alert('Erro ao iniciar associação');
    }
}

async function unlinkAccount(provider, hasPassword) {
    const accountsLinked = document.querySelectorAll('.btn-unlink').length;

    // Se é a última conta e não tem password
    if (accountsLinked === 1 && !hasPassword) {
        utils.openModal('passwordRequiredModal');
        return;
    }

    if (!confirm(`Tem a certeza que deseja desassociar a sua conta ${provider}?`)) {
        return;
    }

    const result = await utils.apiRequest(`/api_auth/oauth/${provider}/unlink`, {
        method: 'DELETE'
    });

    if (result.ok) {
        utils.showSuccess('profile-success', 'Conta desassociada com sucesso');
        loadLinkedAccounts();
    } else {
        utils.showError('profile-error', result.data?.error || 'Erro ao desassociar conta');
    }
}


// ===== DEFINIR PASSWORD (para desassociar) =====
function initializeSetPasswordForm(pendingUnlinkProvider) {
    const form = document.getElementById('setPasswordForm');
    if (!form) return;
    
    // Remover listeners anteriores
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('new-password').value;
        const passwordConfirm = document.getElementById('confirm-new-password').value;
        
        utils.hideMessages('set-password-error', 'set-password-success');
        
        if (password !== passwordConfirm) {
            utils.showError('set-password-error', 'As passwords não coincidem');
            return;
        }
        
        if (password.length < 8) {
            utils.showError('set-password-error', 'A password deve ter pelo menos 8 caracteres');
            return;
        }
        
        // Atualizar perfil com nova password
        const result = await utils.apiRequest('/api_auth/update', {
            method: 'PUT',
            body: JSON.stringify({ password })
        });
        
        if (result.ok) {
            utils.showSuccess('set-password-success', 'Password definida! A desassociar conta...');
            
            // Aguardar e desassociar
            setTimeout(async () => {
                utils.closeModal('passwordRequiredModal');
                
                // Tentar desassociar novamente
                if (pendingUnlinkProvider) {
                    const unlinkResult = await utils.apiRequest(`/api_auth/oauth/${pendingUnlinkProvider}/unlink`, {
                        method: 'DELETE'
                    });
                    
                    if (unlinkResult.ok) {
                        utils.showSuccess('profile-success', 'Conta desassociada com sucesso');
                        loadLinkedAccounts();
                    }
                }
            }, 1500);
        } else {
            utils.showError('set-password-error', result.data?.error || 'Erro ao definir password');
        }
    });
}

// ===== VERIFICAR MENSAGENS DE SUCESSO/ERRO NA URL =====
function checkURLMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'account_linked') {
        utils.showSuccess('profile-success', 'Conta associada com sucesso!');
        // Recarregar contas vinculadas
        setTimeout(() => loadLinkedAccounts(), 500);
    }
    
    if (error) {
        alert('Erro: ' + decodeURIComponent(error));
    }
    
    // Limpar URL
    if (success || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', function() {
    loadLinkedAccounts();
    checkURLMessages();
});

// Tornar funções globais para uso inline
window.linkAccount = linkAccount;
window.unlinkAccount = unlinkAccount;