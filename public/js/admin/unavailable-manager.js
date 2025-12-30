/**
 * Brooklyn Barbearia - Unavailable Manager
 * Gestão de horários indisponíveis com suporte a recorrências agrupadas
 */

class UnavailableManager {
    constructor() {
        this.unavailableTimes = [];
        this.barbers = [];
        this.filters = {
            data_inicio: '',
            data_fim: ''
        };
        this.currentGroup = null;
        this.currentGroupId = null;
        this.currentInstanceId = null;
        this.tipoLabels = {
            'folga': 'Folga',
            'almoco': 'Almoço',
            'ferias': 'Férias',
            'ausencia': 'Ausência',
            'outro': 'Outro'
        };
        this.tipoIcons = {
            'folga': 'fa-calendar-day',
            'almoco': 'fa-utensils',
            'ferias': 'fa-umbrella-beach',
            'ausencia': 'fa-user-slash',
            'outro': 'fa-ban'
        };
        this.init();
    }

    async init() {
        console.log('🗓️ Initializing Unavailable Manager...');
        
        try {
            this.setupEventListeners();
            this.setupFilters();
            await this.loadBarbers();
            await this.loadUnavailable();
        } catch (error) {
            console.error('Unavailable initialization error:', error);
            this.showError('Erro ao carregar horários indisponíveis: ' + error.message);
        }
    }

    setupEventListeners() {
        // Botão adicionar
        document.getElementById('addUnavailableBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });

        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Clique fora fecha modal
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        });

        // Guardar horário indisponível
        document.getElementById('saveUnavailableBtn')?.addEventListener('click', () => {
            this.saveUnavailable();
        });

        // Checkbox "Todo o dia"
        document.getElementById('isAllDay')?.addEventListener('change', (e) => {
            this.toggleAllDay(e.target.checked);
        });

        // Tipo de recorrência
        document.getElementById('recurrenceType')?.addEventListener('change', (e) => {
            this.toggleRecurrenceEnd(e.target.value);
        });

        // Editar série completa
        document.getElementById('editGroupBtn')?.addEventListener('click', () => {
            this.showEditGroupModal();
        });

        // Guardar edição de instância
        document.getElementById('saveInstanceBtn')?.addEventListener('click', () => {
            this.saveInstanceEdit();
        });
    }

    setupFilters() {
        // Set default date range (today to +90 days)
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 90);
        
        document.getElementById('filterDateStart').value = today.toISOString().split('T')[0];
        document.getElementById('filterDateEnd').value = endDate.toISOString().split('T')[0];
        
        this.filters.data_inicio = today.toISOString().split('T')[0];
        this.filters.data_fim = endDate.toISOString().split('T')[0];

        // Apply filter button
        document.getElementById('applyDateFilter')?.addEventListener('click', () => {
            this.applyDateFilter();
        });

        // Clear filter button
        document.getElementById('clearDateFilter')?.addEventListener('click', () => {
            this.clearDateFilter();
        });
    }

    async applyDateFilter() {
        const startDate = document.getElementById('filterDateStart').value;
        const endDate = document.getElementById('filterDateEnd').value;

        if (startDate && endDate && startDate > endDate) {
            alert('A data de início deve ser anterior à data de fim');
            return;
        }

        this.filters.data_inicio = startDate;
        this.filters.data_fim = endDate;

        await this.loadUnavailable();
    }

    clearDateFilter() {
        document.getElementById('filterDateStart').value = '';
        document.getElementById('filterDateEnd').value = '';
        this.filters.data_inicio = '';
        this.filters.data_fim = '';
        this.loadUnavailable();
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

    async loadBarbers() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbers = response.barbeiros || response || [];
            console.log(`✅ ${this.barbers.length} barbeiros carregados`);
        } catch (error) {
            console.error('Erro ao carregar barbeiros:', error);
            this.barbers = [];
        }
    }

    async loadUnavailable() {
        try {
            const params = {
                ...this.filters,
                grouped: 'true'
            };
            
            const response = await window.adminAPI.getHorariosIndisponiveis(params);
            const data = response.horarios || response.data || response || [];
            
            // Agrupar por recurrence_group_id
            const grouped = {};
            data.forEach(item => {
                if (item.recurrence_group_id) {
                    if (!grouped[item.recurrence_group_id]) {
                        grouped[item.recurrence_group_id] = [];
                    }
                    grouped[item.recurrence_group_id].push(item);
                } else {
                    // Itens sem grupo ficam sozinhos
                    grouped[`single_${item.id}`] = [item];
                }
            });
            
            this.unavailableTimes = grouped;
            console.log(`✅ ${Object.keys(grouped).length} grupos/itens carregados`);
            this.render();
        } catch (error) {
            console.error('Erro ao carregar indisponibilidades:', error);
            this.unavailableTimes = {};
            this.render();
        }
    }

    showAddModal() {
        const modal = document.getElementById('unavailableModal');
        const select = document.getElementById('unavailableBarber');
        
        // Popular barbeiros
        select.innerHTML = '<option value="">Selecione um barbeiro</option>';
        this.barbers.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            select.appendChild(option);
        });

        // Limpar form
        document.getElementById('unavailableForm').reset();
        document.getElementById('modalTitle').textContent = 'Adicionar Horário Indisponível';
        
        // Reset checkboxes e visibilidade
        document.getElementById('isAllDay').checked = false;
        this.toggleAllDay(false);
        document.getElementById('recurrenceType').value = 'none';
        this.toggleRecurrenceEnd('none');
        
        // Remover dados de edição
        delete modal.dataset.editMode;
        delete modal.dataset.groupId;

        modal.style.display = 'flex';
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

        const data = {
            barbeiro_id: parseInt(document.getElementById('unavailableBarber').value),
            tipo: document.getElementById('unavailableType').value,
            data_hora_inicio: `${document.getElementById('unavailableStartDate').value}T${startTime}:00`,
            data_hora_fim: `${document.getElementById('unavailableEndDate').value}T${endTime}:00`,
            motivo: document.getElementById('unavailableReason').value || null,
            is_all_day: isAllDay ? 1 : 0,
            recurrence_type: recurrenceType,
            recurrence_end_date: recurrenceEndDate || null
        };

        // Validar datas
        if (new Date(data.data_hora_fim) <= new Date(data.data_hora_inicio)) {
            alert('A data/hora de fim deve ser posterior à de início');
            return;
        }

        try {
            let url = '/api/admin/api_horarios_indisponiveis';
            let method = 'POST';

            // Se for edição de grupo
            if (editMode === 'group' && groupId) {
                url = `/api/admin/api_horarios_indisponiveis/group/${groupId}`;
                method = 'PUT';
            }

            const response = await window.adminAPI.request(url, {
                method: method,
                body: JSON.stringify(data)
            });

            const message = editMode === 'group' ? 
                'Série de horários indisponíveis atualizada!' : 
                (recurrenceType !== 'none' ? 'Horários criados com recorrência!' : 'Horário indisponível criado!');
            
            alert(message);
            
            delete modal.dataset.editMode;
            delete modal.dataset.groupId;
            modal.style.display = 'none';
            
            await this.loadUnavailable();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao guardar horário indisponível: ' + error.message);
        }
    }

    render() {
        const container = document.getElementById('unavailableContainer');
        if (!container) return;

        const groups = Object.entries(this.unavailableTimes);

        if (groups.length === 0) {
            container.innerHTML = `
                <div class="unavailable-empty">
                    <div class="unavailable-empty-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <h3>Sem indisponibilidades</h3>
                    <p>Nenhum horário indisponível registado no período selecionado.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="unavailable-list">';

        groups.forEach(([groupKey, instances]) => {
            const firstInstance = instances[0];
            const barbeiro = this.barbers.find(b => b.id == firstInstance.barbeiro_id);
            const isGroup = instances.length > 1;
            
            const dataInicio = new Date(firstInstance.data_hora_inicio);
            const dataFim = new Date(firstInstance.data_hora_fim);
            const horaInicio = dataInicio.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'});
            const horaFim = dataFim.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'});
            
            const tipoClass = firstInstance.tipo || 'outro';
            const tipoIcon = this.tipoIcons[tipoClass] || 'fa-ban';
            
            html += `
                <div class="unavailable-item ${isGroup ? 'group-item' : ''}" 
                     onclick="window.unavailableManager.${isGroup ? 'showGroupDetails' : 'showSingleDetails'}('${groupKey}')">
                    <div class="unavailable-icon ${tipoClass}">
                        <i class="fas ${tipoIcon}"></i>
                    </div>
                    <div class="unavailable-details">
                        <div class="unavailable-header">
                            ${this.tipoLabels[firstInstance.tipo] || 'Indisponível'} - ${barbeiro?.nome || 'N/A'}
                        </div>
                        <div class="unavailable-dates">
                            ${dataInicio.toLocaleDateString('pt-PT', {day: '2-digit', month: 'short'})} às ${horaInicio} - ${horaFim}
                        </div>
                        ${firstInstance.motivo ? `<div class="unavailable-reason">${firstInstance.motivo}</div>` : ''}
                        ${isGroup ? `<div class="unavailable-recurrence"><i class="fas fa-repeat"></i> ${instances.length} ocorrências</div>` : ''}
                    </div>
                    <div class="unavailable-actions">
                        <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); window.unavailableManager.${isGroup ? 'showGroupDetails' : 'editSingle'}('${groupKey}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); window.unavailableManager.${isGroup ? 'deleteGroup' : 'deleteSingle'}('${groupKey}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    showGroupDetails(groupKey) {
        const instances = this.unavailableTimes[groupKey];
        if (!instances || instances.length === 0) return;

        this.currentGroup = instances;
        this.currentGroupId = instances[0].recurrence_group_id;

        const firstInstance = instances[0];
        const barbeiro = this.barbers.find(b => b.id == firstInstance.barbeiro_id);

        // Preencher info do grupo
        const groupInfo = document.getElementById('groupInfoContent');
        groupInfo.innerHTML = `
            <p><strong>Tipo:</strong> ${this.tipoLabels[firstInstance.tipo]}</p>
            <p><strong>Barbeiro:</strong> ${barbeiro?.nome || 'N/A'}</p>
            ${firstInstance.motivo ? `<p><strong>Motivo:</strong> ${firstInstance.motivo}</p>` : ''}
            <p><strong>Total de ocorrências:</strong> ${instances.length}</p>
        `;

        // Preencher lista de instâncias
        const instancesList = document.getElementById('groupInstancesList');
        instancesList.innerHTML = '';

        instances.forEach(instance => {
            const inicio = new Date(instance.data_hora_inicio);
            const fim = new Date(instance.data_hora_fim);
            
            const card = document.createElement('div');
            card.className = 'instance-item';
            card.innerHTML = `
                <div class="instance-info">
                    <div class="instance-date">
                        ${inicio.toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long'})}
                    </div>
                    <div class="instance-time">
                        ${inicio.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})} - 
                        ${fim.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                </div>
                <div class="instance-actions">
                    <button class="btn btn-sm btn-ghost" onclick="window.unavailableManager.editInstance(${instance.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.unavailableManager.deleteInstance(${instance.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            instancesList.appendChild(card);
        });

        document.getElementById('groupDetailsModal').style.display = 'flex';
    }

    showSingleDetails(groupKey) {
        this.editSingle(groupKey);
    }

    editSingle(groupKey) {
        const instances = this.unavailableTimes[groupKey];
        if (!instances || instances.length === 0) return;

        const instance = instances[0];
        alert(`Editar horário #${instance.id}\n(Funcionalidade a implementar)`);
    }

    async showEditGroupModal() {
        if (!this.currentGroup || this.currentGroup.length === 0 || !this.currentGroupId) {
            alert('Nenhum grupo selecionado');
            return;
        }

        const firstInstance = this.currentGroup[0];
        const modal = document.getElementById('unavailableModal');
        const select = document.getElementById('unavailableBarber');

        // Fechar modal de detalhes
        document.getElementById('groupDetailsModal').style.display = 'none';

        // Popular barbeiros
        select.innerHTML = '';
        this.barbers.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            if (barbeiro.id === firstInstance.barbeiro_id) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Preencher form com dados do grupo
        document.getElementById('unavailableType').value = firstInstance.tipo;
        document.getElementById('unavailableReason').value = firstInstance.motivo || '';

        const dataInicio = new Date(firstInstance.data_hora_inicio);
        const dataFim = new Date(firstInstance.data_hora_fim);

        document.getElementById('unavailableStartDate').value = dataInicio.toISOString().split('T')[0];
        document.getElementById('unavailableEndDate').value = dataFim.toISOString().split('T')[0];

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
        modal.dataset.groupId = this.currentGroupId;
        document.getElementById('modalTitle').textContent = 'Editar Série Completa';
        modal.style.display = 'flex';
    }

    async editInstance(instanceId) {
        alert(`Editar instância #${instanceId}\n(Funcionalidade a implementar)`);
    }

    async saveInstanceEdit() {
        alert('Guardar edição de instância\n(Funcionalidade a implementar)');
    }

    async deleteGroup(groupKey) {
        const instances = this.unavailableTimes[groupKey];
        if (!instances || instances.length === 0) return;

        if (!confirm(`Eliminar toda a série com ${instances.length} ocorrências?`)) {
            return;
        }

        try {
            const groupId = instances[0].recurrence_group_id;
            await window.adminAPI.request(`/api/admin/api_horarios_indisponiveis/group/${groupId}`, {
                method: 'DELETE'
            });
            alert('Série eliminada com sucesso!');
            await this.loadUnavailable();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao eliminar série: ' + error.message);
        }
    }

    async deleteSingle(groupKey) {
        const instances = this.unavailableTimes[groupKey];
        if (!instances || instances.length === 0) return;

        if (!confirm('Eliminar este horário indisponível?')) {
            return;
        }

        try {
            await window.adminAPI.deleteHorarioIndisponivel(instances[0].id);
            alert('Horário eliminado com sucesso!');
            await this.loadUnavailable();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao eliminar: ' + error.message);
        }
    }

    async deleteInstance(instanceId) {
        if (!confirm('Eliminar esta ocorrência?')) {
            return;
        }

        try {
            await window.adminAPI.deleteHorarioIndisponivel(instanceId);
            alert('Ocorrência eliminada!');
            document.getElementById('groupDetailsModal').style.display = 'none';
            await this.loadUnavailable();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao eliminar: ' + error.message);
        }
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

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unavailableManager = new UnavailableManager();
    });
} else {
    window.unavailableManager = new UnavailableManager();
}

console.log('✅ Unavailable Manager loaded');