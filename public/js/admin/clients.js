/**
 * Brooklyn Barbearia - Clients Manager (Modern List Design)
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
            console.log('🔍 Carregando todas as reservas...');
            const response = await window.adminAPI.getReservas({});
            const reservas = response.reservas || response.data || response || [];
            console.log(`✅ ${reservas.length} reservas carregadas`);
            
            console.log('🔍 Carregando todos os clientes...');
            const clientesResponse = await window.adminAPI.getClientes();
            this.allClientes = clientesResponse.clientes || clientesResponse || [];
            console.log(`✅ ${this.allClientes.length} clientes carregados`);
            
            // Calculate statistics for each client
            this.allClientes = this.allClientes.map(cliente => {
                const clienteReservas = reservas.filter(r => r.cliente_id === cliente.id);
                const now = new Date();
                
                // Filtrar apenas reservas concluídas (excluir faltas e canceladas)
                const reservasConcluidas = clienteReservas.filter(r => r.status === 'concluida');
                
                // Reservas futuras (confirmadas ou pendentes, excluir canceladas)
                const reservasFuturas = clienteReservas.filter(r => 
                    new Date(r.data_hora) >= now && 
                    r.status !== 'cancelada' && 
                    r.status !== 'faltou'
                );
                
                // Encontrar última e próxima reserva
                const ultimaReserva = reservasConcluidas
                    .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0];
                
                const proximaReserva = reservasFuturas
                    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))[0];
                
                return {
                    ...cliente,
                    reservas_concluidas: reservasConcluidas.length,
                    reservas_futuras: reservasFuturas.length,
                    ultima_reserva_data: ultimaReserva ? ultimaReserva.data_hora : null,
                    proxima_reserva_data: proximaReserva ? proximaReserva.data_hora : null
                };
            });
            
            this.clientes = [...this.allClientes];
            
            // Sort by creation date descending (newest first)
            this.clientes.sort((a, b) => {
                const dateA = new Date(a.criado_em || 0);
                const dateB = new Date(b.criado_em || 0);
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

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        let html = '';
        
        paginatedClientes.forEach(cliente => {
            const dataCadastro = this.formatDate(cliente.criado_em);
            const proximaReserva = this.formatDateTime(cliente.proxima_reserva_data);
            const ultimaReserva = this.formatDateTime(cliente.ultima_reserva_data);
            const telefone = cliente.telefone || '-';
            const email = cliente.email || '-';

            html += `
                <div class="client-list-item" onclick="window.clientsManager.viewClient(${cliente.id})">
                    <div class="client-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    
                    <div class="client-main-info">
                        <div class="client-name">${this.escapeHtml(cliente.nome)}</div>
                        <div class="client-contact">
                            <span><i class="fas fa-phone"></i> <a href="tel:${telefone}" onclick="event.stopPropagation()">${telefone}</a></span>
                            ${email !== '-' ? `<span style="margin-left: 8px;"><i class="fas fa-envelope"></i> <a href="mailto:${email}" onclick="event.stopPropagation()">${email}</a></span>` : ''}
                        </div>
                    </div>
                    
                    <div class="client-info-col">
                        <span class="client-info-label">Cadastro</span>
                        <span class="client-info-value">${dataCadastro}</span>
                    </div>
                    
                    <div class="client-info-col">
                        <span class="client-info-label">Próxima</span>
                        <span class="client-info-value">${proximaReserva}</span>
                    </div>
                    
                    <div class="client-info-col">
                        <span class="client-info-label">Última</span>
                        <span class="client-info-value">${ultimaReserva}</span>
                    </div>
                    
                    <div class="client-stats">
                        <div class="client-stat-badge stat-future" title="Reservas futuras">
                            ${cliente.reservas_futuras || 0}
                        </div>
                        <div class="client-stat-badge stat-completed" title="Reservas concluídas">
                            ${cliente.reservas_concluidas || 0}
                        </div>
                    </div>
                    
                    <div class="client-action">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        });

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

console.log('✅ Clients Manager loaded (Modern List Design)');
