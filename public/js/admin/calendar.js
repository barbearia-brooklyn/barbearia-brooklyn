/**
 * Brooklyn Barbearia - Complete Calendar System
 * Full featured calendar matching Modelo_brooklyn_calendar.pdf
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
        this.timeSlots = this.generateTimeSlots('09:30', '21:00', 30);
        console.log('📅 About to call init()');
        this.init();
    }

    async init() {
        console.log('📅 Initializing Calendar Manager...');
        
        // Auth check non-blocking
        if (window.AuthManager) {
            const isAuth = window.AuthManager.checkAuth();
            console.log('🔒 Auth check result:', isAuth);
            if (!isAuth) {
                console.warn('⚠️ Not authenticated, but continuing anyway for debug');
            }
        } else {
            console.warn('⚠️ AuthManager not found, continuing anyway for debug');
        }

        try {
            console.log('🔄 Starting parallel loads...');
            await Promise.all([
                this.loadBarbeiros(),
                this.loadServicos(),
                this.loadClientes()
            ]);
            console.log('✅ Parallel loads complete');
            
            console.log('🔄 Loading calendar data...');
            await this.loadData();
            console.log('✅ Calendar data loaded');
            
            console.log('🔄 Setting up event listeners...');
            this.setupEventListeners();
            console.log('✅ Event listeners set up');
            
            console.log('🔄 Rendering calendar...');
            this.render();
            console.log('✅ Calendar rendered');
        } catch (error) {
            console.error('❌ Calendar initialization error:', error);
            this.showError('Erro ao carregar calendário: ' + error.message);
        }
    }

    async loadBarbeiros() {
        try {
            console.log('🔄 Loading barbeiros...');
            const response = await window.adminAPI.getBarbeiros();
            console.log('👨‍🦱 Barbeiros response:', response);
            this.barbeiros = response.barbeiros || response || [];
            console.log(`✅ ${this.barbeiros.length} barbeiros loaded`);
            
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
            console.log('🔄 Loading servicos...');
            const response = await window.adminAPI.getServicos();
            console.log('✂️ Servicos response:', response);
            this.servicos = response.servicos || response || [];
            console.log(`✅ ${this.servicos.length} serviços loaded`);
        } catch (error) {
            console.error('❌ Error loading servicos:', error);
            throw error;
        }
    }

    async loadClientes() {
        try {
            console.log('🔄 Loading clientes...');
            const response = await window.adminAPI.getClientes();
            console.log('👥 Clientes response:', response);
            this.clientes = response.clientes || response || [];
            console.log(`✅ ${this.clientes.length} clientes loaded`);
        } catch (error) {
            console.error('❌ Error loading clientes:', error);
            throw error;
        }
    }

    async loadData() {
        try {
            const dateStr = this.currentDate.toISOString().split('T')[0];
            console.log('🔄 Loading data for date:', dateStr);
            
            console.log('🔄 Fetching reservas and indisponiveis...');
            const [reservasResponse, indisponiveisResponse] = await Promise.all([
                window.adminAPI.getReservas({ data_inicio: dateStr, data_fim: dateStr }),
                window.adminAPI.getHorariosIndisponiveis({ data_inicio: dateStr, data_fim: dateStr })
            ]);
            
            console.log('📌 Reservas response:', reservasResponse);
            console.log('⛔ Indisponiveis response:', indisponiveisResponse);
            
            this.reservas = reservasResponse.reservas || reservasResponse.data || reservasResponse || [];
            this.horariosIndisponiveis = indisponiveisResponse.horarios || indisponiveisResponse.data || indisponiveisResponse || [];
            
            console.log(`✅ ${this.reservas.length} reservas | ⛔ ${this.horariosIndisponiveis.length} bloqueios`);
        } catch (error) {
            console.error('❌ Error loading calendar data:', error);
            this.reservas = [];
            this.horariosIndisponiveis = [];
        }
    }

    setupEventListeners() {
        console.log('🔄 Setting up event listeners...');
        
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                console.log('📅 Today button clicked');
                this.currentDate = new Date();
                this.loadData().then(() => this.render());
            });
        }

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('⬅️ Previous day clicked');
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                this.loadData().then(() => this.render());
            });
        }

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('➡️ Next day clicked');
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                this.loadData().then(() => this.render());
            });
        }

        const staffSelector = document.getElementById('staffSelector');
        if (staffSelector) {
            staffSelector.addEventListener('change', (e) => {
                console.log('👨‍🦱 Staff changed to:', e.target.value);
                this.selectedStaffId = e.target.value;
                this.render();
            });
        }
        
        console.log('✅ Event listeners setup complete');
    }

    render() {
        console.log('🎨 Rendering calendar...');
        this.updateDateDisplay();
        
        if (this.selectedStaffId === 'all') {
            this.renderAllStaffView();
        } else {
            this.renderSingleStaffView();
        }
        console.log('✅ Render complete');
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
        if (!grid) {
            console.error('❌ calendarGrid element not found!');
            return;
        }

        console.log(`🎨 Rendering all staff view for ${this.barbeiros.length} barbeiros`);
        grid.style.gridTemplateColumns = `80px repeat(${this.barbeiros.length}, minmax(140px, 1fr))`;

        let html = '';
        html += '<div class="calendar-header-cell" style="grid-column: 1;">Hora</div>';
        this.barbeiros.forEach(b => {
            html += `<div class="calendar-header-cell">${b.nome}</div>`;
        });

        this.timeSlots.forEach(time => {
            html += `<div class="calendar-time-cell">${time}</div>`;
            this.barbeiros.forEach(b => {
                html += this.renderSlot(b.id, time);
            });
        });

        grid.innerHTML = html;
        console.log('✅ All staff view rendered');
    }

    renderSingleStaffView() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) {
            console.error('❌ calendarGrid element not found!');
            return;
        }

        const barbeiro = this.barbeiros.find(b => b.id == this.selectedStaffId);
        if (!barbeiro) {
            console.error('❌ Barbeiro not found:', this.selectedStaffId);
            return;
        }

        console.log(`🎨 Rendering single staff view for ${barbeiro.nome}`);
        grid.style.gridTemplateColumns = '80px 1fr';

        let html = '';
        html += '<div class="calendar-header-cell">Hora</div>';
        html += `<div class="calendar-header-cell">${barbeiro.nome}</div>`;

        this.timeSlots.forEach(time => {
            html += `<div class="calendar-time-cell">${time}</div>`;
            html += this.renderSlot(barbeiro.id, time);
        });

        grid.innerHTML = html;
        console.log('✅ Single staff view rendered');
    }

    renderSlot(barbeiroId, time) {
        const reserva = this.findReservaForSlot(barbeiroId, time);
        const bloqueado = this.findBloqueadoForSlot(barbeiroId, time);

        if (reserva) {
            return `
                <div class="calendar-slot has-booking" onclick="window.calendar.viewReserva(${reserva.id})">
                    <div class="booking-card">
                        <div class="booking-card-name">${this.truncate(reserva.cliente_nome, 18)}</div>
                        <div class="booking-card-service">${this.truncate(reserva.servico_nome || 'Serviço', 16)}</div>
                    </div>
                </div>
            `;
        }
        
        if (bloqueado) {
            return `
                <div class="calendar-slot">
                    <div class="blocked-time">Indisponível</div>
                </div>
            `;
        }
        
        return `<div class="calendar-slot" onclick="window.calendar.openBookingModal(${barbeiroId}, '${time}')"></div>`;
    }

    // ===== BOOKING MODAL =====

    openBookingModal(barbeiroId, time) {
        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const dateTime = `${this.currentDate.toISOString().split('T')[0]} ${time}:00`;

        // Create modal
        const modal = this.createBookingModal(barbeiro, dateTime);
        document.body.appendChild(modal);

        // Focus on client search
        setTimeout(() => {
            document.getElementById('clientSearchInput')?.focus();
        }, 100);
    }

    createBookingModal(barbeiro, dateTime) {
        const modal = document.createElement('div');
        modal.className = 'calendar-modal-overlay';
        modal.innerHTML = `
            <div class="calendar-modal">
                <div class="calendar-modal-header">
                    <h3>${barbeiro.nome} @ ${dateTime.split(' ')[1].slice(0,5)} - ${this.formatModalDate()}</h3>
                    <button class="calendar-modal-close" onclick="this.closest('.calendar-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="calendar-modal-body">
                    <div class="calendar-modal-section">
                        <h4>Cliente</h4>
                        <input type="text" 
                               id="clientSearchInput" 
                               class="calendar-input" 
                               placeholder="Nome, telefone ou email"
                               oninput="window.calendar.searchClients(this.value)">
                        <div id="clientSuggestions" class="client-suggestions"></div>
                    </div>

                    <div id="clientDataForm" style="display: none;">
                        <div class="calendar-modal-section">
                            <label>Nome Completo</label>
                            <input type="text" id="clientName" class="calendar-input" required>
                        </div>
                        <div class="calendar-modal-section">
                            <label>Telefone</label>
                            <input type="tel" id="clientPhone" class="calendar-input" placeholder="+351" required>
                        </div>
                        <div class="calendar-modal-section">
                            <label>Email</label>
                            <input type="email" id="clientEmail" class="calendar-input">
                        </div>
                    </div>

                    <div id="bookingForm" style="display: none;">
                        <div class="calendar-modal-section">
                            <h4>Serviço</h4>
                            <select id="servicoSelect" class="calendar-input" required>
                                <option value="">Selecionar serviço...</option>
                                ${this.servicos.map(s => `<option value="${s.id}">${s.nome} (€${s.preco})</option>`).join('')}
                            </select>
                        </div>
                        <div class="calendar-modal-section">
                            <label>Notas</label>
                            <textarea id="bookingNotes" class="calendar-input" rows="2" placeholder="Notas adicionais..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="calendar-modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.calendar-modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button id="createBookingBtn" class="btn btn-primary" style="display: none;" 
                            onclick="window.calendar.createBooking(${barbeiro.id}, '${dateTime}')">
                        <i class="fas fa-check"></i> Criar Reserva
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    searchClients(query) {
        const container = document.getElementById('clientSuggestions');
        if (!container) return;

        if (!query || query.length < 2) {
            container.innerHTML = '';
            document.getElementById('clientDataForm').style.display = 'none';
            document.getElementById('bookingForm').style.display = 'none';
            document.getElementById('createBookingBtn').style.display = 'none';
            return;
        }

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
            container.innerHTML = `
                <div class="client-suggestions-empty">
                    <p>Nenhum cliente encontrado. Preencha os dados abaixo:</p>
                </div>
            `;
            document.getElementById('clientDataForm').style.display = 'block';
            document.getElementById('clientName').value = query;
        }
    }

    selectClient(clientId) {
        const client = this.clientes.find(c => c.id == clientId);
        if (!client) return;

        // Update search input
        document.getElementById('clientSearchInput').value = client.nome;
        
        // Clear suggestions
        document.getElementById('clientSuggestions').innerHTML = '';
        
        // Hide client data form
        document.getElementById('clientDataForm').style.display = 'none';
        
        // Show booking form
        document.getElementById('bookingForm').style.display = 'block';
        document.getElementById('createBookingBtn').style.display = 'block';
        
        // Store selected client
        this.selectedClientId = clientId;
    }

    async createBooking(barbeiroId, dateTime) {
        const servicoId = document.getElementById('servicoSelect')?.value;
        const notes = document.getElementById('bookingNotes')?.value;

        // Check if client is selected or new
        let clientId = this.selectedClientId;
        
        if (!clientId) {
            // Create new client
            const name = document.getElementById('clientName')?.value;
            const phone = document.getElementById('clientPhone')?.value;
            const email = document.getElementById('clientEmail')?.value;

            if (!name || !phone) {
                alert('Por favor, preencha nome e telefone do cliente');
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
            alert('Por favor, selecione um serviço');
            return;
        }

        // Create booking
        try {
            const btn = document.getElementById('createBookingBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar...';

            await window.adminAPI.createReserva({
                cliente_id: clientId,
                barbeiro_id: barbeiroId,
                servico_id: servicoId,
                data_hora: dateTime,
                notas: notes
            });

            document.querySelector('.calendar-modal-overlay')?.remove();
            await this.loadData();
            this.render();
            
            alert('✅ Reserva criada com sucesso!');
        } catch (error) {
            alert('Erro ao criar reserva: ' + error.message);
            document.getElementById('createBookingBtn').disabled = false;
            document.getElementById('createBookingBtn').innerHTML = '<i class="fas fa-check"></i> Criar Reserva';
        }
    }

    viewReserva(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;
        
        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        alert(`Reserva #${reserva.id}\n\nCliente: ${reserva.cliente_nome}\nBarbeiro: ${barbeiro?.nome}\nServiço: ${reserva.servico_nome}\nData/Hora: ${new Date(reserva.data_hora).toLocaleString('pt-PT')}\nStatus: ${reserva.status}\n\n(Detalhes completos em desenvolvimento)`);
    }

    // ===== HELPERS =====

    formatModalDate() {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return `${days[this.currentDate.getDay()]} ${this.currentDate.getDate()}`;
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

    findReservaForSlot(barbeiroId, time) {
        return this.reservas.find(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            const reservaTime = new Date(r.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
            return reservaTime === time;
        });
    }

    findBloqueadoForSlot(barbeiroId, time) {
        return this.horariosIndisponiveis.find(h => {
            if (h.barbeiro_id != barbeiroId) return false;
            const start = new Date(h.data_hora_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
            const end = new Date(h.data_hora_fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
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
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>${message}</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Recarregar
                    </button>
                </div>
            `;
        }
    }
}

// Initialize
console.log('📅 Calendar.js loading...');
if (document.readyState === 'loading') {
    console.log('📅 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📅 DOMContentLoaded fired, creating CalendarManager...');
        window.calendar = new CalendarManager();
    });
} else {
    console.log('📅 Document already loaded, creating CalendarManager immediately...');
    window.calendar = new CalendarManager();
}

console.log('✅ Calendar module loaded');
