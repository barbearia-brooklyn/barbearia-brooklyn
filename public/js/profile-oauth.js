// profile-oauth.js - Gestão de contas vinculadas OAuth

// ===== CARREGAR CONTAS VINCULADAS =====
async function loadLinkedAccounts() {
    const container = document.getElementById('linkedAccounts');
    if (!container) return;
    
    try {
        const result = await utils.apiRequest('/api_auth/linked-accounts', {
            method: 'GET'
        });
        
        if (result.ok) {
            const { authMethods, hasPassword, linkedAccounts } = result.data;
            
            container.innerHTML = `
                <div class="account-item">
                    <span class="account-provider">
                        <i class="fab fa-google"></i> Google
                    </span>
                    ${linkedAccounts.google 
                        ? `<button class="btn-small btn-unlink" onclick="unlinkAccount('google', ${hasPassword})">Desassociar</button>`
                        : `<button class="btn-small btn-link" onclick="linkAccount('google')">Associar</button>`
                    }
                </div>
                <div class="account-item">
                    <span class="account-provider">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </span>
                    ${linkedAccounts.facebook
                        ? `<button class="btn-small btn-unlink" onclick="unlinkAccount('facebook', ${hasPassword})">Desassociar</button>`
                        : `<button class="btn-small btn-link" onclick="linkAccount('facebook')">Associar</button>`
                    }
                </div>
                <div class="account-item">
                    <span class="account-provider">
                        <i class="fab fa-instagram"></i> Instagram
                    </span>
                    ${linkedAccounts.instagram
                        ? `<button class="btn-small btn-unlink" onclick="unlinkAccount('instagram', ${hasPassword})">Desassociar</button>`
                        : `<button class="btn-small btn-link" onclick="linkAccount('instagram')">Associar</button>`
                    }
                </div>
            `;
        } else {
            container.innerHTML = '<p class="error">Erro ao carregar contas vinculadas</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar contas vinculadas:', error);
        container.innerHTML = '<p class="error">Erro ao carregar contas vinculadas</p>';
    }
}

// ===== ASSOCIAR CONTA =====
async function linkAccount(provider) {
    try {
        const result = await utils.apiRequest(`/api_auth/oauth/${provider}/authorize`, {
            method: 'GET'
        });
        
        if (result.ok) {
            // Redirecionar para autorização OAuth
            window.location.href = result.data.authUrl;
        } else {
            alert('Erro ao iniciar associação: ' + (result.data?.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao associar conta:', error);
        alert('Erro ao iniciar associação');
    }
}

// ===== DESASSOCIAR CONTA =====
async function unlinkAccount(provider, hasPassword) {
    const accountsLinked = document.querySelectorAll('.btn-unlink').length;
    
    // Se é a última conta e não tem password
    if (accountsLinked === 1 && !hasPassword) {
        utils.openModal('passwordRequiredModal');
        initializeSetPasswordForm(provider);
        return;
    }
    
    if (!confirm(`Tem a certeza que deseja desassociar a sua conta ${provider}?`)) {
        return;
    }
    
    try {
        const result = await utils.apiRequest(`/api_auth/oauth/${provider}/unlink`, {
            method: 'DELETE'
        });
        
        if (result.ok) {
            utils.showSuccess('profile-success', 'Conta desassociada com sucesso');
            // Recarregar contas vinculadas
            setTimeout(() => loadLinkedAccounts(), 1000);
        } else {
            if (result.data?.needsPassword) {
                utils.openModal('passwordRequiredModal');
                initializeSetPasswordForm(provider);
            } else {
                alert('Erro: ' + (result.data?.error || 'Erro ao desassociar conta'));
            }
        }
    } catch (error) {
        console.error('Erro ao desassociar conta:', error);
        alert('Erro ao desassociar conta');
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