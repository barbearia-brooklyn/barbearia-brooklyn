/**
 * Brooklyn Barbearia - Unavailable Manager
 * Manages unavailable time slots with recurrence support
 */

class UnavailableManager {
    constructor() {
        this.horarios = [];
        this.barbeiros = [];
        this.filters = {
            data_inicio: '',
            data_fim: '',
            barbeiro_id: ''
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
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 90);
        
        document.getElementById('filterDateStart').value = today.toISOString().split('T')[0];
        document.getElementById('filterDateEnd').value = futureDate.toISOString().split('T')[0];
        
        this.filters.data_inicio = today.toISOString().split('T')[0];
        this.filters.data_fim = futureDate.toISOString().split('T')[0];

        document.getElementById('applyDateFilter')?.addEventListener('click', () => {
            this.applyDateFilter();
        });

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

        await this.loadHorarios();
        this.render();
    }

    clearDateFilter() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filterDateStart').value = today;
        document.getElementById('filterDateEnd').value = '';
        this.filters.data_inicio = today;
        this.filters.data_fim = '';
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

        // Checkbox "Todo o dia"
        document.getElementById('isAllDay')?.addEventListener('change', (e) => {
            this.toggleAllDay(e.target.checked);
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
                ...this.filters,
                grouped: 'true' // Agrupar recorrências
            };
            
            const response = await window.adminAPI.getHorariosIndisponiveis(params);
            let horarios = response.horarios || response.data || response || [];

            // IMPORTANTE: Filtrar e agrupar para mostrar grupos com instâncias futuras
            if (Array.isArray(horarios)) {
                // Agrupar por recurrence_group_id
                const grupos = {};
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                horarios.forEach(h => {
                    if (h.recurrence_group_id) {
                        if (!grupos[h.recurrence_group_id]) {
                            grupos[h.recurrence_group_id] = [];
                        }
                        grupos[h.recurrence_group_id].push(h);
                    } else {
                        // Horários únicos sempre incluir se forem futuros
                        const dataInicio = new Date(h.data_hora_inicio);
                        if (dataInicio >= hoje) {
                            if (!grupos[`single_${h.id}`]) {
                                grupos[`single_${h.id}`] = [];
                            }
                            grupos[`single_${h.id}`].push(h);
                        }
                    }
                });

                // Filtrar grupos que têm pelo menos uma instância futura
                const gruposFiltrados = {};
                Object.keys(grupos).forEach(groupId => {
                    const instancias = grupos[groupId];
                    const temFutura = instancias.some(inst => {
                        const dataInicio = new Date(inst.data_hora_inicio);
                        return dataInicio >= hoje;
                    });

                    if (temFutura) {
                        gruposFiltrados[groupId] = instancias;
                    }
                });

                // Converter de volta para array
                horarios = [];
                Object.values(gruposFiltrados).forEach(group => {
                    horarios.push(...group);
                });
            }

            this.horarios = horarios;
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
    }

    closeEditSingleModal() {
        document.getElementById('editSingleModal').style.display = 'none';
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

        // IMPORTANTE: Usar a MESMA DATA para início e fim (não há campo unavailableEndDate)
        const data = {
            barbeiro_id: parseInt(document.getElementById('unavailableBarber').value),
            tipo: document.getElementById('unavailableType').value,
            data_hora_inicio: `${startDate}T${startTime}:00`,
            data_hora_fim: `${startDate}T${endTime}:00`,  // MESMA DATA, hora diferente
            motivo: document.getElementById('unavailableReason').value || null,
            is_all_day: isAllDay ? 1 : 0,
            recurrence_type: recurrenceType,
            recurrence_end_date: recurrenceEndDate || null
        };

        // Validar horas
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
                // Editar grupo
                response = await window.adminAPI.updateHorarioIndisponivelGroup(groupId, data);
            } else {
                // Criar novo
                response = await window.adminAPI.createHorarioIndisponivel(data);
            }

            const message = editMode === 'group' 
                ? 'Série de horários indisponíveis atualizada com sucesso!' 
                : (recurrenceType !== 'none' 
                    ? 'Horários indisponíveis criados com recorrência!' 
                    : 'Horário indisponível criado!');

            alert(message);
            
            // Limpar edit mode
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
                    <p>Não existem horários indisponíveis registados para o período selecionado.</p>
                </div>
            `;
            return;
        }

        // Agrupar por recurrence_group_id
        const grupos = {};
        this.horarios.forEach(h => {
            const key = h.recurrence_group_id || `single_${h.id}`;
            if (!grupos[key]) {
                grupos[key] = [];
            }
            grupos[key].push(h);
        });

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
        // Get all instances for this group
        const instancias = this.horarios.filter(h => 
            (h.recurrence_group_id || `single_${h.id}`) === groupId
        );

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

        // Show modal with group details
        const modal = document.getElementById('groupDetailsModal');
        const infoContent = document.getElementById('groupInfoContent');
        const instancesList = document.getElementById('groupInstancesList');

        infoContent.innerHTML = `
            <p><strong>Tipo:</strong> ${tipoLabels[firstInstance.tipo]}</p>
            <p><strong>Barbeiro:</strong> ${barbeiro?.nome || 'N/A'}</p>
            ${firstInstance.motivo ? `<p><strong>Motivo:</strong> ${firstInstance.motivo}</p>` : ''}
            <p><strong>Total de ocorrências:</strong> ${instancias.length}</p>
        `;

        instancesList.innerHTML = '';
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

        // Store current group for edit
        this.currentGroupId = groupId;
        this.currentGroup = instancias;

        modal.style.display = 'flex';

        // Setup edit group button
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

        // Popular form
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

        // Set edit mode
        modal.dataset.editMode = 'group';
        modal.dataset.groupId = groupId;

        this.closeGroupModal();
        modal.style.display = 'flex';
    }

    editInstance(instanceId) {
        console.log('Edit instance:', instanceId);
        alert('Editar instância (a implementar)');
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
        console.log('Edit single:', id);
        alert('Editar horário simples (a implementar)');
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
        // Just open edit for now
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

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unavailableManager = new UnavailableManager();
    });
} else {
    window.unavailableManager = new UnavailableManager();
}

console.log('✅ Unavailable Manager loaded');