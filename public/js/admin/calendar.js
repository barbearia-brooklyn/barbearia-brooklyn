/**
 * Brooklyn Barbearia - Complete Calendar System with Context Menu
 */

class CalendarManager {
    constructor() {
        // Get current user info
        this.currentUser = this.getCurrentUser();
        
        // Restore previous date from sessionStorage or use today
        const savedDate = sessionStorage.getItem('calendarDate');
        this.currentDate = savedDate ? new Date(savedDate) : new Date();
        
        // For barbeiros, auto-select their own filter
        this.selectedStaffId = this.getInitialStaffFilter();
        
        this.barbeiros = [];
        this.servicos = [];
        this.reservas = [];
        this.horariosIndisponiveis = [];
        this.timeSlots = this.generateTimeSlots('09:00', '19:59', 15);  // 15min slots
        this.timeLabels = this.generateTimeSlots('09:00', '19:59', 30); // 30min labels
        this.contextMenu = null;
        this.init();
    }

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('admin_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            return null;
        }
    }

    getInitialStaffFilter() {
        // Se é barbeiro, auto-selecionar o próprio
        if (this.currentUser && this.currentUser.role === 'barbeiro' && this.currentUser.barbeiro_id) {
            console.log(`🧔 Barbeiro detectado - auto-selecionando: ${this.currentUser.barbeiro_id}`);
            return String(this.currentUser.barbeiro_id);
        }
        
        // Caso contrário, usar valor salvo ou 'all'
        return sessionStorage.getItem('calendarStaffId') || 'all';
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
            this.adjustUIForRole(); // Ajustar UI conforme role
            this.render();
            this.setupContextMenu();
        } catch (error) {
            console.error('❌ Calendar initialization error:', error);
            this.showError('Erro ao carregar calendário: ' + error.message + '. Experimente recarregar a página e verifique a ligação à internet. Em caso de erro persistente contacte de imediato o suporte.');
        }
    }

    adjustUIForRole() {
        // Se é barbeiro, ocultar a opção "Todos os Barbeiros"
        if (this.currentUser && this.currentUser.role === 'barbeiro') {
            const selector = document.getElementById('staffSelector');
            if (selector) {
                // Remover opção "Todos os Barbeiros"
                const allOption = selector.querySelector('option[value="all"]');
                if (allOption) {
                    allOption.remove();
                }
                
                // Desabilitar o selector (barbeiro só vê o próprio calendário)
                selector.disabled = true;
                selector.style.opacity = '0.7';
                selector.style.cursor = 'not-allowed';
                
                console.log('🔒 Filtro de barbeiro desabilitado para role=barbeiro');
            }
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
            
            // Filter out cancelled reservations
            const allReservas = reservasResponse.reservas || reservasResponse.data || reservasResponse || [];
            this.reservas = allReservas.filter(r => r.status !== 'cancelada');
            
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
                sessionStorage.setItem('calendarStaffId', e.target.value);
                this.render();
            });
        }
        
        // ✨ Bug #7 FIX: Date picker ao clicar na data
        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            dateDisplay.style.cursor = 'pointer';
            dateDisplay.title = 'Clique para selecionar uma data';
            dateDisplay.addEventListener('click', () => this.openDatePicker());
        }
    }
    
    // ✨ Bug #7 FIX: Abrir seletor de data
    openDatePicker() {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = this.currentDate.toISOString().split('T')[0];
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        
        input.addEventListener('change', (e) => {
            if (e.target.value) {
                this.currentDate = new Date(e.target.value + 'T12:00:00');
                this.loadData().then(() => this.render());
            }
            document.body.removeChild(input);
        });
        
        // Trigger native date picker
        input.showPicker();
    }

    // ===== CONTEXT MENU =====

    setupContextMenu() {
        // Remove any existing context menu
        if (this.contextMenu) {
            this.contextMenu.remove();
        }

        // Create context menu element
        this.contextMenu = document.createElement('div');
        this.contextMenu.id = 'calendarContextMenu';
        this.contextMenu.className = 'context-menu';
        this.contextMenu.style.display = 'none';
        document.body.appendChild(this.contextMenu);

        // Close menu on any click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.calendar-slot')) {
                this.hideContextMenu();
            }
        });

        // Close menu on scroll
        document.addEventListener('scroll', () => {
            this.hideContextMenu();
        }, true);
    }

    showEmptySlotContextMenu(event, barbeiroId, time) {
        event.preventDefault();
        event.stopPropagation();

        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const dateTime = `${this.currentDate.toISOString().split('T')[0]}T${time}:00`;

        this.contextMenu.innerHTML = `
            <div class="context-menu-item" onclick="window.calendar.openBookingModal(${barbeiroId}, '${time}')"><i class="fas fa-calendar-plus"></i> Nova Reserva
            </div>
            <div class="context-menu-item" onclick="window.calendar.openUnavailableModal(${barbeiroId}, '${dateTime}')"><i class="fas fa-ban"></i> Nova Indisponibilidade
            </div>
        `;

        this.positionContextMenu(event);
    }

    showReservaContextMenu(event, reservaId) {
        event.preventDefault();
        event.stopPropagation();

        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        this.contextMenu.innerHTML = `
            <div class="context-menu-item" onclick="window.calendar.showReservaModal(${reservaId})">
                <i class="fas fa-eye"></i> Ver Reserva
            </div>
            <div class="context-menu-item" onclick="window.calendar.editReservaFromContext(${reservaId})">
                <i class="fas fa-edit"></i> Editar Reserva
            </div>
            <div class="context-menu-item" onclick="window.calendar.copyReserva(${reservaId})">
                <i class="fas fa-copy"></i> Copiar Reserva
            </div>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
            <div class="context-menu-item" onclick="window.calendar.quickStatusChange(${reservaId}, 'concluida')">
                <i class="fas fa-check-circle" style="color: #28a745;"></i> Chegou
            </div>
            <div class="context-menu-item" onclick="window.calendar.quickStatusChange(${reservaId}, 'faltou')">
                <i class="fas fa-user-times" style="color: #ffc107;"></i> Faltou
            </div>
            <div class="context-menu-item" onclick="window.calendar.cancelReserva(${reservaId})">
                <i class="fas fa-times-circle" style="color: #dc3545;"></i> Cancelar Reserva
            </div>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
            <div class="context-menu-item" onclick="window.calendar.viewClient(${reserva.cliente_id})" style="color: #999;">
                <i class="fas fa-user"></i> Ver Cliente (em breve)
            </div>
        `;

        this.positionContextMenu(event);
    }

    positionContextMenu(event) {
        const menu = this.contextMenu;
        menu.style.display = 'block';

        // Calculate position
        let x = event.pageX;
        let y = event.pageY;

        // Adjust if menu goes off-screen
        const menuRect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (x + menuRect.width > windowWidth) {
            x = windowWidth - menuRect.width - 10;
        }

        if (y + menuRect.height > windowHeight + window.scrollY) {
            y = windowHeight + window.scrollY - menuRect.height - 10;
        }

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }

    // ===== UNAVAILABLE MODAL =====

    openUnavailableModal(barbeiroId, dateTime) {
        this.hideContextMenu();
        
        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const date = new Date(dateTime);
        const formattedDateTime = this.formatDateTime(date);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(':').slice(0, 2).join(':');

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'unavailableModal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nova Indisponibilidade - ${barbeiro.nome}</h3>
                    <button class="modal-close" onclick="window.calendar.closeUnavailableModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-time-display">
                        📅 ${formattedDateTime}
                    </div>
                    
                    <form id="unavailableForm" class="form-grid">
                        <div class="form-group form-group-full">
                            <label for="unavailableType" class="form-label required">Tipo</label>
                            <select id="unavailableType" class="form-control" required>
                                <option value="">Selecione o tipo...</option>
                                <option value="folga">Folga</option>
                                <option value="ferias">Férias</option>
                                <option value="ausencia">Ausência</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        
                        <div class="form-group form-group-full">
                            <label for="unavailableReason" class="form-label">Motivo</label>
                            <input type="text" id="unavailableReason" class="form-control" placeholder="Ex: Almoço, Reunião, etc.">
                        </div>
                        
                        <div class="form-group">
                            <label for="unavailableStartDate" class="form-label required">Data Início</label>
                            <input type="date" id="unavailableStartDate" class="form-control" value="${dateStr}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="unavailableStartTime" class="form-label required">Hora Início</label>
                            <input type="time" id="unavailableStartTime" class="form-control" value="${timeStr}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="unavailableEndDate" class="form-label required">Data Fim</label>
                            <input type="date" id="unavailableEndDate" class="form-control" value="${dateStr}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="unavailableEndTime" class="form-label required">Hora Fim</label>
                            <input type="time" id="unavailableEndTime" class="form-control" required>
                        </div>
                        
                        <div class="form-group form-group-full">
                            <label for="unavailableNotes" class="form-label">Notas</label>
                            <textarea id="unavailableNotes" class="form-control" rows="2" placeholder="Notas adicionais..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.calendar.closeUnavailableModal()">
                        Cancelar
                    </button>
                    <button id="createUnavailableBtn" class="btn btn-primary" onclick="window.calendar.createUnavailable(${barbeiroId})">
                        Criar Indisponibilidade
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Setup click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeUnavailableModal();
            }
        });

        // Auto-calculate end time (1 hour after start)
        const endTime = new Date(date.getTime() + 60 * 60 * 1000);
        document.getElementById('unavailableEndTime').value = endTime.toTimeString().split(':').slice(0, 2).join(':');
    }

    async createUnavailable(barbeiroId) {
        const tipo = document.getElementById('unavailableType')?.value;
        const reason = document.getElementById('unavailableReason')?.value;
        const startDate = document.getElementById('unavailableStartDate')?.value;
        const startTime = document.getElementById('unavailableStartTime')?.value;
        const endDate = document.getElementById('unavailableEndDate')?.value;
        const endTime = document.getElementById('unavailableEndTime')?.value;
        const notes = document.getElementById('unavailableNotes')?.value;

        if (!tipo || !startDate || !startTime || !endDate || !endTime) {
            alert('❌ Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const dataHoraInicio = `${startDate}T${startTime}:00`;
        const dataHoraFim = `${endDate}T${endTime}:00`;

        if (new Date(dataHoraFim) <= new Date(dataHoraInicio)) {
            alert('❌ A data/hora de fim deve ser posterior à data/hora de início');
            return;
        }

        try {
            const btn = document.getElementById('createUnavailableBtn');
            btn.disabled = true;
            btn.textContent = '⏳ A criar...';

            await window.adminAPI.createHorarioIndisponivel({
                barbeiro_id: barbeiroId,
                tipo: tipo,
                data_hora_inicio: dataHoraInicio,
                data_hora_fim: dataHoraFim,
                motivo: reason || null,
                notas: notes || null
            });

            this.closeUnavailableModal();
            alert('✅ Indisponibilidade criada com sucesso!');
            await this.loadData();
            this.render();

        } catch (error) {
            console.error('Error creating unavailability:', error);
            alert('❌ Erro ao criar indisponibilidade: ' + error.message);
            document.getElementById('createUnavailableBtn').disabled = false;
            document.getElementById('createUnavailableBtn').textContent = 'Criar Indisponibilidade';
        }
    }

    closeUnavailableModal() {
        const modal = document.getElementById('unavailableModal');
        if (modal) {
            modal.remove();
        }
    }

    // ===== COPY RESERVATION MODAL =====

    copyReserva(reservaId) {
        this.hideContextMenu();
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        // Show date/time/barber selection modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'copyReservaModal';

        const currentDate = this.currentDate.toISOString().split('T')[0];
        const currentReservaDate = new Date(reserva.data_hora);
        const currentTime = currentReservaDate.toTimeString().split(':').slice(0, 2).join(':');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Copiar Reserva</h3>
                    <button class="modal-close" onclick="window.calendar.closeCopyReservaModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; color: #666;">
                        Selecione a data, hora e barbeiro para a nova reserva:
                    </p>
                    
                    <form id="copyReservaForm" class="form-grid">
                        <div class="form-group">
                            <label for="copyReservaDate" class="form-label required">Data</label>
                            <input type="date" id="copyReservaDate" class="form-control" value="${currentDate}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="copyReservaTime" class="form-label required">Hora</label>
                            <input type="time" id="copyReservaTime" class="form-control" value="${currentTime}" required>
                        </div>
                        
                        <div class="form-group form-group-full">
                            <label for="copyReservaBarbeiro" class="form-label required">Barbeiro</label>
                            <select id="copyReservaBarbeiro" class="form-control" required>
                                ${this.barbeiros.map(b => `
                                    <option value="${b.id}" ${b.id == reserva.barbeiro_id ? 'selected' : ''}>
                                        ${b.nome}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.calendar.closeCopyReservaModal()">
                        Cancelar
                    </button>
                    <button class="btn btn-primary" onclick="window.calendar.confirmCopyReserva(${reservaId})">
                        <i class="fas fa-check"></i> Continuar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Setup click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCopyReservaModal();
            }
        });
    }

    confirmCopyReserva(reservaId) {
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const date = document.getElementById('copyReservaDate')?.value;
        const time = document.getElementById('copyReservaTime')?.value;
        const barbeiroId = parseInt(document.getElementById('copyReservaBarbeiro')?.value);

        if (!date || !time || !barbeiroId) {
            alert('❌ Por favor, preencha todos os campos');
            return;
        }

        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const dateTime = `${date}T${time}:00`;

        // Close copy modal
        this.closeCopyReservaModal();

        // Open booking modal with pre-filled data
        window.modalManager.openBookingModal(
            barbeiro,
            dateTime,
            this.servicos,
            () => this.loadData().then(() => this.render())
        );

        // Pre-select client and service
        setTimeout(() => {
            window.modalManager.selectClient(reserva.cliente_id, reserva.cliente_nome);
            document.getElementById('servicoSelect').value = reserva.servico_id;
            if (reserva.comentario) {
                document.getElementById('bookingNotes').value = reserva.comentario;
            }
        }, 100);
    }

    closeCopyReservaModal() {
        const modal = document.getElementById('copyReservaModal');
        if (modal) {
            modal.remove();
        }
    }

    // ===== CONTEXT MENU ACTIONS =====

    editReservaFromContext(reservaId) {
        this.hideContextMenu();
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);

        window.modalManager.showDetailsModal(
            reserva,
            barbeiro,
            servico,
            () => this.loadData().then(() => this.render())
        );

        // Auto-open edit form
        setTimeout(() => {
            window.modalManager.showEditForm(reserva);
        }, 100);
    }

    async quickStatusChange(reservaId, newStatus) {
        this.hideContextMenu();

        if (!confirm(`Confirma que deseja marcar esta reserva como "${newStatus === 'concluida' ? 'Concluída' : 'Faltou'}"?`)) {
            return;
        }

        try {
            await window.adminAPI.updateReserva(reservaId, { status: newStatus });
            alert(`✅ Status atualizado para "${newStatus === 'concluida' ? 'Concluída' : 'Faltou'}"!`);
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('❌ Erro ao atualizar status: ' + error.message);
        }
    }

    cancelReserva(reservaId) {
        this.hideContextMenu();
        const reserva = this.reservas.find(r => r.id == reservaId);
        if (!reserva) return;

        const barbeiro = this.barbeiros.find(b => b.id == reserva.barbeiro_id);
        const servico = this.servicos.find(s => s.id == reserva.servico_id);

        // Open details modal
        window.modalManager.showDetailsModal(
            reserva,
            barbeiro,
            servico,
            () => this.loadData().then(() => this.render())
        );

        // Auto-open status change form with "cancelada" pre-selected
        setTimeout(() => {
            const updatedReserva = { ...reserva, status: 'cancelada' };
            window.modalManager.showStatusChangeForm(updatedReserva);
            document.getElementById('statusSelect').value = 'cancelada';
            document.getElementById('statusSelect').dispatchEvent(new Event('change'));
        }, 100);
    }

    viewClient(clientId) {
        this.hideContextMenu();
        alert('🚧 Funcionalidade "Ver Cliente" em breve!');
        // TODO: Implement client view modal or redirect to client page
    }

    // ===== RENDER =====

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

        grid.style.gridTemplateColumns = `60px repeat(${this.barbeiros.length}, minmax(150px, 1fr))`;
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

    /**
     * ✨ Verifica se uma reserva tem notas reais (não apenas array vazio)
     */
    hasRealNotes(comentario) {
        if (!comentario) return false;
        
        // Tentar parsear como JSON
        try {
            const parsed = JSON.parse(comentario);
            // Se for array, verificar se tem elementos
            if (Array.isArray(parsed)) {
                return parsed.length > 0;
            }
            // Se for outro tipo JSON mas não vazio
            return true;
        } catch (e) {
            // Não é JSON, então é string simples
            // Verificar se tem conteúdo real (não apenas espaços)
            return comentario.trim().length > 0;
        }
    }

    renderSlot(barbeiroId, time, idx) {
        const reserva = this.findReservaForExactTime(barbeiroId, time);
        const bloqueado = this.findBloqueadoForSlot(barbeiroId, time);
        const slotType = this.getSlotType(time);

        // Check if there's a reservation that starts at an odd time (not on 15min boundary)
        const oddTimeReserva = this.findOddTimeReserva(barbeiroId, time);

        // Reservation starts here (exact match or calculated position for odd times)
        if (reserva || oddTimeReserva) {
            const res = reserva || oddTimeReserva;
            const servico = this.servicos.find(s => s.id == res.servico_id);
            
            // Usar duração customizada se existir, caso contrário usar duração do serviço
            const duracao = res.duracao_minutos || servico?.duracao || 30;

            const startTime = new Date(res.data_hora);
            const endTime = new Date(startTime.getTime() + duracao * 60000);
            const timeRange = `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;

            const servicoLabel = servico?.abreviacao || servico?.nome || 'Serviço';
            const headerText = `${this.truncate(res.cliente_nome, 25)}, ${servicoLabel}`;

            const bgColor = servico?.color || '#0f7e44';
            const textColor = this.getContrastColor(bgColor);

            // Indicators
            let indicators = '';
            if (res.created_by === 'online') {
                indicators += '<span class="booking-indicator booking-indicator-online" title="Reserva online">@</span>';
            }
            // ✨ FIX: Usar hasRealNotes() em vez de apenas verificar se existe
            if (this.hasRealNotes(res.comentario)) {
                indicators += '<span class="booking-indicator booking-indicator-note" title="Tem comentário">📝</span>';
            }

            // Calculate height and position
            const slotsOcupados = Math.max(1, Math.ceil(duracao / 15));
            const slotHeight = 20; // Height of each 15-min slot
            
            // Calculate vertical offset for odd time bookings
            let topOffset = 0;
            if (oddTimeReserva) {
                const minutes = startTime.getMinutes();
                const remainder = minutes % 15;
                topOffset = (remainder / 15) * slotHeight;
            }

            return `
                <div class="calendar-slot calendar-slot-with-booking" 
                     style="grid-row: span 1; position: relative;" 
                     data-slot-type="${slotType}"
                     data-reserva-id="${res.id}"
                     onclick="window.calendar.showReservaContextMenu(event, ${res.id})">
                    <div class="booking-card-absolute" 
                         style="height: ${(slotsOcupados * slotHeight)-2}px; top: ${topOffset}px; background: ${bgColor}; color: ${textColor};"
                         onclick="window.calendar.showReservaContextMenu(event, ${res.id})">
                        <div class="booking-card-header">${headerText}</div>
                        ${duracao > 15 ? `<div class="booking-card-time">${indicators}${timeRange}</div>` : `<div class="booking-card-time">${indicators}</div>`}
                    </div>
                </div>
            `;
        }
        
        // Inside existing reservation
        const isInsideReservation = this.isSlotInsideReservation(barbeiroId, time);
        if (isInsideReservation) {
            const reserva = this.findReservaForSlot(barbeiroId, time);
            return `<div class="calendar-slot calendar-slot-occupied" 
                         style="grid-row: span 1;" 
                         data-slot-type="${slotType}"
                         ${reserva ? `onclick="window.calendar.showReservaContextMenu(event, ${reserva.id})"` : ''}></div>`;
        }
        
        // Blocked time
        if (bloqueado) {
            return `<div class="calendar-slot blocked" 
                         style="grid-row: span 1;" 
                         data-slot-type="${slotType}"
                         onclick="window.calendar.showEmptySlotContextMenu(event, ${barbeiroId}, '${time}')"></div>`;
        }
        
        // Available slot
        return `<div class="calendar-slot" 
                     style="grid-row: span 1;" 
                     data-slot-type="${slotType}"
                     onclick="window.calendar.showEmptySlotContextMenu(event, ${barbeiroId}, '${time}')"></div>`;
    }

    // ===== MODAL INTEGRATION =====

    openBookingModal(barbeiroId, time) {
        this.hideContextMenu();
        const barbeiro = this.barbeiros.find(b => b.id == barbeiroId);
        if (!barbeiro) return;

        const dateTime = `${this.currentDate.toISOString().split('T')[0]}T${time}:00`;

        // Check if barbeiro is unavailable at this time
        const isUnavailable = this.horariosIndisponiveis.some(h => {
            if (h.barbeiro_id != barbeiroId) return false;
            const start = new Date(h.data_hora_inicio);
            const end = new Date(h.data_hora_fim);
            const selected = new Date(dateTime);
            return selected >= start && selected < end;
        });

        // Use centralized ModalManager
        window.modalManager.openBookingModal(
            barbeiro,
            dateTime,
            this.servicos,
            () => this.loadData().then(() => this.render())
        );

        // Show warning if unavailable
        if (isUnavailable) {
            setTimeout(() => {
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    const warning = document.createElement('div');
                    warning.className = 'alert-warning';
                    warning.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin-bottom: 15px;';
                    warning.innerHTML = '<strong style="color: #856404;">⚠️ Aviso:</strong> O barbeiro está indisponível no horário selecionado.';
                    modalBody.insertBefore(warning, modalBody.firstChild);
                }
            }, 100);
        }
    }

    showReservaModal(reservaId) {
        this.hideContextMenu();
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

    // ===== UTILITIES =====

    formatDateTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayName = days[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${dayName}, ${day}/${month}/${year} às ${hours}:${minutes}`;
    }

    getContrastColor(hexColor) {
        if (!hexColor) return '#ffffff';
        
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.6 ? '#333333' : '#ffffff';
    }

    findReservaForExactTime(barbeiroId, time) {
        return this.reservas.find(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            const reservaTime = this.formatTime(new Date(r.data_hora));
            return reservaTime === time;
        });
    }

    findOddTimeReserva(barbeiroId, time) {
        // Find reservations that start at odd times (not on 15min boundaries)
        return this.reservas.find(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            
            const reservaStart = new Date(r.data_hora);
            const reservaMinutes = reservaStart.getMinutes();
            
            // Check if not on 15min boundary
            if (reservaMinutes % 15 === 0) return false;
            
            // Find the 15min slot this odd time belongs to
            const [slotHour, slotMin] = time.split(':').map(Number);
            const slotTime = slotHour * 60 + slotMin;
            const reservaTime = reservaStart.getHours() * 60 + reservaMinutes;
            
            // Reservation should be rendered in the slot it falls within
            return reservaTime >= slotTime && reservaTime < slotTime + 15;
        });
    }

    findReservaForSlot(barbeiroId, time) {
        return this.reservas.find(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            
            const reservaStart = new Date(r.data_hora);
            const reservaStartTime = this.formatTime(reservaStart);
            
            const servico = this.servicos.find(s => s.id == r.servico_id);
            const duracao = r.duracao_minutos || servico?.duracao || 30;
            
            const reservaEnd = new Date(reservaStart.getTime() + duracao * 60000);
            const reservaEndTime = this.formatTime(reservaEnd);
            
            return time >= reservaStartTime && time < reservaEndTime;
        });
    }

    isSlotInsideReservation(barbeiroId, time) {
        return this.reservas.some(r => {
            if (r.barbeiro_id != barbeiroId) return false;
            
            const reservaStart = new Date(r.data_hora);
            const reservaStartTime = this.formatTime(reservaStart);
            
            const servico = this.servicos.find(s => s.id == r.servico_id);
            const duracao = r.duracao_minutos || servico?.duracao || 30;
            
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

    formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendar = new CalendarManager();
    });
} else {
    window.calendar = new CalendarManager();
}

console.log('✅ Calendar with Context Menu + Date Picker loaded');
