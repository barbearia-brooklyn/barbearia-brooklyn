/**
 * Header Loader com suporte a Notificações
 * Carrega o header e inicializa o sistema de notificações
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Carregar header
        const headerContainer = document.getElementById('headerContainer');
        if (headerContainer) {
            const response = await fetch('/admin/header.html');
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;
            
            // Aguardar um pouco para o header ser renderizado
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Inicializar header scripts
            if (typeof initializeHeader === 'function') {
                initializeHeader();
            }
            
            // Inicializar notificações após o header estar carregado
            // O script notifications.js já foi carregado pelo header.html
            console.log('Header and notifications loaded');
        }
    } catch (error) {
        console.error('Error loading header:', error);
    }
});