/**
 * Brooklyn Barbearia - Calendar Manager
 * Displays calendar grid with all staff or individual staff schedule
 */

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedStaffId = 'all';
        this.barbeiros = [];
        this.reservas = [];
        this.horariosIndisponiveis = [];
        this.timeSlots = this.generateTimeSlots('09:30', '21:00', 30);
        this.init();
    }

    async init() {
        console.log('📅 Initializing Calendar Manager...');
        
        // Check auth
        if (!window.AuthManager || !window.AuthManager.checkAuth()) {
            return;
        }

        try {
            await this.loadBarbeiros();
            await this.loadData();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('Calendar initialization error:', error);
            this.showError('Erro ao carregar calendário');
        }
    }

    async loadBarbeiros() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbeiros = response.barbeiros || response || [];
            console.log(`👨‍🦱 ${this.barbeiros.length} barbeiros carregados`);
            
            // Populate staff selector
            const selector = document.getElementById('staffSelector');
            if (selector) {
                selector.innerHTML = '<option value="all">Todos os Barbeiros</option>';
                this.barbeiros.forEach(b => {
                    const option = document.createElement('option');
                    option.value = b.id;
                    option.textContent = b.nome;
                    selector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading barbeiros:', error);
            throw error;
        }
    }

    async loadData() {
        try {
            const dateStr = this.currentDate.toISOString().split('T')[0];
            
            // Load reservations
            const reservasResponse = await window.adminAPI.getReservas({
                data_inicio: dateStr,
                data_fim: dateStr
            });
            this.reservas = reservasResponse.reservas || reservasResponse.data || reservasResponse || [];
            console.log(`📌 ${this.reservas.length} reservas carregadas`);

            // Load unavailable times
            const indisponiveisResponse = await window.adminAPI.getHorariosIndisponiveis({
                data_inicio: dateStr,
                data_fim: dateStr
            });
            this.horariosIndisponiveis = indisponiveisResponse.horarios || indisponiveisResponse.data || indisponiveisResponse || [];
            console.log(`⛔ ${this.horariosIndisponiveis.length} horários indisponíveis`);
        } catch (error) {
            console.error('Error loading calendar data:', error);
            this.reservas = [];
            this.horariosIndisponiveis = [];
        }
    }

    setupEventListeners() {
        // Today button
        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.loadData().then(() => this.render());
        });

        // Navigation buttons
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            this.loadData().then(() => this.render());
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            this.loadData().then(() => this.render());
        });

        // Staff selector
        document.getElementById('staffSelector')?.addEventListener('change', (e) => {
            this.selectedStaffId = e.target.value;
            this.render();
        });
    }

    render() {
        this.updateDateDisplay();
        
        if (this.selectedStaffId === 'all') {
            this.renderAllStaffView();
        } else {
            this.renderSingleStaffView();
        }
    }

    updateDateDisplay() {
        const display = document.getElementById('dateDisplay');
        if (!display) return;

        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        const dayName = days[this.currentDate.getDay()];
        const day = this.currentDate.getDate();
        const month = months[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();

        display.textContent = `${dayName} ${day}. ${month} ${year}`;
    }

    renderAllStaffView() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        let html = '';

        // Header row
        html += '<div class="calendar-header-cell" style="grid-column: 1;">Hora</div>';
        this.barbeiros.forEach(barbeiro => {
            html += `<div class="calendar-header-cell">${barbeiro.nome}</div>`;
        });

        // Time slots
        this.timeSlots.forEach(time => {
            // Time cell
            html += `<div class="calendar-time-cell">${time}</div>`;

            // Staff columns
            this.barbeiros.forEach(barbeiro => {
                const reserva = this.findReservaForSlot(barbeiro.id, time);
                const bloqueado = this.findBloqueadoForSlot(barbeiro.id, time);

                if (reserva) {
                    html += `
                        <div class="calendar-slot has-booking" data-barbeiro="${barbeiro.id}" data-time="${time}" onclick="window.calendar.showReservaDetails(${reserva.id})">
                            <div class="booking-card">
                                <div class="booking-card-name">${this.truncate(reserva.cliente_nome, 20)}</div>
                                <div class="booking-card-service">${reserva.servico_nome || 'Serviço'}</div>
                            </div>
                        </div>
                    `;
                } else if (bloqueado) {
                    html += `
                        <div class="calendar-slot" data-barbeiro="${barbeiro.id}" data-time="${time}">
                            <div class="blocked-time">Indisponível</div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="calendar-slot" data-barbeiro="${barbeiro.id}" data-time="${time}" onclick="window.calendar.createBooking(${barbeiro.id}, '${time}')">
                        </div>
                    `;
                }
            });
        });

        grid.innerHTML = html;
    }

    renderSingleStaffView() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        const barbeiro = this.barbeiros.find(b => b.id == this.selectedStaffId);
        if (!barbeiro) return;

        let html = '';

        // Header
        html += '<div class="calendar-header-cell" style="grid-column: 1;">Hora</div>';
        html += `<div class="calendar-header-cell">${barbeiro.nome}</div>`;

        // Time slots
        this.timeSlots.forEach(time => {
            html += `<div class="calendar-time-cell">${time}</div>`;

            const reserva = this.findReservaForSlot(barbeiro.id, time);
            const bloqueado = this.findBloqueadoForSlot(barbeiro.id, time);

            if (reserva) {
                html += `
                    <div class="calendar-slot has-booking" data-barbeiro="${barbeiro.id}" data-time="${time}" onclick="window.calendar.showReservaDetails(${reserva.id})">
                        <div class="booking-card">
                            <div class="booking-card-name">${reserva.cliente_nome}</div>
                            <div class="booking-card-service">${reserva.servico_nome || 'Serviço'} (${this.formatTime(reserva.data_hora)})</div>
                        </div>
                    </div>
                `;
            } else if (bloqueado) {
                html += `
                    <div class="calendar-slot" data-barbeiro="${barbeiro.id}" data-time="${time}">
                        <div class="blocked-time">Indisponível</div>
                    </div>
                `;
            } else {
                html += `
                    <div class="calendar-slot" data-barbeiro="${barbeiro.id}" data-time="${time}" onclick="window.calendar.createBooking(${barbeiro.id}, '${time}')">
                    </div>
                `;
            }
        });

        grid.innerHTML = html;
    }

    // ===== HELPER METHODS =====

    generateTimeSlots(start, end, intervalMinutes) {
        const slots = [];
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let hour = startHour;
        let min = startMin;

        while (hour < endHour || (hour === endHour && min <= endMin)) {
            slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            min += intervalMinutes;
            if (min >= 60) {
                min -= 60;
                hour++;
            }
        }

        return slots;
    }

    findReservaForSlot(barbeiroId, time) {
        return this.reservas.find(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            const reservaTime = this.formatTime(r.data_hora);
            return reservaTime === time;
        });
    }

    findBloqueadoForSlot(barbeiroId, time) {
        return this.horariosIndisponiveis.find(h => {
            if (h.barbeiro_id != barbeiroId) return false;
            const startTime = this.formatTime(h.data_hora_inicio);
            const endTime = this.formatTime(h.data_hora_fim);
            return time >= startTime && time < endTime;
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    // ===== ACTIONS =====

    createBooking(barbeiroId, time) {
        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        console.log('Create booking:', barbeiro?.nome, time);
        alert(`Criar nova reserva:\n\nBarbeiro: ${barbeiro?.nome}\nHorário: ${time}\nData: ${this.currentDate.toLocaleDateString('pt-PT')}\n\n(Modal a implementar)`);
        // TODO: Open modal
    }

    showReservaDetails(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;
        
        console.log('Show reserva:', reserva);
        alert(`Reserva #${reserva.id}:\n\nCliente: ${reserva.cliente_nome}\nServiço: ${reserva.servico_nome}\nHorário: ${this.formatTime(reserva.data_hora)}\nStatus: ${reserva.status}\n\n(Modal a implementar)`);
        // TODO: Open modal
    }

    showError(message) {
        const grid = document.getElementById('calendarGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
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

// Initialize calendar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendar = new CalendarManager();
    });
} else {
    window.calendar = new CalendarManager();
}

console.log('✅ Calendar module loaded');
