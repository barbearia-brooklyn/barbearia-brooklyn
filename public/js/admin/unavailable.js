/**
 * Brooklyn Barbearia - Unavailable Manager
 * Manages unavailable time slots with recurrence support
 */

class Unavailable {
    constructor() {
        this.horarios = [];
        this.barbeiros = [];
        this.currentInstanceId = null;
        this.currentSingleId = null;
        this.filters = {
            barbeiro_id: '',
            tipo: '',
            data_inicio: '',
            data_fim: ''
        };
        this.init();
    }

    async init() {
        console.log('🚫 Initializing Unavailable Manager...');
        
        if (typeof AuthManager !== 'undefined' && !AuthManager.checkAuth()) {
            console.warn('⚠️ Auth check failed');
        }

        try {
            await this.loadBarbeiros();
            this.setupFilters();
            this.setupEventListeners();
            await this.loadHorarios();
            this.render();
        } catch (error) {
            console.error('Unavailable initialization error:', error);
            this.showError('Erro ao carregar horários indisponíveis: ' + error.message);
        }
    }

    setupFilters() {
        // Filtro por defeito: de hoje em diante
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filterDateStart').value = today;
        this.filters.data_inicio = today;

        // Popular filtro de barbeiros
        const filterBarber = document.getElementById('filterBarber');
        this.barbeiros.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            filterBarber.appendChild(option);
        });

        // Event listeners para filtros
        document.getElementById('applyDateFilter')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearDateFilter')?.addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('filterBarber')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterType')?.addEventListener('change', () => {
            this.applyFilters();
        });
    }

    async applyFilters() {
        const startDate = document.getElementById('filterDateStart').value;
        const endDate = document.getElementById('filterDateEnd').value;
        const barbeiroId = document.getElementById('filterBarber').value;
        const tipo = document.getElementById('filterType').value;

        if (startDate && endDate && startDate > endDate) {
            alert('A data de início deve ser anterior à data de fim');
            return;
        }

        this.filters.data_inicio = startDate;
        this.filters.data_fim = endDate;
        this.filters.barbeiro_id = barbeiroId;
        this.filters.tipo = tipo;

        console.log('🔍 Aplicando filtros:', this.filters);
        await this.loadHorarios();
        this.render();
    }

    clearFilters() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filterDateStart').value = today;
        document.getElementById('filterDateEnd').value = '';
        document.getElementById('filterBarber').value = '';
        document.getElementById('filterType').value = '';
        
        this.filters = {
            barbeiro_id: '',
            tipo: '',
            data_inicio: today,
            data_fim: ''
        };

        this.loadHorarios();
        this.render();
    }

    setupEventListeners() {
        // Botão adicionar
        document.getElementById('addUnavailableBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });

        // Guardar horário
        document.getElementById('saveUnavailableBtn')?.addEventListener('click', () => {
            this.saveUnavailable();
        });

        // Guardar instância
        document.getElementById('saveInstanceBtn')?.addEventListener('click', () => {
            this.saveInstance();
        });

        // Guardar horário simples
        document.getElementById('saveSingleBtn')?.addEventListener('click', () => {
            this.saveSingle();
        });

        // Checkbox "Todo o dia"
        document.getElementById('isAllDay')?.addEventListener('change', (e) => {
            this.toggleAllDay(e.target.checked);
        });

        document.getElementById('singleIsAllDay')?.addEventListener('change', (e) => {
            this.toggleSingleAllDay(e.target.checked);
        });

        // Tipo de recorrência
        document.getElementById('recurrenceType')?.addEventListener('change', (e) => {
            this.toggleRecurrenceEnd(e.target.value);
        });

        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
                this.closeGroupModal();
                this.closeEditInstanceModal();
                this.closeEditSingleModal();
            });
        });
    }

    toggleAllDay(isAllDay) {
        const startTimeGroup = document.getElementById('startTimeGroup');
        const endTimeGroup = document.getElementById('endTimeGroup');
        const startTimeInput = document.getElementById('unavailableStartTime');
        const endTimeInput = document.getElementById('unavailableEndTime');

        if (isAllDay) {
            startTimeGroup.style.display = 'none';
            endTimeGroup.style.display = 'none';
            startTimeInput.required = false;
            endTimeInput.required = false;
            startTimeInput.value = '09:00';
            endTimeInput.value = '20:00';
        } else {
            startTimeGroup.style.display = 'block';
            endTimeGroup.style.display = 'block';
            startTimeInput.required = true;
            endTimeInput.required = true;
        }
    }

    toggleSingleAllDay(isAllDay) {
        const startTimeGroup = document.getElementById('singleStartTimeGroup');
        const endTimeGroup = document.getElementById('singleEndTimeGroup');
        const startTimeInput = document.getElementById('singleStartTime');
        const endTimeInput = document.getElementById('singleEndTime');

        if (isAllDay) {
            startTimeGroup.style.display = 'none';
            endTimeGroup.style.display = 'none';
            startTimeInput.required = false;
            endTimeInput.required = false;
            startTimeInput.value = '09:00';
            endTimeInput.value = '20:00';
        } else {
            startTimeGroup.style.display = 'block';
            endTimeGroup.style.display = 'block';
            startTimeInput.required = true;
            endTimeInput.required = true;
        }
    }

    toggleRecurrenceEnd(recurrenceType) {
        const recurrenceEndGroup = document.getElementById('recurrenceEndGroup');
        const recurrenceEndInput = document.getElementById('recurrenceEndDate');

        if (recurrenceType !== 'none') {
            recurrenceEndGroup.style.display = 'block';
            recurrenceEndInput.required = false;
        } else {
            recurrenceEndGroup.style.display = 'none';
            recurrenceEndInput.required = false;
            recurrenceEndInput.value = '';
        }
    }

    async loadBarbeiros() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbeiros = response.barbeiros || response || [];
            console.log(`👨‍🦱 ${this.barbeiros.length} barbeiros carregados`);
        } catch (error) {
            console.error('Error loading barbeiros:', error);
            this.barbeiros = [];
        }
    }

    async loadHorarios() {
        try {
            const params = {
                grouped: 'true'
            };

            // Aplicar filtros
            if (this.filters.barbeiro_id) {
                params.barbeiroId = this.filters.barbeiro_id;
            }
            if (this.filters.data_inicio) {
                params.fromDate = this.filters.data_inicio;
            }
            if (this.filters.data_fim) {
                params.toDate = this.filters.data_fim;
            }
            
            console.log('📦 Loading com params:', params);
            
            const response = await window.adminAPI.getHorariosIndisponiveis(params);
            let horarios = response.horarios || response.data || response || [];

            // Filtrar por tipo no frontend (pois backend não tem esse filtro)
            if (this.filters.tipo) {
                horarios = horarios.filter(h => h.tipo === this.filters.tipo);
            }

            this.horarios = Array.isArray(horarios) ? horarios : [];
            
            console.log(`🚫 ${this.horarios.length} horários indisponíveis carregados`);
        } catch (error) {
            console.error('Error loading horarios:', error);
            this.horarios = [];
            throw error;
        }
    }

    showAddModal() {
        const modal = document.getElementById('unavailableModal');
        const select = document.getElementById('unavailableBarber');

        // Popular barbeiros
        select.innerHTML = '<option value="">Selecione um barbeiro</option>';
        this.barbeiros.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            select.appendChild(option);
        });

        // Limpar form
        document.getElementById('unavailableForm').reset();
        
        // Reset checkboxes
        document.getElementById('isAllDay').checked = false;
        this.toggleAllDay(false);
        
        document.getElementById('recurrenceType').value = 'none';
        this.toggleRecurrenceEnd('none');

        // Limpar edit mode
        delete modal.dataset.editMode;
        delete modal.dataset.groupId;

        document.getElementById('modalTitle').textContent = 'Adicionar Horário Indisponível';
        modal.style.display = 'flex';
    }

    closeModal() {
        document.getElementById('unavailableModal').style.display = 'none';
    }

    closeGroupModal() {
        document.getElementById('groupDetailsModal').style.display = 'none';
    }

    closeEditInstanceModal() {
        document.getElementById('editInstanceModal').style.display = 'none';
        this.currentInstanceId = null;
    }

    closeEditSingleModal() {
        document.getElementById('editSingleModal').style.display = 'none';
        this.currentSingleId = null;
    }

    async saveUnavailable() {
        const form = document.getElementById('unavailableForm');
        
        if (!form.checkValidity()) {
            alert('Preencha todos os campos obrigatórios');
            form.reportValidity();
            return;
        }

        const modal = document.getElementById('unavailableModal');
        const editMode = modal.dataset.editMode;
        const groupId = modal.dataset.groupId;

        const isAllDay = document.getElementById('isAllDay').checked;
        const recurrenceType = document.getElementById('recurrenceType').value;
        const recurrenceEndDate = document.getElementById('recurrenceEndDate').value;

        const startTime = isAllDay ? '09:00' : document.getElementById('unavailableStartTime').value;
        const endTime = isAllDay ? '20:00' : document.getElementById('unavailableEndTime').value;
        const startDate = document.getElementById('unavailableStartDate').value;

        const data = {
            barbeiro_id: parseInt(document.getElementById('unavailableBarber').value),
            tipo: document.getElementById('unavailableType').value,
            data_hora_inicio: `${startDate}T${startTime}:00`,
            data_hora_fim: `${startDate}T${endTime}:00`,
            motivo: document.getElementById('unavailableReason').value || null,
            is_all_day: isAllDay ? 1 : 0,
            recurrence_type: recurrenceType,
            recurrence_end_date: recurrenceEndDate || null
        };

        if (new Date(data.data_hora_fim) <= new Date(data.data_hora_inicio)) {
            alert('A hora de fim deve ser posterior à hora de início');
            return;
        }

        try {
            const btn = document.getElementById('saveUnavailableBtn');
            btn.disabled = true;
            btn.textContent = '⏳ A guardar...';

            let response;
            if (editMode === 'group' && groupId) {
                response = await window.adminAPI.updateHorarioIndisponivelGroup(groupId, data);
            } else {
                response = await window.adminAPI.createHorarioIndisponivel(data);
            }

            const message = editMode === 'group' 
                ? 'Série de horários indisponíveis atualizada com sucesso!' 
                : (recurrenceType !== 'none' 
                    ? 'Horários indisponíveis criados com recorrência!' 
                    : 'Horário indisponível criado!');

            alert(message);
            
            delete modal.dataset.editMode;
            delete modal.dataset.groupId;
            
            this.closeModal();
            await this.loadHorarios();
            this.render();

        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao guardar horário indisponível: ' + error.message);
        } finally {
            const btn = document.getElementById('saveUnavailableBtn');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        }
    }

    async saveInstance() {
        if (!this.currentInstanceId) return;

        const form = document.getElementById('editInstanceForm');
        if (!form.checkValidity()) {
            alert('Preencha todos os campos obrigatórios');
            form.reportValidity();
            return;
        }

        const startDate = document.getElementById('instanceDate').value;
        const startTime = document.getElementById('instanceStartTime').value;
        const endTime = document.getElementById('instanceEndTime').value;

        const data = {
            tipo: document.getElementById('instanceType').value,
            data_hora_inicio: `${startDate}T${startTime}:00`,
            data_hora_fim: `${startDate}T${endTime}:00`,
            motivo: document.getElementById('instanceReason').value || null
        };

        if (new Date(data.data_hora_fim) <= new Date(data.data_hora_inicio)) {
            alert('A hora de fim deve ser posterior à hora de início');
            return;
        }

        try {
            const btn = document.getElementById('saveInstanceBtn');
            btn.disabled = true;
            btn.textContent = '⏳ A guardar...';

            await window.adminAPI.updateHorarioIndisponivel(this.currentInstanceId, data);
            alert('Instância atualizada com sucesso!');
            
            this.closeEditInstanceModal();
            this.closeGroupModal();
            await this.loadHorarios();
            this.render();

        } catch (error) {
            console.error('Error saving instance:', error);
            alert('Erro ao guardar instância: ' + error.message);
        } finally {
            const btn = document.getElementById('saveInstanceBtn');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        }
    }

    async saveSingle() {
        if (!this.currentSingleId) return;

        const form = document.getElementById('editSingleForm');
        if (!form.checkValidity()) {
            alert('Preencha todos os campos obrigatórios');
            form.reportValidity();
            return;
        }

        const isAllDay = document.getElementById('singleIsAllDay').checked;
        const startDate = document.getElementById('singleStartDate').value;
        const startTime = isAllDay ? '09:00' : document.getElementById('singleStartTime').value;
        const endTime = isAllDay ? '20:00' : document.getElementById('singleEndTime').value;

        const data = {
            barbeiro_id: parseInt(document.getElementById('singleBarber').value),
            tipo: document.getElementById('singleType').value,
            data_hora_inicio: `${startDate}T${startTime}:00`,
            data_hora_fim: `${startDate}T${endTime}:00`,
            motivo: document.getElementById('singleReason').value || null,
            is_all_day: isAllDay ? 1 : 0
        };

        if (new Date(data.data_hora_fim) <= new Date(data.data_hora_inicio)) {
            alert('A hora de fim deve ser posterior à hora de início');
            return;
        }

        try {
            const btn = document.getElementById('saveSingleBtn');
            btn.disabled = true;
            btn.textContent = '⏳ A guardar...';

            await window.adminAPI.updateHorarioIndisponivel(this.currentSingleId, data);
            alert('Horário indisponível atualizado com sucesso!');
            
            this.closeEditSingleModal();
            await this.loadHorarios();
            this.render();

        } catch (error) {
            console.error('Error saving single:', error);
            alert('Erro ao guardar horário: ' + error.message);
        } finally {
            const btn = document.getElementById('saveSingleBtn');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        }
    }

    render() {
        const container = document.getElementById('unavailableContainer');
        if (!container) return;

        if (this.horarios.length === 0) {
            container.innerHTML = `
                <div class="unavailable-empty">
                    <div class="unavailable-empty-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <h3>Sem horários indisponíveis</h3>
                    <p>Não existem horários indisponíveis registados para os filtros selecionados.</p>
                </div>
            `;
            return;
        }

        const grupos = {};
        this.horarios.forEach(h => {
            const key = h.recurrence_group_id || `single_${h.id}`;
            if (!grupos[key]) {
                grupos[key] = [];
            }
            grupos[key].push(h);
        });

        console.log(`📦 ${Object.keys(grupos).length} grupos encontrados`);

        let html = '<div class="unavailable-list">';
        
        Object.keys(grupos).forEach(groupId => {
            const instancias = grupos[groupId];
            const firstInstance = instancias[0];
            const barbeiro = this.barbeiros.find(b => b.id == firstInstance.barbeiro_id);

            const tipoIcons = {
                folga: 'fa-umbrella-beach',
                almoco: 'fa-utensils',
                ferias: 'fa-plane-departure',
                ausencia: 'fa-user-slash',
                outro: 'fa-ban'
            };

            const tipoLabels = {
                folga: 'Folga',
                almoco: 'Almoço',
                ferias: 'Férias',
                ausencia: 'Ausência',
                outro: 'Outro'
            };

            const icon = tipoIcons[firstInstance.tipo] || 'fa-ban';
            const label = tipoLabels[firstInstance.tipo] || 'Outro';
            const isGroup = instancias.length > 1 || firstInstance.recurrence_group_id;

            const dataInicio = new Date(firstInstance.data_hora_inicio);
            const dataFim = new Date(firstInstance.data_hora_fim);

            html += `
                <div class="unavailable-item ${isGroup ? 'group-item' : ''}" 
                     onclick="window.unavailableManager.${isGroup ? `showGroupDetails('${groupId}')` : `showSingleDetails(${firstInstance.id})`}">
                    <div class="unavailable-icon ${firstInstance.tipo}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="unavailable-details">
                        <div class="unavailable-details-columns">
                            <div class="unavailable-header">
                                ${label} - ${barbeiro?.nome || 'N/A'}
                                ${isGroup ? ` <span style="color: var(--primary-green); font-weight: 600;">(${instancias.length} ocorrências)</span>` : ''}
                            </div>
                            <div class="unavailable-dates">
                                ${dataInicio.toLocaleDateString('pt-PT')} • 
                                ${dataInicio.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - 
                                ${dataFim.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            ${firstInstance.motivo ? `<div class="unavailable-reason">${firstInstance.motivo}</div>` : ''}
                        </div>
                    </div>
                    <div class="unavailable-actions" onclick="event.stopPropagation();">
                        ${isGroup ? `
                            <button class="btn btn-small btn-secondary" onclick="window.unavailableManager.showGroupDetails('${groupId}')">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        ` : `
                            <button class="btn btn-small btn-secondary" onclick="window.unavailableManager.editSingle(${firstInstance.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-small btn-danger" onclick="window.unavailableManager.deleteSingle(${firstInstance.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        `}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    showGroupDetails(groupId) {
        const instancias = this.horarios.filter(h => 
            (h.recurrence_group_id || `single_${h.id}`) === groupId
        );

        console.log(`🔍 Mostrando detalhes do grupo ${groupId}:`, instancias);

        if (instancias.length === 0) return;

        const firstInstance = instancias[0];
        const barbeiro = this.barbeiros.find(b => b.id == firstInstance.barbeiro_id);

        const tipoLabels = {
            folga: 'Folga',
            almoco: 'Almoço',
            ferias: 'Férias',
            ausencia: 'Ausência',
            outro: 'Outro'
        };

        const modal = document.getElementById('groupDetailsModal');
        const infoContent = document.getElementById('groupInfoContent');
        const instancesList = document.getElementById('groupInstancesList');

        infoContent.innerHTML = `
            <div class="group-info-main">
            <p><strong>Tipo:</strong> ${tipoLabels[firstInstance.tipo]}</p>
            <p><strong>Barbeiro:</strong> ${barbeiro?.nome || 'N/A'}</p></div>
            ${firstInstance.motivo ? `<p><strong>Motivo:</strong> ${firstInstance.motivo}</p>` : ''}
            <p><strong>Total de ocorrências:</strong> ${instancias.length}</p>
        `;

        instancesList.innerHTML = '';
        
        instancias.sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
        
        instancias.forEach(instance => {
            const inicio = new Date(instance.data_hora_inicio);
            const fim = new Date(instance.data_hora_fim);

            const card = document.createElement('div');
            card.className = 'instance-item';
            card.innerHTML = `
                <div class="instance-info">
                    <div class="instance-date">
                        ${inicio.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div class="instance-time">
                        ${inicio.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - 
                        ${fim.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div class="instance-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.unavailableManager.editInstance(${instance.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.unavailableManager.deleteInstance(${instance.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            instancesList.appendChild(card);
        });

        this.currentGroupId = groupId;
        this.currentGroup = instancias;

        modal.style.display = 'flex';

        const editGroupBtn = document.getElementById('editGroupBtn');
        editGroupBtn.onclick = () => this.editGroup(groupId);
    }

    editGroup(groupId) {
        const instancias = this.horarios.filter(h => 
            (h.recurrence_group_id || `single_${h.id}`) === groupId
        );

        if (instancias.length === 0) return;

        const firstInstance = instancias[0];
        const modal = document.getElementById('unavailableModal');

        const select = document.getElementById('unavailableBarber');
        select.innerHTML = '';
        this.barbeiros.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            if (barbeiro.id == firstInstance.barbeiro_id) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        document.getElementById('unavailableType').value = firstInstance.tipo;
        document.getElementById('unavailableReason').value = firstInstance.motivo || '';

        const dataInicio = new Date(firstInstance.data_hora_inicio);
        const dataFim = new Date(firstInstance.data_hora_fim);

        document.getElementById('unavailableStartDate').value = dataInicio.toISOString().split('T')[0];

        if (firstInstance.is_all_day) {
            document.getElementById('isAllDay').checked = true;
            this.toggleAllDay(true);
        } else {
            document.getElementById('isAllDay').checked = false;
            document.getElementById('unavailableStartTime').value = dataInicio.toTimeString().substring(0, 5);
            document.getElementById('unavailableEndTime').value = dataFim.toTimeString().substring(0, 5);
            this.toggleAllDay(false);
        }

        document.getElementById('recurrenceType').value = firstInstance.recurrence_type || 'none';
        if (firstInstance.recurrence_end_date) {
            document.getElementById('recurrenceEndDate').value = firstInstance.recurrence_end_date.split('T')[0];
        }
        this.toggleRecurrenceEnd(firstInstance.recurrence_type || 'none');

        modal.dataset.editMode = 'group';
        modal.dataset.groupId = groupId;

        document.getElementById('modalTitle').textContent = 'Editar Série Completa';
        this.closeGroupModal();
        modal.style.display = 'flex';
    }

    editInstance(instanceId) {
        const instance = this.horarios.find(h => h.id === instanceId);
        if (!instance) return;

        this.currentInstanceId = instanceId;

        const dataInicio = new Date(instance.data_hora_inicio);
        const dataFim = new Date(instance.data_hora_fim);

        document.getElementById('instanceType').value = instance.tipo;
        document.getElementById('instanceDate').value = dataInicio.toISOString().split('T')[0];
        document.getElementById('instanceStartTime').value = dataInicio.toTimeString().substring(0, 5);
        document.getElementById('instanceEndTime').value = dataFim.toTimeString().substring(0, 5);
        document.getElementById('instanceReason').value = instance.motivo || '';

        document.getElementById('editInstanceModal').style.display = 'flex';
    }

    async deleteInstance(instanceId) {
        if (!confirm('Tem certeza que deseja eliminar esta instância?')) {
            return;
        }

        try {
            await window.adminAPI.deleteHorarioIndisponivel(instanceId);
            alert('Instância eliminada com sucesso!');
            this.closeGroupModal();
            await this.loadHorarios();
            this.render();
        } catch (error) {
            console.error('Error deleting instance:', error);
            alert('Erro ao eliminar instância: ' + error.message);
        }
    }

    editSingle(id) {
        const horario = this.horarios.find(h => h.id === id);
        if (!horario) return;

        this.currentSingleId = id;

        const select = document.getElementById('singleBarber');
        select.innerHTML = '';
        this.barbeiros.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            if (barbeiro.id == horario.barbeiro_id) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        document.getElementById('singleType').value = horario.tipo;

        const dataInicio = new Date(horario.data_hora_inicio);
        const dataFim = new Date(horario.data_hora_fim);

        document.getElementById('singleStartDate').value = dataInicio.toISOString().split('T')[0];

        if (horario.is_all_day) {
            document.getElementById('singleIsAllDay').checked = true;
            this.toggleSingleAllDay(true);
        } else {
            document.getElementById('singleIsAllDay').checked = false;
            document.getElementById('singleStartTime').value = dataInicio.toTimeString().substring(0, 5);
            document.getElementById('singleEndTime').value = dataFim.toTimeString().substring(0, 5);
            this.toggleSingleAllDay(false);
        }

        document.getElementById('singleReason').value = horario.motivo || '';

        document.getElementById('editSingleModal').style.display = 'flex';
    }

    async deleteSingle(id) {
        if (!confirm('Tem certeza que deseja eliminar este horário indisponível?')) {
            return;
        }

        try {
            await window.adminAPI.deleteHorarioIndisponivel(id);
            alert('Horário indisponível eliminado com sucesso!');
            await this.loadHorarios();
            this.render();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao eliminar: ' + error.message);
        }
    }

    showSingleDetails(id) {
        this.editSingle(id);
    }

    showError(message) {
        const container = document.getElementById('unavailableContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-state-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Erro ao carregar</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Recarregar
                    </button>
                </div>
            `;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unavailableManager = new Unavailable();
    });
} else {
    window.unavailableManager = new Unavailable();
}

console.log('✅ Unavailable Manager loaded');