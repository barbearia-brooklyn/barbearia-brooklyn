/**
 * Brooklyn Barbearia - Clients Manager
 * Manages clients list and search
 */

class ClientsManager {
    constructor() {
        this.clientes = [];
        this.allClientes = [];
        this.searchTimeout = null;
        this.init();
    }

    async init() {
        console.log('👥 Initializing Clients Manager...');
        
        try {
            await this.loadClientes();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('Clients initialization error:', error);
            this.showError('Erro ao carregar clientes: ' + error.message);
        }
    }

    async loadClientes() {
        try {
            const response = await window.adminAPI.getClientes();
            this.allClientes = response.clientes || response || [];
            this.clientes = [...this.allClientes];
            
            // Sort by most recent first
            this.clientes.sort((a, b) => {
                return new Date(b.data_cadastro) - new Date(a.data_cadastro);
            });
            
            console.log(`✅ ${this.clientes.length} clientes carregados`);
        } catch (error) {
            console.error('Error loading clientes:', error);
            this.clientes = [];
            throw error;
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => this.searchClientes(e.target.value), 300);
            });
        }
    }

    searchClientes(query) {
        if (!query || query.trim().length === 0) {
            this.clientes = [...this.allClientes];
            this.render();
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        this.clientes = this.allClientes.filter(c => 
            c.nome?.toLowerCase().includes(normalizedQuery) ||
            c.telefone?.includes(query) ||
            c.email?.toLowerCase().includes(normalizedQuery)
        );

        this.render();
    }

    render() {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        if (this.clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Nenhum cliente encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        
        this.clientes.forEach(cliente => {
            const dataCadastro = cliente.data_cadastro ? 
                new Date(cliente.data_cadastro).toLocaleDateString('pt-PT', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                }) : 'N/A';

            const reservasCount = cliente.total_reservas || 0;

            html += `
                <tr class="client-row" onclick="window.clientsManager.viewClient(${cliente.id})">
                    <td>${cliente.id}</td>
                    <td>
                        <div class="client-name-cell">
                            <i class="fas fa-user-circle" style="color: #0f7e44; margin-right: 8px;"></i>
                            <strong>${this.escapeHtml(cliente.nome)}</strong>
                        </div>
                    </td>
                    <td>
                        <a href="tel:${cliente.telefone}" onclick="event.stopPropagation()" style="color: inherit; text-decoration: none;">
                            <i class="fas fa-phone" style="color: #666; margin-right: 5px;"></i>
                            ${cliente.telefone}
                        </a>
                    </td>
                    <td>
                        ${cliente.email ? `
                            <a href="mailto:${cliente.email}" onclick="event.stopPropagation()" style="color: inherit; text-decoration: none;">
                                <i class="fas fa-envelope" style="color: #666; margin-right: 5px;"></i>
                                ${this.escapeHtml(cliente.email)}
                            </a>
                        ` : '<span style="color: #999;">-</span>'}
                    </td>
                    <td>
                        <span class="badge ${reservasCount > 0 ? 'badge-success' : 'badge-secondary'}">
                            ${reservasCount} reserva${reservasCount !== 1 ? 's' : ''}
                        </span>
                    </td>
                    <td>${dataCadastro}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.clientsManager.viewClient(${cliente.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    viewClient(clientId) {
        window.location.href = `/admin/client-detail.html?id=${clientId}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const tbody = document.getElementById('clientsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-redo"></i> Recarregar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.clientsManager = new ClientsManager();
    });
} else {
    window.clientsManager = new ClientsManager();
}

console.log('✅ Clients Manager loaded');