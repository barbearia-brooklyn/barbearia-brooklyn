/**
 * Brooklyn Barbearia - Complete Calendar System
 */

class CalendarManager {
    constructor() {
        // Restore previous date from sessionStorage or use today
        const savedDate = sessionStorage.getItem('calendarDate');
        this.currentDate = savedDate ? new Date(savedDate) : new Date();
        
        this.selectedStaffId = sessionStorage.getItem('calendarStaffId') || 'all';
        this.barbeiros = [];
        this.servicos = [];
        this.reservas = [];
        this.horariosIndisponiveis = [];
        this.timeSlots = this.generateTimeSlots('09:00', '19:59', 15);  // 15min slots
        this.timeLabels = this.generateTimeSlots('09:00', '19:59', 30); // 30min labels
        this.init();
    }

    async init() {
        if (window.AuthManager) {
            const isAuth = window.AuthManager.checkAuth();
            console.log('🔒 Auth check result:', isAuth);
        }

        try {
            await Promise.all([
                this.loadBarbeiros(),
                this.loadServicos()
            ]);

            await this.loadData();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('❌ Calendar initialization error:', error);
            this.showError('Erro ao carregar calendário: ' + error.message + '. Experimente recarregar a página e verifique a ligação à internet. Em caso de erro persistente contacte de imediato o suporte.');
        }
    }

    async loadBarbeiros() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbeiros = response.barbeiros || response || [];

            const selector = document.getElementById('staffSelector');
            if (selector) {
                selector.innerHTML = '<option value="all">Todos os Barbeiros</option>';
                this.barbeiros.forEach(b => {
                    selector.innerHTML += `<option value="${b.id}" ${b.id == this.selectedStaffId ? 'selected' : ''}>${b.nome}</option>`;
                });
            }
        } catch (error) {
            console.error('❌ Error loading barbeiros:', error);
            throw error;
        }
    }

    async loadServicos() {
        try {
            const response = await window.adminAPI.getServicos();
            this.servicos = response.servicos || response || [];
        } catch (error) {
            console.error('❌ Error loading servicos:', error);
            throw error;
        }
    }

    async loadData() {
        try {
            const dateStr = this.currentDate.toISOString().split('T')[0];
            
            // Save current date to sessionStorage
            sessionStorage.setItem('calendarDate', this.currentDate.toISOString());

            const [reservasResponse, indisponiveisResponse] = await Promise.all([
                window.adminAPI.getReservas({ data_inicio: dateStr, data_fim: dateStr }),
                window.adminAPI.getHorariosIndisponiveis({ data_inicio: dateStr, data_fim: dateStr })
            ]);
            
            this.reservas = reservasResponse.reservas || reservasResponse.data || reservasResponse || [];
            this.horariosIndisponiveis = indisponiveisResponse.horarios || indisponiveisResponse.data || indisponiveisResponse || [];
            
        } catch (error) {
            console.error('❌ Error loading calendar data:', error);
            this.reservas = [];
            this.horariosIndisponiveis = [];
        }
    }

    setupEventListeners() {
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                this.loadData().then(() => this.render());
            });
        }

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                this.loadData().then(() => this.render());
            });
        }

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                this.loadData().then(() => this.render());
            });
        }

        const staffSelector = document.getElementById('staffSelector');
        if (staffSelector) {
            staffSelector.addEventListener('change', (e) => {
                this.selectedStaffId = e.target.value;
                // Save staff selection to sessionStorage
                sessionStorage.setItem('calendarStaffId', e.target.value);
                this.render();
            });
        }
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

        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        display.textContent = `${days[this.currentDate.getDay()]} ${this.currentDate.getDate()}. ${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    renderAllStaffView() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        grid.style.gridTemplateColumns = `80px repeat(${this.barbeiros.length}, minmax(140px, 1fr))`;
        grid.style.gridAutoRows = `minmax(20px, auto)`;

        let html = '';
        
        // Header Row
        html += '<div class="calendar-header-cell" style="grid-row: span 2;">Hora</div>';
        this.barbeiros.forEach(b => {
            html += `<div class="calendar-header-cell" style="grid-row: span 2;">${b.nome}</div>`;
        });

        // Time slots
        this.timeSlots.forEach((time, idx) => {
            if (idx % 2 === 0) {
                html += `<div class="calendar-time-cell" style="grid-row: span 2;">${time}</div>`;
            }
            
            this.barbeiros.forEach(b => {
                html += this.renderSlot(b.id, time, idx);
            });
        });

        grid.innerHTML = html;
    }

    renderSingleStaffView() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        const barbeiro = this.barbeiros.find(b => b.id == this.selectedStaffId);
        if (!barbeiro) return;

        grid.style.gridTemplateColumns = '80px 1fr';
        grid.style.gridAutoRows = `minmax(20px, auto)`;

        let html = '';
        
        // Header
        html += '<div class="calendar-header-cell" style="grid-row: span 2;">Hora</div>';
        html += `<div class="calendar-header-cell" style="grid-row: span 2;">${barbeiro.nome}</div>`;

        // Time slots
        this.timeSlots.forEach((time, idx) => {
            if (idx % 2 === 0) {
                html += `<div class="calendar-time-cell" style="grid-row: span 2;">${time}</div>`;
            }
            html += this.renderSlot(barbeiro.id, time, idx);
        });

        grid.innerHTML = html;
    }

    renderSlot(barbeiroId, time, idx) {
        const reserva = this.findReservaStartingAt(barbeiroId, time);
        const bloqueado = this.findBloqueadoForSlot(barbeiroId, time);
        const slotType = this.getSlotType(time);

        // Reservation starts here
        if (reserva) {
            const servico = this.servicos.find(s => s.id == reserva.servico_id);
            const duracao = servico?.duracao || 30;
            const slotsOcupados = Math.max(1, Math.ceil(duracao / 15));

            const startTime = new Date(reserva.data_hora);
            const endTime = new Date(startTime.getTime() + duracao * 60000);
            const timeRange = `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;

            const servicoLabel = servico?.abreviacao || servico?.nome || 'Serviço';
            const headerText = `${this.truncate(reserva.cliente_nome, 25)}, ${servicoLabel}`;

            const bgColor = servico?.color || '#0f7e44';
            const textColor = this.getContrastColor(bgColor);

            return `
                <div class="calendar-slot calendar-slot-with-booking" 
                     style="grid-row: span 1; position: relative;" 
                     data-slot-type="${slotType}"
                     data-reserva-id="${reserva.id}">
                    <div class="booking-card-absolute" 
                         style="height: ${slotsOcupados * 20}px; background: ${bgColor}; color: ${textColor};"
                         onclick="window.calendar.showReservaModal(${reserva.id})">
                        <div class="booking-card-header">${headerText}</div>
                        ${duracao > 15 ? `<div class="booking-card-time">${timeRange}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        // Inside existing reservation
        const isInsideReservation = this.isSlotInsideReservation(barbeiroId, time);
        if (isInsideReservation) {
            return `<div class="calendar-slot calendar-slot-occupied" 
                         style="grid-row: span 1;" 
                         data-slot-type="${slotType}"></div>`;
        }
        
        // Blocked time
        if (bloqueado) {
            return `<div class="calendar-slot blocked" 
                         style="grid-row: span 1;" 
                         data-slot-type="${slotType}"></div>`;
        }
        
        // Available slot
        return `<div class="calendar-slot" 
                     style="grid-row: span 1;" 
                     data-slot-type="${slotType}"
                     onclick="window.calendar.openBookingModal(${barbeiroId}, '${time}')"></div>`;
    }

    // ===== MODAL INTEGRATION =====

    openBookingModal(barbeiroId, time) {
        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const dateTime = `${this.currentDate.toISOString().split('T')[0]}T${time}:00`;

        // Use centralized ModalManager
        window.modalManager.openBookingModal(
            barbeiro,
            dateTime,
            this.servicos,
            () => this.loadData().then(() => this.render())
        );
    }

    showReservaModal(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);

        // Use centralized ModalManager
        window.modalManager.showDetailsModal(
            reserva,
            barbeiro,
            servico,
            () => this.loadData().then(() => this.render())
        );
    }

    // ===== COLOR HELPERS =====

    getContrastColor(hexColor) {
        if (!hexColor) return '#ffffff';
        
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.6 ? '#333333' : '#ffffff';
    }

    // ===== RESERVATION POSITIONING =====

    findReservaStartingAt(barbeiroId, time) {
        return this.reservas.find(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            const reservaTime = this.formatTime(new Date(r.data_hora));
            return reservaTime === time;
        });
    }

    isSlotInsideReservation(barbeiroId, time) {
        return this.reservas.some(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            
            const reservaStart = new Date(r.data_hora);
            const reservaStartTime = this.formatTime(reservaStart);
            
            const servico = this.servicos.find(s => s.id == r.servico_id);
            const duracao = servico?.duracao || 30;
            
            const reservaEnd = new Date(reservaStart.getTime() + duracao * 60000);
            const reservaEndTime = this.formatTime(reservaEnd);
            
            return time > reservaStartTime && time < reservaEndTime;
        });
    }

    getSlotType(time) {
        const [hours, minutes] = time.split(':').map(Number);
        
        if (minutes === 0) return 'hour';
        if (minutes === 30) return 'half';
        
        return 'quarter';
    }

    // ===== TIME FORMATTING =====

    formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // ===== UTILITIES =====

    generateTimeSlots(start, end, intervalMinutes) {
        const slots = [];
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        let hour = startHour, min = startMin;

        while (hour < endHour || (hour === endHour && min <= endMin)) {
            slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            min += intervalMinutes;
            if (min >= 60) { min -= 60; hour++; }
        }
        return slots;
    }

    findBloqueadoForSlot(barbeiroId, time) {
        return this.horariosIndisponiveis.find(h => {
            if (h.barbeiro_id != barbeiroId) return false;
            const start = this.formatTime(new Date(h.data_hora_inicio));
            const end = this.formatTime(new Date(h.data_hora_fim));
            return time >= start && time < end;
        });
    }

    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    showError(message) {
        const grid = document.getElementById('calendarGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
                    ❌ ${message}
                </div>
            `;
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendar = new CalendarManager();
    });
} else {
    window.calendar = new CalendarManager();
}
