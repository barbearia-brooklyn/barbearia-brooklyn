/**
 * Gestão de horários indisponíveis com suporte a recorrências agrupadas
 */

class UnavailableManager {
    static UNAVAILABLE_API = '/api/admin/api_horarios_indisponiveis';
    static currentGroup = null;
    static currentGroupId = null;
    static currentInstanceId = null;

    static init() {
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Menu de navegação
        document.querySelectorAll('.nav-item-unavailable').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUnavailableView();
            });
        });

        // Botão adicionar
        document.getElementById('addUnavailableBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });

        // Fechar modal principal
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Clique fora do modal principal
        document.getElementById('unavailableModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'unavailableModal') this.closeModal();
        });

        // Guardar horário indisponível
        document.getElementById('saveUnavailableBtn')?.addEventListener('click', () => {
            this.saveUnavailable();
        });

        // Fechar modal de grupo
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeGroupModal());
        });

        // Clique fora do modal de grupo
        document.getElementById('groupDetailsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'groupDetailsModal') this.closeGroupModal();
        });

        // Editar série completa
        document.getElementById('editGroupBtn')?.addEventListener('click', () => {
            this.showEditGroupModal();
        });

        // Fechar modal de edição de instância
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeEditInstanceModal());
        });

        // Clique fora do modal de edição
        document.getElementById('editInstanceModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'editInstanceModal') this.closeEditInstanceModal();
        });

        // Guardar edição de instância
        document.getElementById('saveInstanceBtn')?.addEventListener('click', () => {
            this.saveInstanceEdit();
        });

        // Checkbox "Todo o dia"
        document.getElementById('isAllDay')?.addEventListener('change', (e) => {
            this.toggleAllDay(e.target.checked);
        });

        // Tipo de recorrência
        document.getElementById('recurrenceType')?.addEventListener('change', (e) => {
            this.toggleRecurrenceEnd(e.target.value);
        });
    }

    static toggleAllDay(isAllDay) {
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

    static toggleRecurrenceEnd(recurrenceType) {
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

    static showUnavailableView() {
        const barbeiro = ProfileManager.getBarbeiros().find(b => b.id === ProfileManager.getSelectedBarber());
        const nome = barbeiro ? barbeiro.nome : 'Todos os Barbeiros';
        UIHelper.updateHeaderTitle(`Horários Indisponíveis de ${nome}`, 'Registo de Folgas, Férias, Ausências, etc');
        UIHelper.showView('unavailableView');
        this.loadUnavailableList();
    }

    static showAddModal() {
        const modal = document.getElementById('unavailableModal');
        const select = document.getElementById('unavailableBarber');
        const barbeiroDisplay = document.getElementById('barbeiroDisplay');

        // Popular barbeiros
        select.innerHTML = '<option value="">Selecione um barbeiro</option>';

        const selectedBarber = ProfileManager.getSelectedBarber();

        ProfileManager.getBarbeiros().forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            if (selectedBarber && barbeiro.id === selectedBarber) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Limpar form
        document.getElementById('unavailableForm').reset();

        // Reset checkboxes e visibilidade
        document.getElementById('isAllDay').checked = false;
        this.toggleAllDay(false);

        document.getElementById('recurrenceType').value = 'none';
        this.toggleRecurrenceEnd('none');

        modal.style.display = 'flex';
    }

    static closeModal() {
        document.getElementById('unavailableModal').style.display = 'none';
    }

    static closeGroupModal() {
        document.getElementById('groupDetailsModal').style.display = 'none';
        this.currentGroup = null;
        this.currentGroupId = null;
    }

    static async showEditGroupModal() {
        console.log('showEditGroupModal chamado');
        console.log('currentGroup:', this.currentGroup);
        console.log('currentGroupId:', this.currentGroupId);

        if (!this.currentGroup || this.currentGroup.length === 0 || !this.currentGroupId) {
            UIHelper.showAlert('Nenhum grupo selecionado', 'error');
            return;
        }

        const groupId = this.currentGroupId;
        const groupData = [...this.currentGroup];

        this.closeGroupModal();

        try {
            UIHelper.showLoading(true);

            const response = await fetch(`${this.UNAVAILABLE_API}/group/${groupId}`, {
                headers: { 'Authorization': `Bearer ${AuthManager.getToken()}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar grupo');

            const instances = await response.json();

            if (!instances || instances.length === 0) {
                UIHelper.showAlert('Grupo vazio ou não encontrado', 'error');
                return;
            }

            const firstInstance = instances[0];
            const modal = document.getElementById('unavailableModal');
            const barbeiroSelect = document.getElementById('unavailableBarber');

            document.getElementById('unavailableForm').reset();

            barbeiroSelect.innerHTML = '';
            ProfileManager.getBarbeiros().forEach(barbeiro => {
                const option = document.createElement('option');
                option.value = barbeiro.id;
                option.textContent = barbeiro.nome;
                if (barbeiro.id === firstInstance.barbeiro_id) {
                    option.selected = true;
                }
                barbeiroSelect.appendChild(option);
            });

            barbeiroSelect.disabled = false;
            barbeiroSelect.style.display = 'block';
            barbeiroSelect.required = true;

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

            // Definir recorrência
            document.getElementById('recurrenceType').value = firstInstance.recurrence_type || 'none';
            if (firstInstance.recurrence_end_date) {
                document.getElementById('recurrenceEndDate').value = firstInstance.recurrence_end_date.split('T')[0];
            }
            this.toggleRecurrenceEnd(firstInstance.recurrence_type || 'none');

            modal.dataset.editMode = 'group';
            modal.dataset.groupId = groupId;

            modal.style.display = 'flex';

        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao abrir edição do grupo: ' + error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static closeEditInstanceModal() {
        document.getElementById('editInstanceModal').style.display = 'none';
        this.currentInstanceId = null;
    }

    static async saveUnavailable() {
        const form = document.getElementById('unavailableForm');

        const barbeiroSelect = document.getElementById('unavailableBarber');

        if (barbeiroSelect.style.display === 'none' || barbeiroSelect.disabled) {
            barbeiroSelect.required = false;
        } else {
            barbeiroSelect.required = true;
        }

        if (!form.checkValidity()) {
            UIHelper.showAlert('Preencha todos os campos obrigatórios', 'error');
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
            UIHelper.showAlert('A data/hora de fim deve ser posterior à de início', 'error');
            return;
        }

        try {
            UIHelper.showLoading(true);

            let url = this.UNAVAILABLE_API;
            let method = 'POST';

            // Se for edição de grupo
            if (editMode === 'group' && groupId) {
                url = `${this.UNAVAILABLE_API}/group/${groupId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Erro ao salvar horário indisponível');

            const message = editMode === 'group'
                ? 'Série de horários indisponíveis atualizada com sucesso!'
                : (recurrenceType !== 'none'
                    ? 'Horários indisponíveis criados com recorrência. Reservas sobrepostas foram canceladas.'
                    : 'Horário indisponível criado. Reservas sobrepostas foram canceladas.');

            UIHelper.showAlert(message, 'success');

            delete modal.dataset.editMode;
            delete modal.dataset.groupId;

            this.closeModal();
            this.loadUnavailableList();
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());

        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao salvar horário indisponível', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static async loadUnavailableList() {
        try {
            UIHelper.showLoading(true);
            const selectedBarber = ProfileManager.getSelectedBarber();
            let params = new URLSearchParams();
            if (selectedBarber) {
                params.append('barbeiroId', selectedBarber);
            }

            const today = new Date().toISOString().split('T')[0];
            params.append('fromDate', today);
            params.append('grouped', 'true');

            const response = await fetch(`${this.UNAVAILABLE_API}?${params}`, {
                headers: { 'Authorization': `Bearer ${AuthManager.getToken()}` }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API não retornou JSON.');
            }

            const horarios = await response.json();
            this.renderUnavailableList(horarios);
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar horários indisponíveis: ' + error.message, 'error');
            document.getElementById('unavailableList').innerHTML =
                '<div class="empty-state"><p>⚠️</p><p>Erro ao carregar dados.</p></div>';
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static renderUnavailableList(horarios) {
        const container = document.getElementById('unavailableList');
        container.innerHTML = '';

        if (horarios.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>📅</p><p>Nenhum horário indisponível registado</p></div>';
            return;
        }

        const tipoEmojis = {
            'folga': '🏖️',
            'almoco': '🍽️',
            'ferias': '✈️',
            'ausencia': '🚫',
            'outro': '📌'
        };

        const tipoLabels = {
            'folga': 'Folga',
            'almoco': 'Almoço',
            'ferias': 'Férias',
            'ausencia': 'Ausência',
            'outro': 'Outro'
        };

        const recurrenceLabels = {
            'none': '',
            'daily': '🔁 Diariamente',
            'weekly': '🔁 Semanalmente'
        };

        horarios.forEach(horario => {
            const card = document.createElement('div');
            card.className = 'unavailable-item';

            if (horario.recurrence_group_id) {
                card.classList.add('group-item');
            }

            const inicio = new Date(horario.data_hora_inicio);
            const fim = new Date(horario.data_hora_fim);

            const barbeiro = ProfileManager.getBarbeiros().find(b => b.id === horario.barbeiro_id);

            const isAllDay = horario.is_all_day === 1;
            const timeDisplay = isAllDay
                ? 'Todo o dia'
                : `${UIHelper.formatTime(inicio)} até ${UIHelper.formatTime(fim)}`;

            const isRecurring = horario.recurrence_type && horario.recurrence_type !== 'none';
            const instanceCount = horario.instance_count || 1;

            const recurrenceText = isRecurring
                ? `<div class="unavailable-recurrence">${recurrenceLabels[horario.recurrence_type]} (${instanceCount} ocorrências)</div>`
                : '';

            const viewButton = isRecurring
                ? `<button class="btn btn-primary btn-small" onclick="UnavailableManager.showGroupDetails('${horario.recurrence_group_id}')">
                    <i class="fa-solid fa-eye"></i> Ver
                  </button>`
                : '';

            card.innerHTML = `
                <div class="unavailable-icon">${tipoEmojis[horario.tipo]}</div>
                <div class="unavailable-details">
                    <div class="unavailable-header">
                        <strong>${tipoLabels[horario.tipo]}</strong> - ${barbeiro?.nome || 'Barbeiro'}
                    </div>
                    <div class="unavailable-dates">
                        Inicia em ${UIHelper.formatDate(inicio)} - ${timeDisplay}
                    </div>
                    ${recurrenceText}
                    ${horario.motivo ? `<div class="unavailable-reason">${horario.motivo}</div>` : ''}
                </div>
                <div class="unavailable-actions">
                    ${viewButton}
                    <button class="btn btn-danger btn-small" onclick="UnavailableManager.deleteUnavailable(${horario.id}, '${horario.recurrence_group_id || ''}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            container.appendChild(card);
        });
    }

    static async showGroupDetails(groupId) {
        try {
            UIHelper.showLoading(true);

            const response = await fetch(`${this.UNAVAILABLE_API}/group/${groupId}`, {
                headers: { 'Authorization': `Bearer ${AuthManager.getToken()}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar detalhes do grupo');

            const instances = await response.json();

            if (instances.length === 0) {
                UIHelper.showAlert('Grupo não encontrado', 'error');
                return;
            }

            this.currentGroup = instances;
            this.currentGroupId = groupId;

            const modal = document.getElementById('groupDetailsModal');
            const groupInfo = document.getElementById('groupInfo');
            const instancesList = document.getElementById('groupInstances');

            const firstInstance = instances[0];
            const barbeiro = ProfileManager.getBarbeiros().find(b => b.id === firstInstance.barbeiro_id);

            const tipoLabels = {
                'folga': 'Folga',
                'almoco': 'Almoço',
                'ferias': 'Férias',
                'ausencia': 'Ausência',
                'outro': 'Outro'
            };

            groupInfo.innerHTML = `
                <p><strong>Tipo:</strong> ${tipoLabels[firstInstance.tipo]}</p>
                <p><strong>Barbeiro:</strong> ${barbeiro?.nome || 'N/A'}</p>
                <p><strong>Total de ocorrências:</strong> ${instances.length}</p>
                ${firstInstance.motivo ? `<p><strong>Motivo:</strong> ${firstInstance.motivo}</p>` : ''}
            `;

            instancesList.innerHTML = '';
            instances.forEach(instance => {
                const inicio = new Date(instance.data_hora_inicio);
                const fim = new Date(instance.data_hora_fim);

                const card = document.createElement('div');
                card.className = 'instance-item';

                card.innerHTML = `
                    <div class="instance-info">
                        <div class="instance-date">${UIHelper.formatDate(inicio)}</div>
                        <div class="instance-time">${UIHelper.formatTime(inicio)} - ${UIHelper.formatTime(fim)}</div>
                    </div>
                    <button class="btn btn-small btn-secondary" onclick="UnavailableManager.editInstance(${instance.id})">
                        <i class="fa-solid fa-edit"></i> Editar
                    </button>
                `;

                instancesList.appendChild(card);
            });

            modal.style.display = 'flex';
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar detalhes do grupo', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static async editInstance(instanceId) {
        try {
            const instance = this.currentGroup.find(i => i.id === instanceId);
            if (!instance) {
                UIHelper.showAlert('Instância não encontrada', 'error');
                return;
            }

            this.currentInstanceId = instanceId;

            const inicio = new Date(instance.data_hora_inicio);
            const fim = new Date(instance.data_hora_fim);

            document.getElementById('instanceType').value = instance.tipo;
            document.getElementById('instanceStartTime').value = UIHelper.formatTime(inicio);
            document.getElementById('instanceEndTime').value = UIHelper.formatTime(fim);
            document.getElementById('instanceReason').value = instance.motivo || '';

            document.getElementById('editInstanceModal').style.display = 'flex';
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao abrir edição da instância', 'error');
        }
    }

    static async saveInstanceEdit() {
        const form = document.getElementById('editInstanceForm');
        if (!form.checkValidity()) {
            UIHelper.showAlert('Preencha todos os campos', 'error');
            return;
        }

        try {
            UIHelper.showLoading(true);

            const instance = this.currentGroup.find(i => i.id === this.currentInstanceId);
            const dataString = instance.data_hora_inicio.split('T')[0];

            const data = {
                tipo: document.getElementById('instanceType').value,
                data_hora_inicio: `${dataString}T${document.getElementById('instanceStartTime').value}:00`,
                data_hora_fim: `${dataString}T${document.getElementById('instanceEndTime').value}:00`,
                motivo: document.getElementById('instanceReason').value || null
            };

            // Atualizar instância individual
            const response = await fetch(`${this.UNAVAILABLE_API}/${this.currentInstanceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Erro ao guardar edição');

            UIHelper.showAlert('Instância atualizada com sucesso', 'success');
            this.closeEditInstanceModal();
            this.showGroupDetails(this.currentGroupId);
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao guardar alterações', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static async deleteUnavailable(id, groupId) {
        if (groupId) {
            const choice = confirm('Deseja eliminar:\n\nOK = Toda a série recorrente\nCancelar = Voltar');
            if (!choice) return;

            try {
                UIHelper.showLoading(true);

                const response = await fetch(`${this.UNAVAILABLE_API}/group/${groupId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${AuthManager.getToken()}`
                    }
                });

                if (!response.ok) throw new Error('Erro ao eliminar grupo');

                UIHelper.showAlert('Série de horários eliminada', 'success');
                this.closeGroupModal();
                this.loadUnavailableList();
                CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
            } catch (error) {
                console.error('Erro:', error);
                UIHelper.showAlert('Erro ao eliminar série', 'error');
            } finally {
                UIHelper.showLoading(false);
            }
        } else {
            if (!confirm('Tem certeza que deseja eliminar este horário indisponível?')) return;

            try {
                UIHelper.showLoading(true);

                const response = await fetch(`${this.UNAVAILABLE_API}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${AuthManager.getToken()}`
                    }
                });

                if (!response.ok) throw new Error('Erro ao eliminar horário');

                UIHelper.showAlert('Horário indisponível eliminado', 'success');
                this.loadUnavailableList();
                CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
            } catch (error) {
                console.error('Erro:', error);
                UIHelper.showAlert('Erro ao eliminar horário indisponível', 'error');
            } finally {
                UIHelper.showLoading(false);
            }
        }
    }
}