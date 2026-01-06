/**
 * Brooklyn Barbearia - Reservations Manager
 * Manages reservations list and interactions
 */

class Reservations {
    constructor() {
        this.reservas = [];
        this.barbeiros = [];
        this.servicos = [];
        this.currentUser = this.getCurrentUser();
        this.filters = {
            barbeiro_id: this.getInitialBarbeiroFilter(),
            data_inicio: '',
            data_fim: '',
            status: ''
        };
        this.init();
    }

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('admin_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            return null;
        }
    }

    getInitialBarbeiroFilter() {
        // Se é barbeiro, auto-filtrar pelo próprio
        if (this.currentUser && this.currentUser.role === 'barbeiro' && this.currentUser.barbeiro_id) {
            return String(this.currentUser.barbeiro_id);
        }
        return '';
    }

    async init() {
        // Check auth - mas continua mesmo sem token em debug mode
        if (typeof AuthManager !== 'undefined' && !AuthManager.checkAuth()) {
            console.warn('⚠️ Auth check failed, but continuing in debug mode...');
        }

        try {
            await this.loadBarbeiros();
            await this.loadServicos();
            this.setupFilters();
            this.adjustUIForRole(); // Ajustar UI conforme role
            await this.loadReservas();
            this.render();
        } catch (error) {
            console.error('Reservations initialization error:', error);
            this.showError('Erro ao carregar reservas: ' + error.message);
        }
    }

    adjustUIForRole() {
        // Se é barbeiro, ocultar filtro de barbeiro
        if (this.currentUser && this.currentUser.role === 'barbeiro') {
            const filterGroup = document.querySelector('.date-filter-group');
            const filterBarbeiro = document.getElementById('filterBarbeiro');
            
            if (filterBarbeiro && filterBarbeiro.parentElement) {
                // Ocultar todo o div do filtro de barbeiro
                filterBarbeiro.parentElement.style.display = 'none';
            }
        }
    }

    setupFilters() {
        // Set default date range (today to +30 days)
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 30);
        
        document.getElementById('filterDateStart').value = today.toISOString().split('T')[0];
        document.getElementById('filterDateEnd').value = endDate.toISOString().split('T')[0];
        
        this.filters.data_inicio = today.toISOString().split('T')[0];
        this.filters.data_fim = endDate.toISOString().split('T')[0];

        // Barbeiro filter change (só se não for barbeiro)
        const filterBarbeiro = document.getElementById('filterBarbeiro');
        if (filterBarbeiro) {
            filterBarbeiro.addEventListener('change', (e) => {
                this.filters.barbeiro_id = e.target.value;
                this.loadReservas().then(() => this.render());
            });
        }

        // Apply filter button
        document.getElementById('applyDateFilter')?.addEventListener('click', () => {
            this.applyDateFilter();
        });

        // Clear filter button
        document.getElementById('clearDateFilter')?.addEventListener('click', () => {
            this.clearDateFilter();
        });
    }

    async applyDateFilter() {
        const startDate = document.getElementById('filterDateStart').value;
        const endDate = document.getElementById('filterDateEnd').value;

        if (startDate && endDate && startDate > endDate) {
            alert('A data de início deve ser anterior à data de fim');
            return;
        }

        this.filters.data_inicio = startDate;
        this.filters.data_fim = endDate;

        await this.loadReservas();
        this.render();
    }

    clearDateFilter() {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 30);
        
        document.getElementById('filterDateStart').value = today.toISOString().split('T')[0];
        document.getElementById('filterDateEnd').value = endDate.toISOString().split('T')[0];
        
        // Só limpar filtro de barbeiro se não for barbeiro
        if (this.currentUser && this.currentUser.role !== 'barbeiro') {
            const filterBarbeiro = document.getElementById('filterBarbeiro');
            if (filterBarbeiro) {
                filterBarbeiro.value = '';
            }
            this.filters.barbeiro_id = '';
        }
        
        this.filters.data_inicio = today.toISOString().split('T')[0];
        this.filters.data_fim = endDate.toISOString().split('T')[0];
        
        this.loadReservas().then(() => this.render());
    }

    async loadBarbeiros() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbeiros = response.barbeiros || response || [];
            
            // Populate barbeiro filter (só se não for barbeiro)
            const select = document.getElementById('filterBarbeiro');
            if (select && this.currentUser && this.currentUser.role !== 'barbeiro') {
                select.innerHTML = '<option value="">Todos os barbeiros</option>';
                this.barbeiros.forEach(b => {
                    const option = document.createElement('option');
                    option.value = b.id;
                    option.textContent = b.nome;
                    select.appendChild(option);
                });
            }
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

    async loadReservas() {
        try {
            const response = await window.adminAPI.getReservas(this.filters);
            this.reservas = response.reservas || response.data || response || [];
            
            // Ordenar por data crescente (mais próxima primeiro)
            this.reservas.sort((a, b) => {
                return new Date(a.data_hora) - new Date(b.data_hora);
            });
            
        } catch (error) {
            console.error('Error loading reservas:', error);
            this.reservas = [];
            throw error;
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

    render() {
        const container = document.getElementById('reservationsContainer');
        if (!container) return;

        if (this.reservas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <h3>Sem reservas</h3>
                    <p>Não existem reservas para o período selecionado.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="reservations-grid">';
        
        this.reservas.forEach(reserva => {
            const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
            const dataHora = new Date(reserva.data_hora);
            const dataFormatada = dataHora.toLocaleDateString('pt-PT', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
            });
            const horaFormatada = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            const statusClass = this.getStatusClass(reserva.status);
            const statusLabel = this.getStatusLabel(reserva.status);

            // Foto do barbeiro do campo 'foto' (ex: Gui.jpg)
            const barbeiroFoto = barbeiro?.foto ? 
                `/images/barbers/${barbeiro.foto}` : 
                '/images/default-barber.png';

            html += `
                <div class="reservation-card" onclick="window.reservationsManager.showDetails(${reserva.id})">
                    <div class="reservation-card-header">
                        <div class="reservation-date">
                            <span class="date-day">${dataFormatada}</span>
                            <span class="date-time">${horaFormatada}</span>
                        </div>
                        <span class="reservation-status ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="reservation-card-body-compact">
                        <div class="reservation-info-compact">
                            <i class="fas fa-user"></i>
                            <span><strong>Cliente:</strong> ${reserva.cliente_nome}</span>
                        </div>
                        <div class="reservation-info-compact">
                            <img src="${barbeiroFoto}" alt="${barbeiro?.nome || 'Barbeiro'}" class="barber-photo-small" onerror="this.src='/images/default-barber.png'">
                            <span>${barbeiro?.nome || 'N/A'}</span>
                        </div>
                        <div class="reservation-info-compact">
                            <i class="fas fa-scissors"></i>
                            <span><strong>Serviço:</strong> ${reserva.servico_nome || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="reservation-card-actions">
                        <button class="btn btn-secondary" style="flex: 1; padding: 8px 14px; font-size: 0.85rem;" onclick="event.stopPropagation(); window.reservationsManager.editReserva(${reserva.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-primary" style="flex: 1; padding: 8px 14px; font-size: 0.85rem;" onclick="event.stopPropagation(); window.reservationsManager.changeStatus(${reserva.id})">
                            <i class="fas fa-sync"></i> Alterar Status
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    showDetails(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);

        // Use modalManager from modal.js
        if (window.modalManager) {
            window.modalManager.showDetailsModal(reserva, barbeiro, servico, () => {
                this.loadReservas().then(() => this.render());
            });
        } else {
            alert('⚠️ Modal manager not loaded');
        }
    }

    editReserva(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        // Use modalManager from modal.js
        if (window.modalManager) {
            window.modalManager.showDetailsModal(reserva, 
                this.barbeiros.find(b => b.id == reserva.barbeiro_id),
                this.servicos.find(s => s.id == reserva.servico_id),
                () => {
                    this.loadReservas().then(() => this.render());
                }
            );
        } else {
            alert('⚠️ Modal manager not loaded');
        }
    }

    // ✨ Bug #10 FIX: Trocar deleteReserva() por changeStatus()
    changeStatus(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);

        // Use modalManager from modal.js
        if (window.modalManager) {
            window.modalManager.showDetailsModal(reserva, barbeiro, servico, () => {
                this.loadReservas().then(() => this.render());
            });
            
            // Auto-abrir formulário de alteração de status
            setTimeout(() => {
                window.modalManager.showStatusChangeForm(reserva);
            }, 100);
        } else {
            alert('⚠️ Modal manager not loaded');
        }
    }

    showError(message) {
        const container = document.getElementById('reservationsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-state-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Erro ao carregar</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
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
        window.reservationsManager = new Reservations();
    });
} else {
    window.reservationsManager = new Reservations();
}
