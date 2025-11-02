/**
 * Gestão do calendário
 */

class CalendarManager {
    static RESERVAS_API = '/api/admin/reservas';
    static currentWeekStart = null;
    static currentBarber = null;

    static init() {
        this.currentWeekStart = UIHelper.getWeekStart(new Date());
        this.setupEventListeners();
    }

    static setupEventListeners() {
        document.getElementById('prevBtn')?.addEventListener('click', () => this.previousWeek());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextWeek());

        document.querySelectorAll('.nav-item-calendar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadCalendar(ProfileManager.getSelectedBarber());
            });
        });
    }

    static previousWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.loadCalendar(this.currentBarber);
    }

    static nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.loadCalendar(this.currentBarber);
    }

    static async loadCalendar(barberId) {
        try {
            UIHelper.showLoading(true);

            this.currentBarber = barberId;
            const weekEnd = UIHelper.getWeekEnd(this.currentWeekStart);

            const params = new URLSearchParams({
                dataInicio: UIHelper.formatDateISO(this.currentWeekStart),
                dataFim: UIHelper.formatDateISO(weekEnd)
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
            this.renderCalendar(reservas);
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar calendário', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static renderCalendar(reservas) {
        const container = document.getElementById('calendarGrid');
        const weekEnd = UIHelper.getWeekEnd(this.currentWeekStart);

        document.getElementById('weekDisplay').textContent =
            `${UIHelper.formatDate(this.currentWeekStart)} - ${UIHelper.formatDate(weekEnd)}`;

        container.innerHTML = '';

        // Agrupar reservas por data
        const reservasPorData = {};
        reservas.forEach(reserva => {
            const data = UIHelper.formatDateISO(reserva.data_hora);
            if (!reservasPorData[data]) {
                reservasPorData[data] = [];
            }
            reservasPorData[data].push(reserva);
        });

        // Renderizar dias da semana
        const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const calendarDiv = document.createElement('div');
        calendarDiv.className = 'daily-calendar-container';

        for (let i = 0; i < 6; i++) {
            const dia = new Date(this.currentWeekStart);
            dia.setDate(dia.getDate() + i);
            const diaISO = UIHelper.formatDateISO(dia);

            const dayDiv = document.createElement('div');
            dayDiv.className = 'daily-calendar-day';

            const titulo = document.createElement('h3');
            titulo.textContent = `${diasSemana[i]} - ${dia.toLocaleDateString('pt-PT')}`;
            dayDiv.appendChild(titulo);

            const gridDiv = document.createElement('div');
            gridDiv.className = 'daily-calendar-grid';

            const reservasDia = reservasPorData[diaISO] || [];

            if (reservasDia.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-slot';
                empty.textContent = 'Sem reservas neste dia';
                gridDiv.appendChild(empty);
            } else {
                reservasDia.forEach(reserva => {
                    const slot = document.createElement('div');
                    slot.className = 'booking-slot';
                    slot.innerHTML = `
                        <div class="booking-slot-barber">${reserva.barbeiro_nome}</div>
                        <div class="booking-slot-service">${reserva.servico_nome}</div>
                        <div class="booking-slot-time">${UIHelper.formatTime(reserva.data_hora)}</div>
                    `;
                    slot.addEventListener('click', () => {
                        ModalManager.showBookingDetail(reserva);
                    });
                    gridDiv.appendChild(slot);
                });
            }

            dayDiv.appendChild(gridDiv);
            calendarDiv.appendChild(dayDiv);
        }

        container.appendChild(calendarDiv);
    }
}
