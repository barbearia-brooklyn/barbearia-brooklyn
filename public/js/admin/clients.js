/**
 * Brooklyn Barbearia - Clients Manager (Clean Table Design)
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
            console.log('🔍 Carregando todos os clientes...');
            const clientesResponse = await window.adminAPI.getClientes();
            this.allClientes = clientesResponse.clientes || clientesResponse || [];
            console.log(`✅ ${this.allClientes.length} clientes carregados`);
            
            // ⚠️ IMPORTANTE: Usar campos da BD (next_appointment_date, last_appointment_date)
            // Não recalcular! Esses campos são atualizados automaticamente na BD
            this.allClientes = this.allClientes.map(cliente => {
                return {
                    ...cliente,
                    // Usar total_reservas que vem da API (COUNT das reservas)
                    reservas_total: cliente.total_reservas || 0
                };
            });
            
            this.clientes = [...this.allClientes];
            
            // Sort by creation date descending (newest first)
            this.clientes.sort((a, b) => {
                const dateA = new Date(a.criado_em || a.data_cadastro || 0);
                const dateB = new Date(b.criado_em || b.data_cadastro || 0);
                return dateB - dateA;
            });
            
            console.log(`✅ ${this.clientes.length} clientes processados`);
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
                    this.currentPage = 1;
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
            c.email?.toLowerCase().includes(normalizedQuery) ||
            c.nif?.toString().includes(query)
        );

        this.currentPage = 1;
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
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    }

    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '-';
        }
    }

    render() {
        const container = document.getElementById('clientsListContainer');
        if (!container) return;

        if (this.clientes.length === 0) {
            container.innerHTML = `
                <div class="empty-clients-state">
                    <i class="fas fa-user-slash"></i>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Tente ajustar os termos de pesquisa</p>
                </div>
            `;
            document.getElementById('paginationContainer').style.display = 'none';
            return;
        }

        const paginatedClientes = this.getPaginatedClientes();
        let html = '<div class="clients-table-wrapper"><table class="clients-table">';
        
        // Header
        html += `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Contacto</th>
                    <th class="text-center">NIF</th>
                    <th class="text-center">Cadastro</th>
                    <th class="text-center">Próxima Reserva</th>
                    <th class="text-center">Última Reserva</th>
                    <th class="text-center">Nº Reservas</th>
                    <th class="text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        paginatedClientes.forEach(cliente => {
            const dataCadastro = this.formatDate(cliente.criado_em || cliente.data_cadastro);
            
            // ✅ CORRETO: Usar campos da BD
            const proximaReserva = this.formatDateTime(cliente.next_appointment_date);
            const ultimaReserva = this.formatDateTime(cliente.last_appointment_date);
            
            const telefone = cliente.telefone || '-';
            const email = cliente.email || '-';
            const nif = cliente.nif || '-';

            html += `
                <tr onclick="window.clientsManager.viewClient(${cliente.id})">
                    <td>
                        <div class="client-name-cell">
                            <i class="fas fa-user-circle"></i>
                            <span>${this.escapeHtml(cliente.nome)}</span>
                        </div>
                    </td>
                    <td>
                        <div class="client-contact-cell">
                            <div><i class="fas fa-phone"></i> <a href="tel:${telefone}" onclick="event.stopPropagation()">${telefone}</a></div>
                            ${email !== '-' ? `<div><i class="fas fa-envelope"></i> <a href="mailto:${email}" onclick="event.stopPropagation()">${this.escapeHtml(email)}</a></div>` : ''}
                        </div>
                    </td>
                    <td class="text-center">${nif}</td>
                    <td class="text-center">${dataCadastro}</td>
                    <td class="text-center"><span class="date-highlight">${proximaReserva}</span></td>
                    <td class="text-center"><span class="date-muted">${ultimaReserva}</span></td>
                    <td class="text-center">
                        <span class="badge badge-info">${cliente.reservas_total || 0}</span>
                    </td>
                    <td class="text-center">
                        <button class="btn-icon" onclick="window.clientsManager.viewClient(${cliente.id}); event.stopPropagation();" title="Ver detalhes">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
        this.renderPagination();
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

        const start = (this.currentPage - 1) * this.perPage + 1;
        const end = Math.min(this.currentPage * this.perPage, this.clientes.length);
        infoContainer.textContent = `A mostrar ${start}-${end} de ${this.clientes.length} clientes`;

        let html = '';

        html += `
            <button class="pagination-btn" 
                    ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.clientsManager.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        const maxButtons = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="window.clientsManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="window.clientsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            html += `<button class="pagination-btn" onclick="window.clientsManager.goToPage(${totalPages})">${totalPages}</button>`;
        }

        html += `
            <button class="pagination-btn" 
                    ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.clientsManager.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        buttonsContainer.innerHTML = html;
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
        const container = document.getElementById('clientsListContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-clients-state">
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                    <h3 style="color: #e74c3c;">Erro ao carregar</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top: 20px;">
                        <i class="fas fa-redo"></i> Recarregar
                    </button>
                </div>
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

console.log('✅ Clients Manager loaded (Clean Table Design)');
