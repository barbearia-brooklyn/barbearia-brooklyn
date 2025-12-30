/**
 * Brooklyn Barbearia - Clients Manager
 * Manages clients list and search with pagination
 */

class ClientsManager {
    constructor() {
        this.clientes = [];
        this.allClientes = [];
        this.searchTimeout = null;
        this.currentPage = 1;
        this.perPage = 20;
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
            // Buscar TODAS as reservas (sem limite)
            console.log('🔍 Carregando todas as reservas...');
            const response = await window.adminAPI.getReservas({});
            const reservas = response.reservas || response.data || response || [];
            console.log(`✅ ${reservas.length} reservas carregadas`);
            
            // Buscar TODOS os clientes (sem limite)
            console.log('🔍 Carregando todos os clientes...');
            const clientesResponse = await window.adminAPI.getClientes();
            this.allClientes = clientesResponse.clientes || clientesResponse || [];
            console.log(`✅ ${this.allClientes.length} clientes carregados`);
            
            // Calculate statistics for each client
            this.allClientes = this.allClientes.map(cliente => {
                const clienteReservas = reservas.filter(r => r.cliente_id === cliente.id);
                const now = new Date();
                
                return {
                    ...cliente,
                    reservas_futuras: clienteReservas.filter(r => new Date(r.data_hora) >= now && r.status !== 'cancelada').length,
                    reservas_passadas: clienteReservas.filter(r => new Date(r.data_hora) < now && r.status === 'concluida').length,
                    reservas_faltou: clienteReservas.filter(r => r.status === 'faltou').length,
                    reservas_canceladas: clienteReservas.filter(r => r.status === 'cancelada').length
                };
            });
            
            this.clientes = [...this.allClientes];
            
            // Sort by most recent first
            this.clientes.sort((a, b) => {
                return new Date(b.data_cadastro) - new Date(a.data_cadastro);
            });
            
            console.log(`✅ ${this.clientes.length} clientes processados com estatísticas`);
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
                this.searchTimeout = setTimeout(() => {
                    this.currentPage = 1; // Reset to first page on search
                    this.searchClientes(e.target.value);
                }, 300);
            });
        }
    }

    searchClientes(query) {
        if (!query || query.trim().length === 0) {
            this.clientes = [...this.allClientes];
            this.currentPage = 1;
            this.render();
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        this.clientes = this.allClientes.filter(c => 
            c.nome?.toLowerCase().includes(normalizedQuery) ||
            c.telefone?.includes(query) ||
            c.email?.toLowerCase().includes(normalizedQuery)
        );

        this.currentPage = 1; // Reset to first page
        this.render();
    }

    getTotalPages() {
        return Math.ceil(this.clientes.length / this.perPage);
    }

    getPaginatedClientes() {
        const start = (this.currentPage - 1) * this.perPage;
        const end = start + this.perPage;
        return this.clientes.slice(start, end);
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.render();
        
        // Scroll to top of table
        document.getElementById('clientsTable')?.scrollIntoView({ behavior: 'smooth' });
    }

    renderPagination() {
        const container = document.getElementById('paginationContainer');
        const infoContainer = document.getElementById('paginationInfo');
        const buttonsContainer = document.getElementById('paginationButtons');
        
        if (!container || !infoContainer || !buttonsContainer) return;

        const totalPages = this.getTotalPages();
        
        if (totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        // Info text
        const start = (this.currentPage - 1) * this.perPage + 1;
        const end = Math.min(this.currentPage * this.perPage, this.clientes.length);
        infoContainer.textContent = `A mostrar ${start}-${end} de ${this.clientes.length} clientes`;

        // Pagination buttons
        let html = '';

        // Previous button
        html += `
            <button class="pagination-btn" 
                    ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.clientsManager.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const maxButtons = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        // First page
        if (startPage > 1) {
            html += `
                <button class="pagination-btn" onclick="window.clientsManager.goToPage(1)">1</button>
            `;
            if (startPage > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="window.clientsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            html += `
                <button class="pagination-btn" onclick="window.clientsManager.goToPage(${totalPages})">${totalPages}</button>
            `;
        }

        // Next button
        html += `
            <button class="pagination-btn" 
                    ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.clientsManager.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        buttonsContainer.innerHTML = html;
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
            document.getElementById('paginationContainer').style.display = 'none';
            return;
        }

        const paginatedClientes = this.getPaginatedClientes();
        let html = '';
        
        paginatedClientes.forEach(cliente => {
            const dataCadastro = cliente.data_cadastro ? 
                new Date(cliente.data_cadastro).toLocaleDateString('pt-PT', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                }) : 'N/A';

            html += `
                <tr class="client-row" onclick="window.clientsManager.viewClient(${cliente.id})">
                    <td>
                        <div class="client-name-cell">
                            <i class="fas fa-user-circle" style="color: #0f7e44; margin-right: 8px;"></i>
                            <strong>${this.escapeHtml(cliente.nome)}</strong>
                        </div>
                    </td>
                    <td style="text-align: center;">
                        ${this.renderStatusBadge(cliente.reservas_futuras, 'future')}
                    </td>
                    <td style="text-align: center;">
                        ${this.renderStatusBadge(cliente.reservas_passadas, 'completed')}
                    </td>
                    <td style="text-align: center;">
                        ${this.renderStatusBadge(cliente.reservas_faltou, 'missed')}
                    </td>
                    <td style="text-align: center;">
                        ${this.renderStatusBadge(cliente.reservas_canceladas, 'cancelled')}
                    </td>
                    <td style="text-align: center;">${dataCadastro}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.clientsManager.viewClient(${cliente.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        this.renderPagination();
    }

    renderStatusBadge(count, type) {
        if (count === 0) {
            return '<span style="color: #999;">-</span>';
        }

        const colors = {
            'future': { bg: '#d1ecf1', color: '#0c5460' },      // Azul claro
            'completed': { bg: '#d4edda', color: '#155724' },   // Verde
            'missed': { bg: '#fff3cd', color: '#856404' },      // Amarelo
            'cancelled': { bg: '#f8d7da', color: '#721c24' }    // Vermelho
        };

        const { bg, color } = colors[type] || colors.future;

        return `<span class="status-count-badge" style="background: ${bg}; color: ${color};">${count}</span>`;
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