/**
 * Gestão de horários indisponíveis
 */

class UnavailableManager {
    static UNAVAILABLE_API = '/api/admin/api_horarios_indisponiveis';

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

        // Fechar modal
        document.querySelectorAll('.modal-close-unavailable').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Clique fora do modal
        document.getElementById('unavailableModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'unavailableModal') this.closeModal();
        });

        // Checkbox "Todo o dia"
        document.getElementById('unavailableAllDay')?.addEventListener('change', (e) => {
            this.toggleAllDayFields(e.target.checked);
        });

        // Select de recorrência
        document.getElementById('unavailableRecurrence')?.addEventListener('change', (e) => {
            this.toggleRecurrenceFields(e.target.value);
        });

        // Guardar
        document.getElementById('saveUnavailableBtn')?.addEventListener('click', () => {
            this.saveUnavailable();
        });
    }

    static showUnavailableView() {
        UIHelper.updateHeaderTitle('Horários Indisponíveis', 'Gerir períodos de ausência e indisponibilidade');
        UIHelper.showView('unavailableView');
        this.loadUnavailableList();
    }

    static showAddModal() {
        const modal = document.getElementById('unavailableModal');
        const select = document.getElementById('unavailableBarber');

        // Popular barbeiros
        select.innerHTML = '<option value="">Selecione um barbeiro</option>';

        const selectedBarber = ProfileManager.getSelectedBarber();
        if (selectedBarber) {
            const barber = ProfileManager.getBarbeiros().find(b => b.id === selectedBarber);
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = barber.nome;
            option.selected = true;
            select.appendChild(option);
            select.disabled = true;
        } else {
            ProfileManager.getBarbeiros().forEach(barbeiro => {
                const option = document.createElement('option');
                option.value = barbeiro.id;
                option.textContent = barbeiro.nome;
                select.appendChild(option);
            });
            select.disabled = false;
        }

        // Limpar form
        document.getElementById('unavailableForm').reset();
        document.getElementById('unavailableAllDay').checked = false;
        this.toggleAllDayFields(false);
        this.toggleRecurrenceFields('unico');

        modal.style.display = 'flex';
    }

    static toggleAllDayFields(isAllDay) {
        const startTimeGroup = document.getElementById('startTimeGroup');
        const endTimeGroup = document.getElementById('endTimeGroup');
        const startTimeInput = document.getElementById('unavailableStartTime');
        const endTimeInput = document.getElementById('unavailableEndTime');

        if (isAllDay) {
            startTimeGroup.style.display = 'none';
            endTimeGroup.style.display = 'none';
            startTimeInput.required = false;
            endTimeInput.required = false;
            startTimeInput.value = '10:00';
            endTimeInput.value = '20:00';
        } else {
            startTimeGroup.style.display = 'block';
            endTimeGroup.style.display = 'block';
            startTimeInput.required = true;
            endTimeInput.required = true;
        }
    }

    static toggleRecurrenceFields(recurrence) {
        const recurrenceEndGroup = document.getElementById('recurrenceEndGroup');
        const endDateInput = document.getElementById('unavailableEndDate');
        const endDateLabel = endDateInput.previousElementSibling;

        if (recurrence === 'diario' || recurrence === 'semanal') {
            recurrenceEndGroup.style.display = 'block';
            endDateLabel.textContent = 'Data Primeira Ocorrência *';
            endDateInput.placeholder = 'Data da primeira ocorrência';
        } else {
            recurrenceEndGroup.style.display = 'none';
            endDateLabel.textContent = 'Data Fim *';
            endDateInput.placeholder = '';
        }
    }

    static closeModal() {
        document.getElementById('unavailableModal').style.display = 'none';
    }

    static async saveUnavailable() {
        const form = document.getElementById('unavailableForm');
        if (!form.checkValidity()) {
            UIHelper.showAlert('Preencha todos os campos obrigatórios', 'error');
            form.reportValidity();
            return;
        }

        const isAllDay = document.getElementById('unavailableAllDay').checked;
        const recurrence = document.getElementById('unavailableRecurrence').value;
        const startTime = isAllDay ? '10:00' : document.getElementById('unavailableStartTime').value;
        const endTime = isAllDay ? '20:00' : document.getElementById('unavailableEndTime').value;

        const data = {
            barbeiro_id: parseInt(document.getElementById('unavailableBarber').value),
            tipo: document.getElementById('unavailableType').value,
            data_hora_inicio: `${document.getElementById('unavailableStartDate').value}T${startTime}:00`,
            data_hora_fim: `${document.getElementById('unavailableEndDate').value}T${endTime}:00`,
            motivo: document.getElementById('unavailableReason').value || null,
            recorrencia: recurrence,
            todo_dia: isAllDay ? 1 : 0,
            data_fim_recorrencia: null
        };

        // Se for recorrente, adicionar data fim da recorrência
        if (recurrence !== 'unico') {
            const recurrenceEnd = document.getElementById('unavailableRecurrenceEnd').value;
            if (recurrenceEnd) {
                data.data_fim_recorrencia = recurrenceEnd;
            }
        }

        // Validar datas
        if (recurrence === 'unico' && new Date(data.data_hora_fim) <= new Date(data.data_hora_inicio)) {
            UIHelper.showAlert('A data/hora de fim deve ser posterior à de início', 'error');
            return;
        }

        try {
            UIHelper.showLoading(true);

            const response = await fetch(this.UNAVAILABLE_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Erro ao criar horário indisponível');

            UIHelper.showAlert('Horário indisponível criado. Reservas conflitantes foram canceladas.', 'success');
            this.closeModal();
            this.loadUnavailableList();
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao criar horário indisponível', 'error');
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

            const response = await fetch(`${this.UNAVAILABLE_API}?${params}`, {
                headers: { 'Authorization': `Bearer ${AuthManager.getToken()}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar horários');

            const horarios = await response.json();
            this.renderUnavailableList(horarios);
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar horários indisponíveis', 'error');
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
            'unico': '',
            'diario': '🔁 Diariamente',
            'semanal': '🔁 Semanalmente'
        };

        horarios.forEach(horario => {
            const card = document.createElement('div');
            card.className = 'unavailable-item';

            const inicio = new Date(horario.data_hora_inicio);
            const fim = new Date(horario.data_hora_fim);

            const barbeiro = ProfileManager.getBarbeiros().find(b => b.id === horario.barbeiro_id);

            const isAllDay = horario.todo_dia === 1;
            const recurrenceText = horario.recorrencia !== 'unico' ? `<span class="recurrence-badge">${recurrenceLabels[horario.recorrencia]}</span>` : '';

            let dateTimeText = '';
            if (isAllDay) {
                if (horario.recorrencia === 'unico') {
                    dateTimeText = `${UIHelper.formatDate(inicio)} até ${UIHelper.formatDate(fim)} (Todo o dia)`;
                } else {
                    dateTimeText = `A partir de ${UIHelper.formatDate(inicio)} (Todo o dia)`;
                }
            } else {
                if (horario.recorrencia === 'unico') {
                    dateTimeText = `${UIHelper.formatDate(inicio)} ${UIHelper.formatTime(inicio)} até ${UIHelper.formatDate(fim)} ${UIHelper.formatTime(fim)}`;
                } else {
                    dateTimeText = `A partir de ${UIHelper.formatDate(inicio)} ${UIHelper.formatTime(inicio)} até ${UIHelper.formatTime(fim)}`;
                }
            }

            if (horario.recorrencia !== 'unico' && horario.data_fim_recorrencia) {
                dateTimeText += ` (até ${UIHelper.formatDate(new Date(horario.data_fim_recorrencia))})`;
            }

            card.innerHTML = `
                <div class="unavailable-icon">${tipoEmojis[horario.tipo]}</div>
                <div class="unavailable-details">
                    <div class="unavailable-header">
                        <strong>${tipoLabels[horario.tipo]}</strong> - ${barbeiro?.nome || 'Barbeiro'}
                        ${recurrenceText}
                    </div>
                    <div class="unavailable-dates">
                        ${dateTimeText}
                    </div>
                    ${horario.motivo ? `<div class="unavailable-reason">${horario.motivo}</div>` : ''}
                </div>
                <div class="unavailable-actions">
                    <button class="btn btn-danger btn-small" onclick="UnavailableManager.deleteUnavailable(${horario.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            container.appendChild(card);
        });
    }

    static async deleteUnavailable(id) {
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