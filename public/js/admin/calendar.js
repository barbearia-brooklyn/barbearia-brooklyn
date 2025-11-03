/**
 * Gestão do calendário com suporte a vista pessoal e coletiva
 */
class CalendarManager {
    static RESERVAS_API = '/api/admin/api_admin_reservas';
    static UNAVAILABLE_API = '/api/admin/api_horarios_indisponiveis';
    static currentDate = new Date();
    static currentBarber = null;
    static allBarbeiros = [];
    static horariosIndisponiveis = [];

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

            // Carregar reservas
            const reservasResponse = await fetch(`${this.RESERVAS_API}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                }
            });

            if (!reservasResponse.ok) throw new Error('Erro ao carregar calendário');

            let reservas = await reservasResponse.json();

            // Filtrar reservas canceladas
            reservas = reservas.filter(reserva => reserva.status !== 'cancelada');

            // Carregar horários indisponíveis (com tratamento de erro)
            try {
                const unavailableParams = new URLSearchParams({
                    data: UIHelper.formatDateISO(this.currentDate)
                });

                if (barberId) {
                    unavailableParams.append('barbeiroId', barberId);
                }

                const unavailableResponse = await fetch(`${this.UNAVAILABLE_API}?${unavailableParams}`, {
                    headers: {
                        'Authorization': `Bearer ${AuthManager.getToken()}`
                    }
                });

                if (unavailableResponse.ok) {
                    const contentType = unavailableResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        this.horariosIndisponiveis = await unavailableResponse.json();
                    } else {
                        console.warn('API de horários indisponíveis não retornou JSON');
                        this.horariosIndisponiveis = [];
                    }
                } else {
                    console.warn('API de horários indisponíveis não disponível');
                    this.horariosIndisponiveis = [];
                }
            } catch (unavailableError) {
                console.warn('Erro ao carregar horários indisponíveis:', unavailableError);
                this.horariosIndisponiveis = [];
            }

            // Renderizar calendário
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

    static isHourUnavailable(hour, barbeiroId) {
        const currentDateTime = new Date(this.currentDate);
        currentDateTime.setHours(hour, 0, 0, 0);

        return this.horariosIndisponiveis.some(horario => {
            if (barbeiroId && horario.barbeiro_id !== barbeiroId) {
                return false;
            }

            const inicio = new Date(horario.data_hora_inicio);
            const fim = new Date(horario.data_hora_fim);

            return currentDateTime >= inicio && currentDateTime < fim;
        });
    }

    static getUnavailableTypeForHour(hour, barbeiroId) {
        const currentDateTime = new Date(this.currentDate);
        currentDateTime.setHours(hour, 0, 0, 0);

        const horario = this.horariosIndisponiveis.find(h => {
            if (barbeiroId && h.barbeiro_id !== barbeiroId) {
                return false;
            }

            const inicio = new Date(h.data_hora_inicio);
            const fim = new Date(h.data_hora_fim);

            return currentDateTime >= inicio && currentDateTime < fim;
        });

        return horario ? horario.tipo : null;
    }

    static renderPersonalCalendar(reservas) {
        const container = document.getElementById('calendarGrid');
        const barber = this.allBarbeiros.find(b => b.id === this.currentBarber);
        UIHelper.updateHeaderTitle('Calendário de ${currentBarber.nome}', 'Disponibilidade e reservas do barbeiro');
        this.updateCalendarHeader();

        container.innerHTML = '';

        const mainDiv = document.createElement('div');
        mainDiv.className = 'calendar-personal';

        const timelineWrapper = document.createElement('div');
        timelineWrapper.className = 'calendar-timeline';

        // Timeline de horas
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'timeline-hours';

        const horaInicio = 10;
        const horaFim = 20;
        const slots = [];

        for (let h = horaInicio; h < horaFim; h++) {
            slots.push(h);
        }

        // Renderizar timeline (horas)
        slots.forEach(hour => {
            const hourDiv = document.createElement('div');
            hourDiv.className = 'time-slot-hour';
            hourDiv.textContent = `${String(hour).padStart(2, '0')}:00`;
            timelineDiv.appendChild(hourDiv);
        });

        timelineWrapper.appendChild(timelineDiv);

        // Container de reservas
        const reservasContainer = document.createElement('div');
        reservasContainer.className = 'calendar-reservations-timeline';

        const tipoLabels = {
            'folga': '🏖️ Folga',
            'almoco': '🍽️ Almoço',
            'ferias': '✈️ Férias',
            'ausencia': '🚫 Ausência',
            'outro': '📌 Indisponível'
        };

        // Organizar reservas por hora
        slots.forEach(hour => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'reservation-slot-hour';

            // Verificar se a hora está indisponível
            const isUnavailable = this.isHourUnavailable(hour, this.currentBarber);
            const unavailableType = this.getUnavailableTypeForHour(hour, this.currentBarber);

            if (isUnavailable) {
                const unavailableBlock = document.createElement('div');
                unavailableBlock.className = 'slot-unavailable';
                unavailableBlock.textContent = tipoLabels[unavailableType] || 'Indisponível';
                slotDiv.appendChild(unavailableBlock);
            } else {
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
                            <div class="card-client">${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')} - <strong>${reserva.nome_cliente || 'N/A'}</strong> - ${reserva.servico_nome}</div>
                        `;

                        card.style.cursor = 'pointer';
                        card.addEventListener('click', () => {
                            ModalManager.showBookingDetail(reserva);
                        });

                        slotDiv.appendChild(card);
                    });
                }
            }

            reservasContainer.appendChild(slotDiv);
        });

        timelineWrapper.appendChild(reservasContainer);
        mainDiv.appendChild(timelineWrapper);
        container.appendChild(mainDiv);
    }

    static renderCollectiveCalendar(reservas) {
        const container = document.getElementById('calendarGrid');

        this.updateCalendarHeader();

        container.innerHTML = '';

        const mainDiv = document.createElement('div');
        mainDiv.className = 'calendar-collective';

        const horaInicio = 10;
        const horaFim = 20;
        const slots = [];

        for (let h = horaInicio; h < horaFim; h++) {
            slots.push(h);
        }

        const headerDiv = document.createElement('div');
        headerDiv.className = 'collective-header';
        headerDiv.style.gridTemplateColumns = `80px repeat(${this.allBarbeiros.length}, 1fr)`;

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

        const tipoEmojis = {
            'folga': '🏖️',
            'almoco': '🍽️',
            'ferias': '✈️',
            'ausencia': '🚫',
            'outro': '📌'
        };

        // Linhas para cada hora
        slots.forEach(hour => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'collective-row';
            rowDiv.style.gridTemplateColumns = `80px repeat(${this.allBarbeiros.length}, 1fr)`;

            // Célula da hora
            const timeCell = document.createElement('div');
            timeCell.className = 'collective-row-hour';
            timeCell.textContent = `${String(hour).padStart(2, '0')}:00`;
            rowDiv.appendChild(timeCell);

            // Célula para cada barbeiro
            this.allBarbeiros.forEach(barber => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'collective-slot';

                // Verificar se está indisponível
                const isUnavailable = this.isHourUnavailable(hour, barber.id);
                const unavailableType = this.getUnavailableTypeForHour(hour, barber.id);

                if (isUnavailable) {
                    const unavailableBlock = document.createElement('div');
                    unavailableBlock.className = 'slot-collective-unavailable';
                    unavailableBlock.textContent = tipoEmojis[unavailableType] || '🚫';
                    unavailableBlock.title = 'Indisponível';
                    slotDiv.appendChild(unavailableBlock);
                } else {
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
                                <span class="collective-client">${reserva.nome_cliente || 'N/A'}</span>
                                <span class="card-service">${reserva.servico_nome}</span>
                            `;

                            card.style.cursor = 'pointer';
                            card.addEventListener('click', () => {
                                ModalManager.showBookingDetail(reserva);
                            });

                            slotDiv.appendChild(card);
                        });
                    }
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
