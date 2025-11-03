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

        // Guardar
        document.getElementById('saveUnavailableBtn')?.addEventListener('click', () => {
            this.saveUnavailable();
        });

        // Checkbox "Todo o Dia"
        document.getElementById('unavailableAllDay')?.addEventListener('change', (e) => {
            this.toggleAllDayMode(e.target.checked);
        });

        // Select "Repetir"
        document.getElementById('unavailableRepeat')?.addEventListener('change', (e) => {
            this.toggleRepeatMode(e.target.value);
        });
    }

    static toggleAllDayMode(isAllDay) {
        const startTimeGroup = document.getElementById('startTimeGroup');
        const endTimeGroup = document.getElementById('endTimeGroup');
        const startTimeInput = document.getElementById('unavailableStartTime');
        const endTimeInput = document.getElementById('unavailableEndTime');

        if (isAllDay) {
            // Ocultar campos de hora
            startTimeGroup.style.display = 'none';
            endTimeGroup.style.display = 'none';
            startTimeInput.removeAttribute('required');
            endTimeInput.removeAttribute('required');

            // Definir valores padrão
            startTimeInput.value = '10:00';
            endTimeInput.value = '20:00';
        } else {
            // Mostrar campos de hora
            startTimeGroup.style.display = 'block';
            endTimeGroup.style.display = 'block';
            startTimeInput.setAttribute('required', 'required');
            endTimeInput.setAttribute('required', 'required');
        }
    }

    static toggleRepeatMode(repeatType) {
        const endDateRow = document.getElementById('endDateRow');
        const endDateInput = document.getElementById('unavailableEndDate');
        const repeatInfo = document.getElementById('repeatInfo');

        if (repeatType !== 'nao') {
            // Modo de repetição ativado
            endDateRow.style.display = 'none';
            endDateInput.removeAttribute('required');
            repeatInfo.style.display = 'block';

            // Definir data fim automaticamente (365 dias à frente)
            const startDate = new Date(document.getElementById('unavailableStartDate').value || new Date());
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            endDateInput.value = endDate.toISOString().split('T')[0];
        } else {
            // Modo normal
            endDateRow.style.display = 'flex';
            endDateInput.setAttribute('required', 'required');
            repeatInfo.style.display = 'none';
        }
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

        // Limpar form e resetar visibilidade
        document.getElementById('unavailableForm').reset();
        document.getElementById('unavailableAllDay').checked = false;
        this.toggleAllDayMode(false);
        this.toggleRepeatMode('nao');

        modal.style.display = 'flex';
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
        const repeatType = document.getElementById('unavailableRepeat').value;

        const startDate = document.getElementById('unavailableStartDate').value;
        const endDate = document.getElementById('unavailableEndDate').value;
        const startTime = document.getElementById('unavailableStartTime').value;
        const endTime = document.getElementById('unavailableEndTime').value;

        const data = {
            barbeiro_id: parseInt(document.getElementById('unavailableBarber').value),
            tipo: document.getElementById('unavailableType').value,
            data_hora_inicio: `${startDate}T${startTime}:00`,
            data_hora_fim: `${endDate}T${endTime}:00`,
            motivo: document.getElementById('unavailableReason').value || null,
            todo_dia: isAllDay ? 1 : 0,
            repetir: repeatType
        };

        // Validar datas apenas se não for repetição
        if (repeatType === 'nao' && new Date(data.data_hora_fim) <= new Date(data.data_hora_inicio)) {
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

            const message = repeatType !== 'nao'
                ? 'Horários indisponíveis criados com repetição. Reservas conflitantes foram canceladas.'
                : 'Horário indisponível criado. Reservas conflitantes foram canceladas.';

            UIHelper.showAlert(message, 'success');
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

        const repeatLabels = {
            'nao': '',
            'diario': '🔁 Repetição Diária',
            'semanal': '🔁 Repetição Semanal'
        };

        horarios.forEach(horario => {
            const card = document.createElement('div');
            card.className = 'unavailable-item';

            const inicio = new Date(horario.data_hora_inicio);
            const fim = new Date(horario.data_hora_fim);

            const barbeiro = ProfileManager.getBarbeiros().find(b => b.id === horario.barbeiro_id);

            const isAllDay = horario.todo_dia === 1;
            const timeDisplay = isAllDay
                ? 'Todo o dia (10h - 20h)'
                : `${UIHelper.formatTime(inicio)} até ${UIHelper.formatTime(fim)}`;

            const repeatBadge = horario.repetir !== 'nao'
                ? `<span class="repeat-badge">${repeatLabels[horario.repetir]}</span>`
                : '';

            card.innerHTML = `
                <div class="unavailable-icon">${tipoEmojis[horario.tipo]}</div>
                <div class="unavailable-details">
                    <div class="unavailable-header">
                        <strong>${tipoLabels[horario.tipo]}</strong> - ${barbeiro?.nome || 'Barbeiro'}
                        ${repeatBadge}
                    </div>
                    <div class="unavailable-dates">
                        ${UIHelper.formatDate(inicio)} - ${timeDisplay}
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
