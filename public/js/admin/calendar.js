/**
 * Brooklyn Barbearia - Complete Calendar System
 */

class CalendarManager {
    constructor() {
        console.log('📅 CalendarManager constructor called');
        this.currentDate = new Date();
        this.selectedStaffId = 'all';
        this.barbeiros = [];
        this.servicos = [];
        this.reservas = [];
        this.horariosIndisponiveis = [];
        this.clientes = [];
        this.selectedClientId = null;
        this.searchTimeout = null;
        this.timeSlots = this.generateTimeSlots('09:00', '19:59', 15);  // 15min slots
        this.timeLabels = this.generateTimeSlots('09:00', '19:59', 30); // 30min labels
        console.log('📅 About to call init()');
        this.init();
    }

    async init() {
        console.log('📅 Initializing Calendar Manager...');
        
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
            this.showError('Erro ao carregar calendário: ' + error.message);
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
                    selector.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
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

    async loadClientes(query = '') {
        try {
            const params = query ? { search: query, limit: 10 } : { limit: 100 };
            const response = await window.adminAPI.getClientes(params);
            this.clientes = response.clientes || response || [];
            return this.clientes;
        } catch (error) {
            console.error('❌ Error loading clientes:', error);
            this.clientes = [];
            return [];
        }
    }

    async loadData() {
        try {
            const dateStr = this.currentDate.toISOString().split('T')[0];

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

        // Grid: time col + staff columns, rows: header (2 cells tall) + time slots
        grid.style.gridTemplateColumns = `80px repeat(${this.barbeiros.length}, minmax(140px, 1fr))`;
        grid.style.gridAutoRows = `minmax(20px, auto)`;

        let html = '';
        
        // Header Row (span 2 rows for height)
        html += '<div class="calendar-header-cell" style="grid-row: span 2;">Hora</div>';
        this.barbeiros.forEach(b => {
            html += `<div class="calendar-header-cell" style="grid-row: span 2;">${b.nome}</div>`;
        });

        // Time slots and staff slots
        this.timeSlots.forEach((time, idx) => {
            // Show time label only every 30min (every 2nd slot)
            if (idx % 2 === 0) {
                html += `<div class="calendar-time-cell" style="grid-row: span 2;">${time}</div>`;
            }
            
            // Render staff slots
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
        
        // Header (span 2 rows)
        html += '<div class="calendar-header-cell" style="grid-row: span 2;">Hora</div>';
        html += `<div class="calendar-header-cell" style="grid-row: span 2;">${barbeiro.nome}</div>`;

        // Time slots
        this.timeSlots.forEach((time, idx) => {
            // Show time label every 30min
            if (idx % 2 === 0) {
                html += `<div class="calendar-time-cell" style="grid-row: span 2;">${time}</div>`;
            }
            html += this.renderSlot(barbeiro.id, time, idx);
        });

        grid.innerHTML = html;
    }

    renderSlot(barbeiroId, time, idx) {
        // Check if this is the START time of a reservation
        const reserva = this.findReservaStartingAt(barbeiroId, time);
        const bloqueado = this.findBloqueadoForSlot(barbeiroId, time);

        // Determine slot type for border hierarchy
        const slotType = this.getSlotType(time);

        // If reservation STARTS here, render booking card
        if (reserva) {
            const servico = this.servicos.find(s => s.id == reserva.servico_id);
            const duracao = servico?.duracao || 30;
            const slotsOcupados = Math.max(1, Math.ceil(duracao / 15));

            // Calculate time range
            const startTime = new Date(reserva.data_hora);
            const endTime = new Date(startTime.getTime() + duracao * 60000);
            const timeRange = `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;

            // Use abreviacao instead of nome for shorter display
            const servicoLabel = servico?.abreviacao || servico?.nome || 'Serviço';
            const headerText = `${this.truncate(reserva.cliente_nome, 12)}, ${servicoLabel}`;

            // Get service color (default to primary green if not set)
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
                        ${duracao > 30 ? `<div class="booking-card-time">${timeRange}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        // Check if this slot is INSIDE an existing reservation (skip rendering)
        const isInsideReservation = this.isSlotInsideReservation(barbeiroId, time);
        if (isInsideReservation) {
            return `<div class="calendar-slot calendar-slot-occupied" 
                         style="grid-row: span 1;" 
                         data-slot-type="${slotType}"></div>`;
        }
        
        if (bloqueado) {
            return `<div class="calendar-slot blocked" 
                         style="grid-row: span 1;" 
                         data-slot-type="${slotType}"></div>`;
        }
        
        return `<div class="calendar-slot" 
                     style="grid-row: span 1;" 
                     data-slot-type="${slotType}"
                     onclick="window.calendar.openBookingModal(${barbeiroId}, '${time}')"></div>`;
    }

    // ===== COLOR CONTRAST HELPER =====

    getContrastColor(hexColor) {
        // Handle null/undefined
        if (!hexColor) return '#ffffff';
        
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate relative luminance (WCAG formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return dark text for light backgrounds, light text for dark backgrounds
        return luminance > 0.6 ? '#333333' : '#ffffff';
    }

    // ===== HELPERS FOR RESERVATION POSITIONING =====

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
            
            // Calculate end time
            const reservaEnd = new Date(reservaStart.getTime() + duracao * 60000);
            const reservaEndTime = this.formatTime(reservaEnd);
            
            // Check if current time is AFTER start but BEFORE end
            return time > reservaStartTime && time < reservaEndTime;
        });
    }

    // ===== SLOT TYPE FOR BORDER HIERARCHY =====

    getSlotType(time) {
        // Parse time HH:MM
        const [hours, minutes] = time.split(':').map(Number);
        
        // Hour boundaries (09:00, 10:00, 11:00, etc.)
        if (minutes === 0) return 'hour';
        
        // Half-hour boundaries (09:30, 10:30, 11:30, etc.)
        if (minutes === 30) return 'half';
        
        // Quarter slots (09:15, 09:45, etc.)
        return 'quarter';
    }

    // ===== TIME FORMATTING (HH:MM only) =====

    formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    formatDateTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year} às ${this.formatTime(date)}`;
    }

    // ===== MODALS =====

    openBookingModal(barbeiroId, time) {
        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const dateTime = `${this.currentDate.toISOString().split('T')[0]} ${time}:00`;

        const modal = this.createBookingModal(barbeiro, dateTime);
        document.body.appendChild(modal);

        setTimeout(() => {
            document.getElementById('clientSearchInput')?.focus();
        }, 100);
    }

    createBookingModal(barbeiro, dateTime) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        
        const date = new Date(dateTime);
        const formattedDateTime = this.formatDateTime(date);

        modal.innerHTML = `
            <div class="modal-content modal-booking">
                <div class="modal-header">
                    <h3>Nova Reserva - ${barbeiro.nome}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-time-display">
                        📅 ${formattedDateTime}
                    </div>
                    
                    <div class="form-group">
                        <label>Cliente</label>
                        <input type="text" 
                               id="clientSearchInput" 
                               class="form-control" 
                               placeholder="Nome, telefone ou email"
                               oninput="window.calendar.searchClientsDebounced(this.value)">
                        <div id="clientSuggestions" class="client-suggestions"></div>
                    </div>

                    <div id="clientDataForm" style="display: none;">
                        <div class="form-group">
                            <label for="clientName">Nome Completo</label>
                            <input type="text" id="clientName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="clientPhone">Telefone</label>
                            <input type="tel" id="clientPhone" class="form-control" placeholder="+351" required>
                        </div>
                        <div class="form-group">
                            <label for="clientEmail">Email</label>
                            <input type="email" id="clientEmail" class="form-control">
                        </div>
                    </div>

                    <div id="bookingForm" style="display: none;">
                        <div class="form-group">
                            <label for="servicoSelect">Serviço</label>
                            <select id="servicoSelect" class="form-control" required>
                                <option value="">Selecionar serviço...</option>
                                ${this.servicos.map(s => `<option value="${s.id}">${s.nome} (€${s.preco})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="bookingNotes">Notas</label>
                            <textarea id="bookingNotes" class="form-control" rows="2" placeholder="Notas adicionais..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button id="createBookingBtn" class="btn btn-primary" style="display: none;" 
                            onclick="window.calendar.createBooking(${barbeiro.id}, '${dateTime}')">
                        Criar Reserva
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    searchClientsDebounced(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.searchClients(query), 300);
    }

    async searchClients(query) {
        const container = document.getElementById('clientSuggestions');
        if (!container) return;

        if (!query || query.length < 2) {
            container.innerHTML = '';
            document.getElementById('clientDataForm').style.display = 'none';
            document.getElementById('bookingForm').style.display = 'none';
            document.getElementById('createBookingBtn').style.display = 'none';
            return;
        }

        container.innerHTML = '<div class="client-suggestions-loading">🔍 A buscar...</div>';

        await this.loadClientes(query);

        const normalizedQuery = query.toLowerCase().trim();
        const matches = this.clientes.filter(c => 
            c.nome?.toLowerCase().includes(normalizedQuery) ||
            c.telefone?.includes(query) ||
            c.email?.toLowerCase().includes(normalizedQuery)
        ).slice(0, 5);

        if (matches.length > 0) {
            container.innerHTML = `
                <div class="client-suggestions-list">
                    ${matches.map(c => `
                        <div class="client-suggestion-item" onclick="window.calendar.selectClient(${c.id})">
                            <div class="client-suggestion-name">${c.nome}</div>
                            <div class="client-suggestion-contact">${c.email || c.telefone}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            document.getElementById('clientDataForm').style.display = 'none';
        } else {
            container.innerHTML = `<div class="client-suggestions-empty">Nenhum encontrado. Crie novo:</div>`;
            document.getElementById('clientDataForm').style.display = 'block';
            document.getElementById('clientName').value = query;
        }
    }

    selectClient(clientId) {
        const client = this.clientes.find(c => c.id == clientId);
        if (!client) return;

        document.getElementById('clientSearchInput').value = client.nome;
        document.getElementById('clientSuggestions').innerHTML = '';
        document.getElementById('clientDataForm').style.display = 'none';
        document.getElementById('bookingForm').style.display = 'block';
        document.getElementById('createBookingBtn').style.display = 'block';
        this.selectedClientId = clientId;
    }

    async createBooking(barbeiroId, dateTime) {
        const servicoId = document.getElementById('servicoSelect')?.value;
        const notes = document.getElementById('bookingNotes')?.value;

        let clientId = this.selectedClientId;
        
        if (!clientId) {
            const name = document.getElementById('clientName')?.value;
            const phone = document.getElementById('clientPhone')?.value;
            const email = document.getElementById('clientEmail')?.value;

            if (!name || !phone) {
                alert('Nome e telefone obrigatórios');
                return;
            }

            try {
                const response = await window.adminAPI.createCliente({ nome: name, telefone: phone, email });
                clientId = response.id || response.cliente?.id;
            } catch (error) {
                alert('Erro ao criar cliente: ' + error.message);
                return;
            }
        }

        if (!servicoId) {
            alert('Selecione um serviço');
            return;
        }

        try {
            const btn = document.getElementById('createBookingBtn');
            btn.disabled = true;
            btn.textContent = '⏳ A criar...';

            await window.adminAPI.createReserva({
                cliente_id: clientId,
                barbeiro_id: barbeiroId,
                servico_id: servicoId,
                data_hora: dateTime,
                comentario: notes
            });

            document.querySelector('.modal-overlay')?.remove();
            this.selectedClientId = null;
            await this.loadData();
            this.render();
            alert('✅ Reserva criada!');
        } catch (error) {
            alert('Erro: ' + error.message);
            document.getElementById('createBookingBtn').disabled = false;
            document.getElementById('createBookingBtn').textContent = 'Criar Reserva';
        }
    }

    showReservaModal(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);
        const dataHora = new Date(reserva.data_hora);
        const now = new Date();
        const hoursUntil = (dataHora - now) / (1000 * 60 * 60);
        const canModify = hoursUntil > 5 && reserva.status === 'confirmada';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content modal-details">
                <div class="modal-header">
                    <h3>Detalhes da Reserva #${reserva.id}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <strong>Cliente:</strong> ${reserva.cliente_nome}
                    </div>
                    <div class="detail-row">
                        <strong>Barbeiro:</strong> ${barbeiro?.nome || 'N/A'}
                    </div>
                    <div class="detail-row">
                        <strong>Serviço:</strong> ${servico?.nome || 'N/A'} (€${servico?.preco || '0'})
                    </div>
                    <div class="detail-row">
                        <strong>Data/Hora:</strong> ${this.formatDateTime(dataHora)}
                    </div>
                    <div class="detail-row">
                        <strong>Duração:</strong> ${servico?.duracao || '0'} min
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong> <span class="status-badge ${reserva.status}">${this.getStatusText(reserva.status)}</span>
                    </div>
                    ${reserva.comentario ? `
                    <div class="detail-row">
                        <strong>Notas:</strong> ${reserva.comentario}
                    </div>
                    ` : ''}
                    ${!canModify && hoursUntil > 0 && hoursUntil <= 5 ? `
                    <div class="detail-row alert-warning" style="margin-top: 15px;">
                        ⚠️ Não é possível modificar: menos de 5 horas de antecedência
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${canModify ? `
                    <button class="btn btn-danger" onclick="window.calendar.cancelReserva(${reserva.id})">Cancelar Reserva</button>
                    ` : ''}                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async cancelReserva(reservaId) {
        if (!confirm('Tem certeza?')) return;

        try {
            await window.adminAPI.updateReserva(reservaId, { status: 'cancelada' });
            document.querySelector('.modal-overlay')?.remove();
            await this.loadData();
            this.render();
            alert('✅ Reserva cancelada!');
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }

    // ===== HELPERS =====

    getStatusText(status) {
        const map = { 'confirmada': 'Confirmada', 'cancelada': 'Cancelada', 'concluida': 'Concluída' };
        return map[status] || status;
    }

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
console.log('📅 Calendar.js loading...');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendar = new CalendarManager();
    });
} else {
    window.calendar = new CalendarManager();
}

console.log('✅ Calendar module loaded');
