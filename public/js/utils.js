// ===========================
// utils.js - Utilitários Globais
// ===========================

const API_BASE = '/api';

// ===== UTILITÁRIOS DE API =====

/**
 * Faz uma requisição à API com configuração padrão
 * @param {string} endpoint - Endpoint da API (sem o prefixo /api)
 * @param {object} options - Opções do fetch
 * @returns {Promise<{ok: boolean, data: any, status: number, error?: string}>}
 */
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, defaultOptions);
        const data = await response.json();
        return {
            ok: response.ok,
            data,
            status: response.status
        };
    } catch (error) {
        console.error('Erro na requisição:', error);
        return {
            ok: false,
            error: 'Erro ao processar pedido',
            status: 0
        };
    }
}

// ===== UTILITÁRIOS DE UI =====

/**
 * Mostra uma mensagem num elemento
 * @param {string} elementId - ID do elemento
 * @param {string} message - Mensagem a exibir
 * @param {boolean} isHtml - Se true, usa innerHTML em vez de textContent
 */
function showMessage(elementId, message, isHtml = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isHtml) {
        element.innerHTML = message;
    } else {
        element.textContent = message;
    }
    element.style.display = 'block';
}

/**
 * Esconde múltiplos elementos
 * @param {...string} elementIds - IDs dos elementos a esconder
 */
function hideMessages(...elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

/**
 * Mostra mensagem de erro
 */
function showError(elementId, message, isHtml = false) {
    showMessage(elementId, message, isHtml);
}

/**
 * Mostra mensagem de sucesso
 */
function showSuccess(elementId, message) {
    showMessage(elementId, message, false);
}

// ===== UTILITÁRIOS DE MODAIS =====

/**
 * Abre um modal
 * @param {string} modalId - ID do modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
}

/**
 * Fecha um modal
 * @param {string} modalId - ID do modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

/**
 * Fecha todos os modais abertos
 */
function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/**
 * Inicializa listeners globais para modais
 * Deve ser chamado uma vez quando o DOM carregar
 */
function initializeModalListeners() {
    // Fechar ao clicar nos botões de fechar
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close') ||
            e.target.classList.contains('modal-close') ||
            e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        // Fechar ao clicar no backdrop
        if (e.target.classList.contains('modal') &&
            e.target.classList.contains('active')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Fechar com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ===== UTILITÁRIOS DE VALIDAÇÃO =====

/**
 * Valida se duas passwords coincidem e têm tamanho mínimo
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirmação da password
 * @param {string} errorElementId - ID do elemento para mostrar erro
 * @param {number} minLength - Tamanho mínimo (padrão: 8)
 * @returns {boolean} - true se válido
 */
function validatePasswords(password, confirmPassword, errorElementId, minLength = 8) {
    if (password !== confirmPassword) {
        showError(errorElementId, 'As passwords não coincidem');
        return false;
    }
    if (password.length < minLength) {
        showError(errorElementId, `A password deve ter pelo menos ${minLength} caracteres`);
        return false;
    }
    return true;
}

/**
 * Valida se um email tem formato válido
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== UTILITÁRIOS DE FORMATAÇÃO =====

/**
 * Formata uma data no formato PT
 * @param {Date|string} date - Data a formatar
 * @returns {string}
 */
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Formata uma hora no formato PT
 * @param {Date|string} date - Data/hora a formatar
 * @returns {string}
 */
function formatTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formata data e hora juntos
 * @param {Date|string} date - Data/hora a formatar
 * @returns {string}
 */
function formatDateTime(date) {
    return `${formatDate(date)} às ${formatTime(date)}`;
}

// ===== UTILITÁRIOS DE AUTENTICAÇÃO =====

/**
 * Verifica se o utilizador está autenticado
 * @returns {Promise<{ok: boolean, user?: object}>}
 */
async function checkAuth() {
    const result = await apiRequest('/api_auth/me');
    return result;
}

/**
 * Redireciona para login se não estiver autenticado
 * @param {string} redirectAfterLogin - Página para onde redirecionar após login
 */
async function requireAuth(redirectAfterLogin = null) {
    const result = await checkAuth();
    if (!result.ok) {
        const redirectParam = redirectAfterLogin ? `?redirect=${redirectAfterLogin}` : '';
        window.location.href = `login.html${redirectParam}`;
        return null;
    }
    return result.data.user;
}

/**
 * Atualiza a interface do header baseado no estado de autenticação
 */
async function updateAuthUI() {
    const result = await checkAuth();
    const loggedOutBtns = document.getElementById('logged-out-buttons');
    const loggedInBtns = document.getElementById('logged-in-buttons');

    if (result.ok) {
        // User autenticado
        if (loggedOutBtns) loggedOutBtns.style.display = 'none';
        if (loggedInBtns) loggedInBtns.style.display = 'flex';
        window.currentUser = result.data.user;
    } else {
        // User NÃO autenticado
        if (loggedOutBtns) loggedOutBtns.style.display = 'flex';
        if (loggedInBtns) loggedInBtns.style.display = 'none';
        window.currentUser = null;
    }
}

/**
 * Faz logout do utilizador
 */
async function logout() {
    await apiRequest('/api_auth/me/logout', { method: 'POST' });
    window.currentUser = null;
    window.location.href = 'index.html';
}

// ===== UTILITÁRIOS DE CARREGAMENTO =====

/**
 * Carrega HTML de um ficheiro externo
 * @param {string} url - URL do ficheiro
 * @returns {Promise<string>}
 */
async function loadHTML(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar ${url}: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(error);
        return '';
    }
}

// ===== UTILITÁRIOS DE SCROLL =====

/**
 * Faz scroll suave para o topo
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

/**
 * Faz scroll suave para um elemento
 * @param {string} selector - Seletor CSS do elemento
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ===== EXPORTAR PARA WINDOW (uso global) =====
window.utils = {
    // API
    apiRequest,
    API_BASE,

    // UI
    showMessage,
    hideMessages,
    showError,
    showSuccess,

    // Modais
    openModal,
    closeModal,
    closeAllModals,
    initializeModalListeners,

    // Validação
    validatePasswords,
    validateEmail,

    // Formatação
    formatDate,
    formatTime,
    formatDateTime,

    // Auth
    checkAuth,
    requireAuth,
    updateAuthUI,
    logout,

    // Carregamento
    loadHTML,

    // Scroll
    scrollToTop,
    scrollToElement
};

// Auto-inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeModalListeners();
});