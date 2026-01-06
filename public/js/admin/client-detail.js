/**
 * Brooklyn Barbearia - Client Detail Manager
 * Manages individual client details and reservations
 */

class ClientDetailManager {
    constructor() {
        this.clientId = null;
        this.cliente = null;
        this.barbeiros = [];
        this.servicos = [];
        this.futureReservations = [];
        this.pastReservations = [];
        this.activeTab = 'future';
        this.init();
    }

    async init() {
        console.log('👤 Initializing Client Detail Manager...');
        
        // Get client ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.clientId = urlParams.get('id');

        if (!this.clientId) {
            alert('❌ ID do cliente não encontrado');
            window.location.href = '/admin/clients.html';
            return;
        }

        try {
            await Promise.all([
                this.loadBarbeiros(),
                this.loadServicos(),
                this.loadClient(),
                this.loadFutureReservations()
            ]);

            this.renderClientInfo();
            this.renderReservations('future');
            this.setupEventListeners();
            this.setupModalCloseHandlers();
        } catch (error) {
            console.error('Client detail initialization error:', error);
            this.showError('Erro ao carregar dados do cliente: ' + error.message);
        }
    }

    async loadClient() {
        try {
            const response = await window.adminAPI.getClienteById(this.clientId);
            this.cliente = response.cliente || response;
            console.log('✅ Cliente carregado:', this.cliente);
        } catch (error) {
            console.error('Error loading client:', error);
            throw error;
        }
    }

    async loadBarbeiros() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbeiros = response.barbeiros || response || [];
        } catch (error) {
            console.error('Error loading barbeiros:', error);
            this.barbeiros = [];
        }
    }

    async loadServicos() {
        try {
            const response = await window.adminAPI.getServicos();
            this.servicos = response.servicos || response || [];
        } catch (error) {
            console.error('Error loading servicos:', error);
            this.servicos = [];
        }
    }

    async loadFutureReservations() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await window.adminAPI.getReservas({
                cliente_id: this.clientId,
                data_inicio: today
            });
            
            this.futureReservations = (response.reservas || response.data || response || [])
                .filter(r => new Date(r.data_hora) >= new Date())
                .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
            
            document.getElementById('futureCount').textContent = this.futureReservations.length;
            console.log(`✅ ${this.futureReservations.length} reservas futuras carregadas`);
        } catch (error) {
            console.error('Error loading future reservations:', error);
            this.futureReservations = [];
        }
    }

    async loadPastReservations() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await window.adminAPI.getReservas({
                cliente_id: this.clientId,
                data_fim: today
            });
            
            this.pastReservations = (response.reservas || response.data || response || [])
                .filter(r => new Date(r.data_hora) < new Date())
                .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
            
            document.getElementById('pastCount').textContent = this.pastReservations.length;
            console.log(`✅ ${this.pastReservations.length} reservas passadas carregadas`);
        } catch (error) {
            console.error('Error loading past reservations:', error);
            this.pastReservations = [];
        }
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('futureTab')?.addEventListener('click', () => {
            this.switchTab('future');
        });

        document.getElementById('pastTab')?.addEventListener('click', async () => {
            if (this.pastReservations.length === 0) {
                await this.loadPastReservations();
            }
            this.switchTab('past');
        });
    }

    switchTab(tab) {
        this.activeTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tab === 'future') {
            document.getElementById('futureReservations').classList.add('active');
            this.renderReservations('future');
        } else {
            document.getElementById('pastReservations').classList.add('active');
            this.renderReservations('past');
        }
    }

    renderClientInfo() {
        const container = document.getElementById('clientInfoCard');
        if (!container || !this.cliente) return;

        const dataCadastro = this.cliente.data_cadastro ? 
            new Date(this.cliente.data_cadastro).toLocaleDateString('pt-PT', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }) : 'N/A';

        const totalReservas = this.cliente.total_reservas || 0;

        container.innerHTML = `
            <div class="client-header">
                <div class="client-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="client-main-info">
                    <h2>
                        ${this.escapeHtml(this.cliente.nome)}
                        <button class="btn btn-sm btn-secondary" 
                                onclick="window.clientDetailManager.openEditClientModal()" 
                                style="margin-left: 15px; font-size: 0.9rem;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </h2>
                    <p class="client-id">ID: ${this.cliente.id}</p>
                </div>
            </div>
            
            <div class="client-details-grid">
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <span class="detail-label">Telefone</span>
                        <a href="tel:${this.cliente.telefone}" class="detail-value">${this.cliente.telefone}</a>
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-envelope"></i>
                    <div>
                        <span class="detail-label">Email</span>
                        ${this.cliente.email ? 
                            `<a href="mailto:${this.cliente.email}" class="detail-value">${this.escapeHtml(this.cliente.email)}</a>` :
                            '<span class="detail-value" style="color: #999;">Não fornecido</span>'
                        }
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <span class="detail-label">Data de Cadastro</span>
                        <span class="detail-value">${dataCadastro}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-clipboard-list"></i>
                    <div>
                        <span class="detail-label">Total de Reservas</span>
                        <span class="detail-value">${totalReservas} reserva${totalReservas !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderReservations(type) {
        const containerId = type === 'future' ? 'futureReservations' : 'pastReservations';
        const container = document.getElementById(containerId);
        if (!container) return;

        const reservations = type === 'future' ? this.futureReservations : this.pastReservations;

        if (reservations.length === 0) {
            container.innerHTML = `
                <div class="empty-reservations">
                    <i class="fas fa-calendar-times"></i>
                    <p>Nenhuma reserva ${type === 'future' ? 'futura' : 'passada'}</p>
                </div>
            `;
            return;
        }

        let html = '<div class="reservations-list">';

        reservations.forEach(reserva => {
            const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
            const servico = this.servicos.find(s => s.id == reserva.servico_id);

            const dataHora = new Date(reserva.data_hora);
            const dataFormatada = dataHora.toLocaleDateString('pt-PT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const horaFormatada = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            const statusClass = this.getStatusClass(reserva.status);
            const statusLabel = this.getStatusLabel(reserva.status);

            const barbeiroFoto = barbeiro?.foto ?
                `/images/barbers/${barbeiro.foto}` :
                '/images/default-barber.png';

            html += `
                <div class="reservation-item" data-reserva-id="${reserva.id}" style="cursor: pointer;">
                    <div class="reservation-date-time">
                        <div class="reservation-date">${dataFormatada}</div>
                        <div class="reservation-time">🕒 ${horaFormatada}</div>
                    </div>
                    
                    <div class="reservation-details">
                        <div class="reservation-barber">
                            <img src="${barbeiroFoto}" alt="${barbeiro?.nome || 'Barbeiro'}" onerror="this.src='/images/default-barber.png'">
                            <span>${barbeiro?.nome || 'N/A'}</span>
                        </div>
                        
                        <div class="reservation-service">
                            <i class="fas fa-scissors"></i>
                            <span>${servico?.nome || 'N/A'}</span>
                            ${servico?.preco ? `<span class="price">€${servico.preco}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="reservation-status">
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        this.attachReservationClickHandlers(type);
    }

    attachReservationClickHandlers(type) {
        const containerId = type === 'future' ? 'futureReservations' : 'pastReservations';
        const container = document.getElementById(containerId);
        if (!container) return;

        const reservationCards = container.querySelectorAll('.reservation-item');
        reservationCards.forEach(card => {
            card.addEventListener('click', () => {
                const reservaId = parseInt(card.dataset.reservaId);
                this.showReservationModal(reservaId);
            });
        });
    }

    showReservationModal(reservaId) {
        let reserva = this.futureReservations.find(r => r.id === reservaId);
        if (!reserva) {
            reserva = this.pastReservations.find(r => r.id === reservaId);
        }

        if (!reserva) {
            console.error('❌ Reserva não encontrada:', reservaId);
            return;
        }

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);

        if (window.modalManager) {
            window.modalManager.showDetailsModal(reserva, barbeiro, servico, () => {
                this.loadFutureReservations();
                if (this.activeTab === 'past') {
                    this.loadPastReservations();
                }
            });
        } else {
            console.error('❌ Modal manager não encontrado');
            window.location.href = `/admin/reservas.html?open=${reservaId}`;
        }
    }

    closeModal() {
        const modal = document.getElementById('reservationModal');
        if (modal && modal.parentElement) {
            modal.parentElement.remove();
        }
    }

    setupModalCloseHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'reservationModal') {
                this.closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // ✨ NOVO: Modal de edição de cliente
    openEditClientModal() {
        if (!this.cliente) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'editClientModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Cliente</h3>
                    <button class="modal-close" onclick="window.clientDetailManager.closeEditClientModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editClientForm" class="form-grid">
                        <div class="form-group">
                            <label class="form-label required">Nome</label>
                            <input type="text" id="editClientNome" class="form-control" value="${this.escapeHtml(this.cliente.nome)}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Telefone</label>
                            <input type="tel" id="editClientTelefone" class="form-control" value="${this.cliente.telefone}" required>
                        </div>
                        
                        <div class="form-group form-group-full">
                            <label class="form-label">Email</label>
                            <input type="email" id="editClientEmail" class="form-control" value="${this.cliente.email || ''}">
                        </div>
                        
                        <div class="form-group form-group-full">
                            <label class="form-label">Notas</label>
                            <textarea id="editClientNotas" class="form-control" rows="3">${this.cliente.notas || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.clientDetailManager.closeEditClientModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.clientDetailManager.saveClientChanges()">Guardar Alterações</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeEditClientModal();
        });
    }

    // ✨ NOVO: Fechar modal de edição
    closeEditClientModal() {
        document.getElementById('editClientModal')?.remove();
    }

    // ✨ NOVO: Guardar alterações do cliente
    async saveClientChanges() {
        const nome = document.getElementById('editClientNome').value.trim();
        const telefone = document.getElementById('editClientTelefone').value.trim();
        const email = document.getElementById('editClientEmail').value.trim();
        const notas = document.getElementById('editClientNotas').value.trim();
        
        if (!nome || !telefone) {
            alert('❌ Nome e telefone são obrigatórios');
            return;
        }
        
        try {
            await window.adminAPI.updateCliente(this.clientId, {
                nome,
                telefone,
                email: email || null,
                notas: notas || null
            });
            
            alert('✅ Cliente atualizado com sucesso!');
            this.closeEditClientModal();
            await this.loadClient();
            this.renderClientInfo();
        } catch (error) {
            console.error('Error updating client:', error);
            alert('❌ Erro ao atualizar cliente: ' + error.message);
        }
    }

    getStatusLabel(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'confirmada': 'Confirmada',
            'concluida': 'Concluída',
            'cancelada': 'Cancelada',
            'faltou': 'Faltou'
        };
        return statusMap[status] || status || 'Pendente';
    }

    getStatusClass(status) {
        const statusClassMap = {
            'pendente': 'status-pending',
            'confirmada': 'status-confirmed',
            'concluida': 'status-completed',
            'cancelada': 'status-cancelled',
            'faltou': 'status-cancelled'
        };
        return statusClassMap[status] || 'status-pending';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const container = document.getElementById('clientInfoCard');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.href='/admin/clients.html'">
                        <i class="fas fa-arrow-left"></i> Voltar para Clientes
                    </button>
                </div>
            `;
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.clientDetailManager = new ClientDetailManager();
    });
} else {
    window.clientDetailManager = new ClientDetailManager();
}

console.log('✅ Client Detail Manager loaded (com modal de edição)');
