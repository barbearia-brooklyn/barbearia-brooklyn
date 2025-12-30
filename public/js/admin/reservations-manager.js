/**
 * Brooklyn Barbearia - Reservations Manager
 * Manages reservations list and interactions
 */

class ReservationsManager {
    constructor() {
        this.reservas = [];
        this.barbeiros = [];
        this.filters = {
            barbeiro_id: '',
            data_inicio: '',
            data_fim: '',
            status: ''
        };
        this.init();
    }

    async init() {
        console.log('📋 Initializing Reservations Manager...');
        
        // Check auth - mas continua mesmo sem token em debug mode
        if (typeof AuthManager !== 'undefined' && !AuthManager.checkAuth()) {
            console.warn('⚠️ Auth check failed, but continuing in debug mode...');
        }

        try {
            await this.loadBarbeiros();
            this.setupFilters();
            await this.loadReservas();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('Reservations initialization error:', error);
            this.showError('Erro ao carregar reservas: ' + error.message);
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
        document.getElementById('filterDateStart').value = '';
        document.getElementById('filterDateEnd').value = '';
        this.filters.data_inicio = '';
        this.filters.data_fim = '';
        this.loadReservas();
        this.render();
    }

    async loadBarbeiros() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbeiros = response.barbeiros || response || [];
            console.log(`👨‍🦱 ${this.barbeiros.length} barbeiros carregados`);
        } catch (error) {
            console.error('Error loading barbeiros:', error);
            this.barbeiros = [];
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
            
            console.log(`📌 ${this.reservas.length} reservas carregadas`);
        } catch (error) {
            console.error('Error loading reservas:', error);
            this.reservas = [];
            throw error;
        }
    }

    setupEventListeners() {
        console.log('✅ Event listeners setup');
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

            const statusClass = reserva.status === 'confirmed' ? 'status-confirmed' : 
                               reserva.status === 'completed' ? 'status-completed' : 
                               reserva.status === 'cancelled' ? 'status-cancelled' : 'status-pending';

            const statusLabel = reserva.status === 'confirmed' ? 'Confirmada' : 
                               reserva.status === 'completed' ? 'Concluída' : 
                               reserva.status === 'cancelled' ? 'Cancelada' : 'Pendente';

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
                        <button class="btn btn-danger" style="flex: 1; padding: 8px 14px; font-size: 0.85rem;" onclick="event.stopPropagation(); window.reservationsManager.deleteReserva(${reserva.id})">
                            <i class="fas fa-trash"></i> Eliminar
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
        const dataHora = new Date(reserva.data_hora);
        
        alert(`Reserva #${reserva.id}\n\nCliente: ${reserva.cliente_nome}\nBarbeiro: ${barbeiro?.nome}\nData: ${dataHora.toLocaleString('pt-PT')}\nServiço: ${reserva.servico_nome}\nStatus: ${reserva.status}\n\n(Modal a implementar)`);
    }

    editReserva(reservaId) {
        console.log('Edit reserva:', reservaId);
        alert('Editar reserva (Modal a implementar)');
    }

    async deleteReserva(reservaId) {
        if (!confirm('Tem certeza que deseja eliminar esta reserva?')) {
            return;
        }

        try {
            await window.adminAPI.deleteReserva(reservaId);
            alert('Reserva eliminada com sucesso!');
            await this.loadReservas();
            this.render();
        } catch (error) {
            console.error('Error deleting reserva:', error);
            alert('Erro ao eliminar reserva: ' + error.message);
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
        window.reservationsManager = new ReservationsManager();
    });
} else {
    window.reservationsManager = new ReservationsManager();
}

console.log('✅ Reservations Manager loaded');