/**
 * Reservations Manager
 * Gerencia lista de reservas
 */

const ReservationsManager = {
    reservations: [],
    barbers: [],
    filters: {
        status: '',
        barber: '',
        date: ''
    },
    apiBase: '/api/admin',

    init() {
        console.log('Inicializando ReservationsManager...');
        this.setupEventListeners();
        this.loadBarbers();
        this.loadReservations();
    },

    setupEventListeners() {
        document.getElementById('filterStatus')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.renderReservations();
        });

        document.getElementById('filterBarber')?.addEventListener('change', (e) => {
            this.filters.barber = e.target.value;
            this.renderReservations();
        });

        document.getElementById('filterDate')?.addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.renderReservations();
        });
    },

    async loadBarbers() {
        try {
            if (typeof ProfileManager !== 'undefined') {
                this.barbers = ProfileManager.getBarbeiros();
            } else {
                this.barbers = [
                    { id: 1, nome: 'Barbeiro 1' },
                    { id: 2, nome: 'Barbeiro 2' },
                    { id: 3, nome: 'Barbeiro 3' }
                ];
            }
            this.populateBarberFilter();
        } catch (error) {
            console.error('Erro ao carregar barbeiros:', error);
        }
    },

    populateBarberFilter() {
        const select = document.getElementById('filterBarber');
        if (!select) return;

        this.barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = barber.nome;
            select.appendChild(option);
        });
    },

    async loadReservations() {
        try {
            // Mock data - será substituído por API real
            this.reservations = [
                {
                    id: 1,
                    customerName: 'João Silva',
                    customerPhone: '912345678',
                    barberId: 1,
                    barberName: 'Barbeiro 1',
                    service: 'Corte de Cabelo',
                    date: new Date(2025, 11, 24, 10, 0),
                    duration: 30,
                    status: 'confirmed',
                    price: 15
                },
                {
                    id: 2,
                    customerName: 'Pedro Santos',
                    customerPhone: '912345679',
                    barberId: 2,
                    barberName: 'Barbeiro 2',
                    service: 'Corte + Barba',
                    date: new Date(2025, 11, 24, 11, 0),
                    duration: 45,
                    status: 'confirmed',
                    price: 25
                },
                {
                    id: 3,
                    customerName: 'Miguel Costa',
                    customerPhone: '912345680',
                    barberId: 1,
                    barberName: 'Barbeiro 1',
                    service: 'Corte de Cabelo',
                    date: new Date(2025, 11, 24, 14, 0),
                    duration: 30,
                    status: 'pending',
                    price: 15
                },
                {
                    id: 4,
                    customerName: 'Carlos Lima',
                    customerPhone: '912345681',
                    barberId: 3,
                    barberName: 'Barbeiro 3',
                    service: 'Barba',
                    date: new Date(2025, 11, 24, 15, 30),
                    duration: 20,
                    status: 'confirmed',
                    price: 10
                },
                {
                    id: 5,
                    customerName: 'Fernando Dias',
                    customerPhone: '912345682',
                    barberId: 2,
                    barberName: 'Barbeiro 2',
                    service: 'Corte de Cabelo',
                    date: new Date(2025, 11, 25, 9, 0),
                    duration: 30,
                    status: 'confirmed',
                    price: 15
                },
                {
                    id: 6,
                    customerName: 'Rui Martins',
                    customerPhone: '912345683',
                    barberId: 1,
                    barberName: 'Barbeiro 1',
                    service: 'Corte de Cabelo',
                    date: new Date(2025, 11, 23, 16, 0),
                    duration: 30,
                    status: 'cancelled',
                    price: 15
                }
            ];

            this.renderReservations();
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
        }
    },

    getFilteredReservations() {
        return this.reservations.filter(reservation => {
            // Filter by status
            if (this.filters.status && reservation.status !== this.filters.status) {
                return false;
            }

            // Filter by barber
            if (this.filters.barber && reservation.barberId != this.filters.barber) {
                return false;
            }

            // Filter by date
            if (this.filters.date) {
                const filterDate = new Date(this.filters.date);
                const reservationDate = new Date(reservation.date);
                if (filterDate.toDateString() !== reservationDate.toDateString()) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => b.date - a.date);
    },

    renderReservations() {
        const container = document.getElementById('reservationsList');
        if (!container) return;

        const filtered = this.getFilteredReservations();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="reservations-empty">
                    <div class="reservations-empty-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <p>Nenhuma reserva encontrada com os filtros aplicados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        filtered.forEach(reservation => {
            const item = document.createElement('div');
            item.className = 'reservation-item';

            const statusIcon = this.getStatusIcon(reservation.status);
            const dateStr = this.formatDate(reservation.date);
            const timeStr = `${String(reservation.date.getHours()).padStart(2, '0')}:${String(reservation.date.getMinutes()).padStart(2, '0')}`;

            item.innerHTML = `
                <div class="reservation-status-badge ${reservation.status}">
                    ${statusIcon}
                </div>
                <div class="reservation-info">
                    <div class="reservation-detail">
                        <span class="reservation-detail-label">Cliente</span>
                        <span class="reservation-detail-value">${reservation.customerName}</span>
                    </div>
                    <div class="reservation-detail">
                        <span class="reservation-detail-label">Serviço</span>
                        <span class="reservation-detail-value">${reservation.service}</span>
                    </div>
                    <div class="reservation-detail">
                        <span class="reservation-detail-label">Barbeiro</span>
                        <span class="reservation-detail-value">${reservation.barberName}</span>
                    </div>
                    <div class="reservation-detail">
                        <span class="reservation-detail-label">Data &amp; Hora</span>
                        <span class="reservation-detail-value">${dateStr} às ${timeStr}</span>
                    </div>
                </div>
                <span class="reservation-status">${this.getStatusLabel(reservation.status)}</span>
                <div class="reservation-actions">
                    <button class="reservation-action-btn" onclick="ReservationsManager.editReservation(${reservation.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="reservation-action-btn danger" onclick="ReservationsManager.cancelReservation(${reservation.id})">
                        <i class="fas fa-trash"></i> Cancelar
                    </button>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.reservation-actions')) {
                    this.showReservationDetail(reservation);
                }
            });

            container.appendChild(item);
        });
    },

    getStatusIcon(status) {
        switch (status) {
            case 'confirmed':
                return '✓';
            case 'pending':
                return '◐';
            case 'cancelled':
                return '✕';
            default:
                return '○';
        }
    },

    getStatusLabel(status) {
        switch (status) {
            case 'confirmed':
                return 'Confirmada';
            case 'pending':
                return 'Pendente';
            case 'cancelled':
                return 'Cancelada';
            default:
                return '-';
        }
    },

    formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('pt-PT', options);
    },

    showReservationDetail(reservation) {
        const timeStr = `${String(reservation.date.getHours()).padStart(2, '0')}:${String(reservation.date.getMinutes()).padStart(2, '0')}`;
        const detailBody = document.getElementById('reservationDetailBody');
        
        if (detailBody) {
            detailBody.innerHTML = `
                <div style="display: grid; gap: var(--space-16);">
                    <div>
                        <h4>Informações do Cliente</h4>
                        <p><strong>Nome:</strong> ${reservation.customerName}</p>
                        <p><strong>Telefone:</strong> ${reservation.customerPhone}</p>
                    </div>
                    <div>
                        <h4>Detalhes da Reserva</h4>
                        <p><strong>Barbeiro:</strong> ${reservation.barberName}</p>
                        <p><strong>Serviço:</strong> ${reservation.service}</p>
                        <p><strong>Data:</strong> ${this.formatDate(reservation.date)}</p>
                        <p><strong>Hora:</strong> ${timeStr}</p>
                        <p><strong>Duração:</strong> ${reservation.duration} minutos</p>
                        <p><strong>Preço:</strong> €${reservation.price.toFixed(2)}</p>
                        <p><strong>Status:</strong> ${this.getStatusLabel(reservation.status)}</p>
                    </div>
                </div>
            `;
        }

        ModalManager.openModal('reservationDetailModal');
    },

    editReservation(id) {
        console.log('Editar reserva:', id);
        // TODO: Abrir página de edição
    },

    cancelReservation(id) {
        if (confirm('Tem a certeza que deseja cancelar esta reserva?')) {
            const reservation = this.reservations.find(r => r.id === id);
            if (reservation) {
                reservation.status = 'cancelled';
                this.renderReservations();
                ModalManager.closeModal('reservationDetailModal');
            }
        }
    }
};
