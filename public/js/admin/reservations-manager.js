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
        
        // Check auth
        if (!window.AuthManager || !window.AuthManager.checkAuth()) {
            return;
        }

        try {
            await this.loadBarbeiros();
            await this.loadReservas();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('Reservations initialization error:', error);
            this.showError('Erro ao carregar reservas');
        }
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
            console.log(`📌 ${this.reservas.length} reservas carregadas`);
        } catch (error) {
            console.error('Error loading reservas:', error);
            this.reservas = [];
        }
    }

    setupEventListeners() {
        // Implement filter listeners when needed
        console.log('✅ Event listeners setup');
    }

    render() {
        const container = document.getElementById('reservationsContainer');
        if (!container) return;

        if (this.reservas.length === 0) {
            container.innerHTML = `
                <div class="reservations-empty" style="text-align: center; padding: 60px; background: white; border-radius: 12px;">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <h3 style="color: #666; margin-bottom: 8px;">Sem reservas</h3>
                    <p style="color: #999;">Não existem reservas para mostrar.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="reservations-list">';
        
        this.reservas.forEach(reserva => {
            const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
            const dataHora = new Date(reserva.data_hora);
            const dataFormatada = dataHora.toLocaleDateString('pt-PT');
            const horaFormatada = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            html += `
                <div class="reservation-item" onclick="window.reservationsManager.showDetails(${reserva.id})">
                    <div class="reservation-status-badge ${reserva.status}">
                        ${reserva.status === 'confirmed' ? '✓' : '?'}
                    </div>
                    <div class="reservation-info">
                        <div class="reservation-detail">
                            <div class="reservation-detail-label">Cliente</div>
                            <div class="reservation-detail-value">${reserva.cliente_nome}</div>
                        </div>
                        <div class="reservation-detail">
                            <div class="reservation-detail-label">Barbeiro</div>
                            <div class="reservation-detail-value">${barbeiro?.nome || 'N/A'}</div>
                        </div>
                        <div class="reservation-detail">
                            <div class="reservation-detail-label">Data e Hora</div>
                            <div class="reservation-detail-value">${dataFormatada} às ${horaFormatada}</div>
                        </div>
                        <div class="reservation-detail">
                            <div class="reservation-detail-label">Serviço</div>
                            <div class="reservation-detail-value">${reserva.servico_nome || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="reservation-actions">
                        <button class="reservation-action-btn" onclick="event.stopPropagation(); window.reservationsManager.editReserva(${reserva.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="reservation-action-btn danger" onclick="event.stopPropagation(); window.reservationsManager.deleteReserva(${reserva.id})">
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
        // TODO: Open modal
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
                <div style="text-align: center; padding: 40px; color: #e74c3c; background: white; border-radius: 12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p style="margin-top: 10px;">${message}</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 15px;">
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
