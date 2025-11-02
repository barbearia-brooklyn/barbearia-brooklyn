/**
 * Gestão do calendário com suporte a vista pessoal e coletiva
 */

class CalendarManager {
    static RESERVAS_API = '/api/admin/reservas';
    static currentDate = new Date();
    static currentBarber = null;
    static allBarbeiros = [];

    static init() {
        this.setupEventListeners();
    }

    static setupEventListeners() {
        document.getElementById('prevBtn')?.addEventListener('click', () => this.previousDay());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextDay());

        document.querySelectorAll('.nav-item-calendar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadCalendar(ProfileManager.getSelectedBarber());
            });
        });
    }

    static previousDay() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.loadCalendar(this.currentBarber);
    }

    static nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.loadCalendar(this.currentBarber);
    }

    static async loadCalendar(barberId) {
        try {
            UIHelper.showLoading(true);

            this.currentBarber = barberId;
            this.allBarbeiros = ProfileManager.getBarbeiros();

            const params = new URLSearchParams({
                data: UIHelper.formatDateISO(this.currentDate)
            });

            if (barberId) {
                params.append('barbeiroId', barberId);
            }

            const response = await fetch(`${this.RESERVAS_API}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar calendário');

            const reservas = await response.json();

            if (barberId) {
                this.renderPersonalCalendar(reservas);
            } else {
                this.renderCollectiveCalendar(reservas);
            }
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar calendário', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static renderPersonalCalendar(reservas) {
        const container = document.getElementById('calendarGrid');
        const barber = this.allBarbeiros.find(b => b.id === this.currentBarber);

        // Atualizar header
        this.updateCalendarHeader();

        container.innerHTML = '';

        // Container principal
        const mainDiv = document.createElement('div');
        mainDiv.className = 'calendar-personal';

        // Timeline de horas
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'calendar-timeline';

        // Slots horários (10h às 20h)
        const horaInicio = 10;
        const horaFim = 20;
        const slots = [];

        for (let h = horaInicio; h < horaFim; h++) {
            slots.push(h);
        }

        // Renderizar timeline (horas)
        const timelineHours = document.createElement('div');
        timelineHours.className = 'timeline-hours';

        slots.forEach(hour => {
            const hourDiv = document.createElement('div');
            hourDiv.className = 'time-slot-hour';
            hourDiv.textContent = `${String(hour).padStart(2, '0')}:00`;
            timelineHours.appendChild(hourDiv);
        });

        timelineDiv.appendChild(timelineHours);

        // Container de reservas
        const reservasContainer = document.createElement('div');
        reservasContainer.className = 'calendar-reservations-timeline';

        // Organizar reservas por hora
        slots.forEach(hour => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'reservation-slot-hour';

            // Procurar reservas para esta hora
            const reservasHora = reservas.filter(r => {
                const dataHora = new Date(r.data_hora);
                return dataHora.getHours() === hour;
            });

            if (reservasHora.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'slot-empty';
                empty.textContent = 'Disponível';
                slotDiv.appendChild(empty);
            } else {
                reservasHora.forEach(reserva => {
                    const card = document.createElement('div');
                    card.className = 'reservation-card-timeline';

                    const dataHora = new Date(reserva.data_hora);
                    const hora = dataHora.getHours();
                    const minutos = dataHora.getMinutes();

                    card.innerHTML = `
                        <div class="card-time">${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}</div>
                        <div class="card-client"><strong>${reserva.cliente_nome || reserva.nome || 'N/A'}</strong></div>
                        <div class="card-service">${reserva.servico_nome}</div>
                        ${reserva.telefone ? `<div class="card-phone">${reserva.telefone}</div>` : ''}
                    `;

                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        ModalManager.showBookingDetail(reserva);
                    });

                    slotDiv.appendChild(card);
                });
            }

            reservasContainer.appendChild(slotDiv);
        });

        mainDiv.appendChild(timelineDiv);
        mainDiv.appendChild(reservasContainer);
        container.appendChild(mainDiv);
    }

    static renderCollectiveCalendar(reservas) {
        const container = document.getElementById('calendarGrid');

        // Atualizar header
        this.updateCalendarHeader();

        container.innerHTML = '';

        // Container principal
        const mainDiv = document.createElement('div');
        mainDiv.className = 'calendar-collective';

        const horaInicio = 10;
        const horaFim = 20;
        const slots = [];

        for (let h = horaInicio; h < horaFim; h++) {
            slots.push(h);
        }

        // ===== ESTRUTURA: LINHAS = HORAS, COLUNAS = BARBEIROS =====

        // Cabeçalho com barbeiros (colunas)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'collective-header';
        headerDiv.style.gridTemplateColumns = `100px repeat(${this.allBarbeiros.length}, 1fr)`;

        const emptyHeader = document.createElement('div');
        emptyHeader.className = 'collective-header-time';
        emptyHeader.textContent = 'Hora';
        headerDiv.appendChild(emptyHeader);

        this.allBarbeiros.forEach(barber => {
            const barbeiroDivHeader = document.createElement('div');
            barbeiroDivHeader.className = 'collective-header-barber';
            barbeiroDivHeader.textContent = barber.nome;
            headerDiv.appendChild(barbeiroDivHeader);
        });

        mainDiv.appendChild(headerDiv);

        // Linhas para cada hora
        slots.forEach(hour => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'collective-row';
            rowDiv.style.gridTemplateColumns = `100px repeat(${this.allBarbeiros.length}, 1fr)`;

            // Célula da hora
            const timeCell = document.createElement('div');
            timeCell.className = 'collective-row-hour';
            timeCell.textContent = `${String(hour).padStart(2, '0')}:00`;
            rowDiv.appendChild(timeCell);

            // Célula para cada barbeiro
            this.allBarbeiros.forEach(barber => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'collective-slot';

                // Procurar reservas para este barbeiro nesta hora
                const reservasHora = reservas.filter(r => {
                    const dataHora = new Date(r.data_hora);
                    return r.barbeiro_id === barber.id && dataHora.getHours() === hour;
                });

                if (reservasHora.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'slot-collective-empty';
                    empty.textContent = '○';
                    slotDiv.appendChild(empty);
                } else {
                    reservasHora.forEach(reserva => {
                        const card = document.createElement('div');
                        card.className = 'reservation-card-collective';

                        const minutos = new Date(reserva.data_hora).getMinutes();

                        card.innerHTML = `
                            <span class="collective-time">${String(minutos).padStart(2, '0')}</span>
                            <span class="collective-client">${reserva.cliente_nome || reserva.nome || 'N/A'}</span>
                        `;

                        card.style.cursor = 'pointer';
                        card.addEventListener('click', () => {
                            ModalManager.showBookingDetail(reserva);
                        });

                        slotDiv.appendChild(card);
                    });
                }

                rowDiv.appendChild(slotDiv);
            });

            mainDiv.appendChild(rowDiv);
        });

        container.appendChild(mainDiv);
    }

    static updateCalendarHeader() {
        const dataFormatada = UIHelper.formatDate(this.currentDate);
        document.getElementById('weekDisplay').textContent = dataFormatada;
    }
}