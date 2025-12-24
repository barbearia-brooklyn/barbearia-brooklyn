// Brooklyn Barbearia - Modern Calendar Manager
// Implementa visualização geral (todos barbeiros) e individual (um barbeiro)

class ModernCalendarManager {
    constructor() {
        this.currentView = 'general'; // 'general' ou 'individual'
        this.currentDate = new Date();
        this.selectedBarberId = null;
        this.barbeiros = [];
        this.reservas = [];
        this.horariosIndisponiveis = [];
        this.weekOffset = 0;
        this.init();
    }

    async init() {
        console.log('📅 Initializing Modern Calendar...');
        try {
            await this.loadData();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('Calendar initialization error:', error);
            this.showError('Erro ao carregar calendário');
        }
    }

    async loadData() {
        try {
            // Carregar barbeiros
            const barbeirosResponse = await window.adminAPI.getBarbeiros();
            this.barbeiros = barbeirosResponse.barbeiros || barbeirosResponse || [];
            console.log('👨‍🦱 Barbeiros carregados:', this.barbeiros.length);

            // Popular selector de barbeiros
            this.populateBarbeiroSelector();

            // Carregar reservas do dia/semana atual
            await this.loadReservas();

            // Carregar horários indisponíveis
            await this.loadHorariosIndisponiveis();
        } catch (error) {
            console.error('Error loading calendar data:', error);
            throw error;
        }
    }

    async loadReservas() {
        try {
            const dataInicio = this.getStartDate();
            const dataFim = this.getEndDate();

            const response = await window.adminAPI.getReservas({
                data_inicio: dataInicio.toISOString().split('T')[0],
                data_fim: dataFim.toISOString().split('T')[0],
                ...(this.selectedBarberId && { barbeiro_id: this.selectedBarberId })
            });

            this.reservas = response.reservas || response.data || response || [];
            console.log('📌 Reservas carregadas:', this.reservas.length);
        } catch (error) {
            console.error('Error loading reservas:', error);
            this.reservas = [];
        }
    }

    async loadHorariosIndisponiveis() {
        try {
            const dataInicio = this.getStartDate();
            const dataFim = this.getEndDate();

            const response = await window.adminAPI.getHorariosIndisponiveis({
                data_inicio: dataInicio.toISOString().split('T')[0],
                data_fim: dataFim.toISOString().split('T')[0],
                ...(this.selectedBarberId && { barbeiro_id: this.selectedBarberId })
            });

            this.horariosIndisponiveis = response.horarios || response.data || response || [];
            console.log('⛔ Horários indisponíveis carregados:', this.horariosIndisponiveis.length);
        } catch (error) {
            console.error('Error loading horarios indisponiveis:', error);
            this.horariosIndisponiveis = [];
        }
    }

    getStartDate() {
        if (this.currentView === 'general') {
            // Para vista geral, mostrar apenas hoje
            const date = new Date(this.currentDate);
            date.setHours(0, 0, 0, 0);
            return date;
        } else {
            // Para vista individual, mostrar semana completa
            const date = new Date(this.currentDate);
            date.setDate(date.getDate() - date.getDay() + (this.weekOffset * 7));
            date.setHours(0, 0, 0, 0);
            return date;
        }
    }

    getEndDate() {
        if (this.currentView === 'general') {
            const date = new Date(this.currentDate);
            date.setHours(23, 59, 59, 999);
            return date;
        } else {
            const startDate = this.getStartDate();
            const date = new Date(startDate);
            date.setDate(date.getDate() + 6);
            date.setHours(23, 59, 59, 999);
            return date;
        }
    }

    populateBarbeiroSelector() {
        const select = document.getElementById('barberSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um barbeiro</option>';
        this.barbeiros.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Botões de mudança de vista
        document.getElementById('viewGeneralBtn')?.addEventListener('click', () => {
            this.switchView('general');
        });

        document.getElementById('viewIndividualBtn')?.addEventListener('click', () => {
            this.switchView('individual');
        });

        // Selector de barbeiro
        document.getElementById('barberSelect')?.addEventListener('change', (e) => {
            this.selectedBarberId = e.target.value ? parseInt(e.target.value) : null;
            this.loadReservas().then(() => this.render());
        });

        // Navegação de semana
        document.getElementById('prevWeekBtn')?.addEventListener('click', () => {
            this.weekOffset--;
            this.loadReservas().then(() => this.render());
        });

        document.getElementById('nextWeekBtn')?.addEventListener('click', () => {
            this.weekOffset++;
            this.loadReservas().then(() => this.render());
        });
    }

    switchView(view) {
        this.currentView = view;
        this.weekOffset = 0;

        // Atualizar botões ativos
        document.querySelectorAll('.view-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Mostrar/esconder controlos
        const barberSelector = document.getElementById('barberSelectorWrapper');
        const weekNav = document.getElementById('weekNavigation');

        if (view === 'individual') {
            barberSelector.style.display = 'flex';
            weekNav.style.display = 'flex';
        } else {
            barberSelector.style.display = 'none';
            weekNav.style.display = 'none';
        }

        // Re-render
        this.loadReservas().then(() => this.render());
    }

    render() {
        if (this.currentView === 'general') {
            this.renderGeneralView();
        } else {
            this.renderIndividualView();
        }
    }

    renderGeneralView() {
        const container = document.getElementById('calendarGridGeneral');
        const generalContainer = document.getElementById('generalViewContainer');
        const individualContainer = document.getElementById('individualViewContainer');

        if (!container) return;

        generalContainer.style.display = 'block';
        individualContainer.style.display = 'none';

        // Horários de funcionamento (09:00 - 21:00 em intervalos de 30 min)
        const horarios = this.generateTimeSlots('09:00', '21:00', 30);

        let html = '<div class="calendar-grid-general">';

        // Header row
        html += '<div class="calendar-time-slot header">Hora</div>';
        this.barbeiros.forEach(barbeiro => {
            html += `<div class="calendar-time-slot header">${barbeiro.nome}</div>`;
        });

        // Time slots rows
        horarios.forEach(horario => {
            html += `<div class="calendar-time-slot">${horario}</div>`;

            this.barbeiros.forEach(barbeiro => {
                const reserva = this.findReservaForSlot(barbeiro.id, horario);
                const indisponivel = this.findIndisponivelForSlot(barbeiro.id, horario);

                if (reserva) {
                    html += `
                        <div class="calendar-time-slot" data-barbeiro="${barbeiro.id}" data-time="${horario}">
                            <div class="booking-card" onclick="window.calendarManager.showReservaDetails(${reserva.id})">
                                <strong>${reserva.cliente_nome}</strong><br>
                                <small>${reserva.servico_nome || 'Serviço'}</small>
                            </div>
                        </div>
                    `;
                } else if (indisponivel) {
                    html += `
                        <div class="calendar-time-slot" data-barbeiro="${barbeiro.id}" data-time="${horario}">
                            <div class="booking-card unavailable">
                                <small>Indisponível</small>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="calendar-time-slot empty" 
                             data-barbeiro="${barbeiro.id}" 
                             data-time="${horario}"
                             onclick="window.calendarManager.createNewBooking(${barbeiro.id}, '${horario}')">
                            <span style="opacity: 0.3; font-size: 0.8em;">+</span>
                        </div>
                    `;
                }
            });
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderIndividualView() {
        const container = document.getElementById('calendarGridIndividual');
        const generalContainer = document.getElementById('generalViewContainer');
        const individualContainer = document.getElementById('individualViewContainer');

        if (!container) return;

        generalContainer.style.display = 'none';
        individualContainer.style.display = 'block';

        if (!this.selectedBarberId) {
            container.innerHTML = '<div class="empty-state"><p>Selecione um barbeiro para ver a agenda semanal</p></div>';
            return;
        }

        const barbeiro = this.barbeiros.find(b => b.id === this.selectedBarberId);
        if (!barbeiro) return;

        // Atualizar display da semana
        this.updateWeekDisplay();

        // Gerar dias da semana
        const startDate = this.getStartDate();
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            days.push(date);
        }

        let html = '';
        days.forEach(date => {
            const dayReservas = this.getReservasForDay(date);
            const isToday = this.isToday(date);

            html += `
                <div class="calendar-day-card ${isToday ? 'today' : ''}">
                    <div class="day-card-header">
                        <div class="day-date">
                            ${this.formatDayHeader(date)}
                        </div>
                    </div>
                    <div class="day-card-content">
            `;

            if (dayReservas.length === 0) {
                html += '<p style="text-align: center; color: #999; padding: 20px;">Sem reservas</p>';
            } else {
                dayReservas.forEach(reserva => {
                    const horario = this.formatTime(reserva.data_hora);
                    html += `
                        <div class="time-slot booked" onclick="window.calendarManager.showReservaDetails(${reserva.id})">
                            <div class="time-slot-time">${horario}</div>
                            <div class="time-slot-info">
                                <div class="time-slot-customer">${reserva.cliente_nome}</div>
                                <span class="time-slot-status ${reserva.status}">${reserva.status}</span>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ===== HELPER FUNCTIONS =====

    generateTimeSlots(start, end, intervalMinutes) {
        const slots = [];
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
            currentMin += intervalMinutes;
            if (currentMin >= 60) {
                currentMin -= 60;
                currentHour++;
            }
        }

        return slots;
    }

    findReservaForSlot(barbeiroId, horario) {
        return this.reservas.find(r => {
            if (r.barbeiro_id !== barbeiroId) return false;
            const reservaTime = this.formatTime(r.data_hora);
            return reservaTime === horario;
        });
    }

    findIndisponivelForSlot(barbeiroId, horario) {
        return this.horariosIndisponiveis.find(h => {
            if (h.barbeiro_id !== barbeiroId) return false;
            const startTime = this.formatTime(h.data_hora_inicio);
            const endTime = this.formatTime(h.data_hora_fim);
            return horario >= startTime && horario < endTime;
        });
    }

    getReservasForDay(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.reservas.filter(r => {
            const reservaDate = new Date(r.data_hora).toISOString().split('T')[0];
            return reservaDate === dateStr;
        }).sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    formatDayHeader(date) {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    updateWeekDisplay() {
        const startDate = this.getStartDate();
        const endDate = this.getEndDate();
        
        const displayElem = document.getElementById('weekRangeDisplay');
        if (displayElem) {
            displayElem.textContent = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
        }

        const yearElem = document.getElementById('weekYearDisplay');
        if (yearElem) {
            yearElem.textContent = startDate.getFullYear();
        }
    }

    // ===== ACTIONS =====

    createNewBooking(barbeiroId, horario) {
        console.log('Create new booking:', barbeiroId, horario);
        // TODO: Abrir modal de nova reserva
        alert(`Criar nova reserva para barbeiro ${barbeiroId} às ${horario}`);
    }

    showReservaDetails(reservaId) {
        console.log('Show reserva details:', reservaId);
        // TODO: Abrir modal com detalhes da reserva
        const reserva = this.reservas.find(r => r.id === reservaId);
        if (reserva) {
            alert(`Reserva:\n\nCliente: ${reserva.cliente_nome}\nServiço: ${reserva.servico_nome}\nHorário: ${this.formatTime(reserva.data_hora)}\nStatus: ${reserva.status}`);
        }
    }

    showError(message) {
        console.error(message);
        // TODO: Mostrar toast/notification
        alert(message);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendarManager = new ModernCalendarManager();
    });
} else {
    window.calendarManager = new ModernCalendarManager();
}
