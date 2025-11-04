/**
* Gestão de modais
*/

class ModalManager {
    static currentReservation = null;
    static editMode = false;

    static init() {
        const modal = document.getElementById('bookingModal');
        if (!modal) return;

        // Fechar modal
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Clique fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Editar
        document.getElementById('editBtn')?.addEventListener('click', () => this.editBooking());

        // Deletar
        document.getElementById('deleteBtn')?.addEventListener('click', () => this.deleteBooking());
    }

    static showBookingDetail(reserva) {
        this.currentReservation = reserva;
        this.editMode = false;

        const dataHora = new Date(reserva.data_hora);
        const dataFormatada = UIHelper.formatDate(dataHora);
        const horaFormatada = UIHelper.formatTime(dataHora);

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-detail-row">
                <strong>Cliente:</strong> ${reserva.nome_cliente || 'N/A'}
            </div>
            <div class="modal-detail-row">
                <strong>Barbeiro:</strong> ${reserva.barbeiro_nome}
            </div>
            <div class="modal-detail-row">
                <strong>Serviço:</strong> ${reserva.servico_nome}
            </div>
            <div class="modal-detail-row">
                <strong>Data:</strong> ${dataFormatada} às ${horaFormatada}
            </div>
            <div class="modal-detail-row">
                <strong>Status:</strong> <span style="color: ${reserva.status === 'cancelada' ? 'red' : 'green'}">${reserva.status === 'cancelada' ? '🚫 Cancelada' : '✅ Confirmada'}</span>
            </div>
            ${reserva.telefone ? `<div class="modal-detail-row"><strong>Telefone:</strong> ${reserva.telefone}</div>` : ''}
            ${reserva.email ? `<div class="modal-detail-row"><strong>Email:</strong> ${reserva.email}</div>` : ''}
            ${reserva.comentario ? `<div class="modal-detail-row"><strong>Comentário do Cliente</strong> ${reserva.comentario}</div>` : ''}
            ${reserva.nota_privada ? `<div class="modal-detail-row"><strong>Notas:</strong> ${reserva.nota_privada}</div>` : ''}
        `;

        const deleteBtn = document.getElementById('deleteBtn');
        if (reserva.status === 'cancelada') {
            deleteBtn.textContent = '🔄 Reativar Reserva';
        } else {
            deleteBtn.textContent = '❌ Cancelar Reserva';
        }

        document.getElementById('bookingModal').style.display = 'flex';
        document.getElementById('editBtn').style.display = 'inline-block';
        document.getElementById('deleteBtn').style.display = 'inline-block';
    }

    static async editBooking() {
        if (!this.currentReservation) return;

        this.editMode = true;
        const reserva = this.currentReservation;
        const dataHora = new Date(reserva.data_hora);

        const modalBody = document.getElementById('modalBody');

        // Carregar serviços se ainda não estão carregados
        if (ReservationManager.allServicos.length === 0) {
            await ReservationManager.loadServicos();
        }

        modalBody.innerHTML = `
            <form id="editReservationForm" class="modal-edit-form">
                <div class="form-group">
                    <label>Cliente *</label>
                    <input type="text" name="nome_cliente" value="${reserva.nome_cliente}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="tel" name="telefone" value="${reserva.telefone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="${reserva.email || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Barbeiro *</label>
                        <select name="barbeiro_id" required>
                            ${ProfileManager.getBarbeiros().map(b => `<option value="${b.id}" ${b.id === reserva.barbeiro_id ? 'selected' : ''}>${b.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Serviço *</label>
                        <select name="servico_id" required>
                            ${ReservationManager.allServicos.map(s =>`<option value="${s.id}" ${s.id === reserva.servico_id ? 'selected' : ''}>${s.nome} (${s.duracao}min)</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data *</label>
                        <input type="date" name="data" value="${dataHora.toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>Hora *</label>
                        <input type="time" name="hora" value="${dataHora.toTimeString().substring(0, 5)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notas Privadas</label>
                    <textarea name="nota_privada">${reserva.nota_privada || ''}</textarea>
                </div>
            </form>
        `;
        const editBtn = document.getElementById('editBtn');
        editBtn.textContent = 'Guardar';

        // Remover listeners antigos
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);

        // Adicionar novo listener
        newEditBtn.addEventListener('click', () => this.saveEditedBooking());
    }

    static async saveEditedBooking() {
        const form = document.getElementById('editReservationForm');
        if (!form || !form.checkValidity()) {
            UIHelper.showAlert('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        const formData = new FormData(form);
        const data = {
            nome_cliente: formData.get('nome_cliente'),
            telefone: formData.get('telefone'),
            email: formData.get('email'),
            barbeiro_id: parseInt(formData.get('barbeiro_id')),
            servico_id: parseInt(formData.get('servico_id')),
            data_hora: `${formData.get('data')}T${formData.get('hora')}:00`,
            comentario: formData.get('comentario') || this.currentReservation.comentario,
            nota_privada: formData.get('nota_privada')
        };
        try {
            UIHelper.showLoading(true);

            const response = await fetch(`/api/admin/api_admin_reservas/${this.currentReservation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            UIHelper.showAlert('Reserva atualizada com sucesso', 'success');
            this.closeModal();
            ReservationManager.loadReservationsList();
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());

        } catch (error) {
            console.error('Erro PUT:', error);
            UIHelper.showAlert('Erro ao atualizar reserva: ' + error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static closeModal() {
        document.getElementById('bookingModal').style.display = 'none';
        this.currentReservation = null;
        this.editMode = false;

        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        const newEditBtn = editBtn.cloneNode(true);
        const newDeleteBtn = deleteBtn.cloneNode(true);

        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

        newEditBtn.textContent = 'Editar';
        newDeleteBtn.textContent = 'Cancelar Reserva';

        newEditBtn.addEventListener('click', () => this.editBooking());
        newDeleteBtn.addEventListener('click', () => this.deleteBooking());
    }


    static async deleteBooking() {
        if (!this.currentReservation) return;

        const isCancelada = this.currentReservation.status === 'cancelada';
        const mensagem = isCancelada
            ? 'Tem a certeza que deseja reativar esta reserva?'
            : 'Tem a certeza que deseja cancelar esta reserva?';

        if (!confirm(mensagem)) return;

        try {
            UIHelper.showLoading(true);

            const novoStatus = isCancelada ? 'confirmada' : 'cancelada';

            const data = {
                barbeiro_id: this.currentReservation.barbeiro_id,
                servico_id: this.currentReservation.servico_id,
                nome_cliente: this.currentReservation.nome_cliente,
                email: this.currentReservation.email || null,
                telefone: this.currentReservation.telefone || null,
                data_hora: this.currentReservation.data_hora,
                comentario: this.currentReservation.comentario || null,
                nota_privada: this.currentReservation.nota_privada || null,
                status: novoStatus
            };

            const response = await fetch(`/api/admin/api_admin_reservas/${this.currentReservation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const mensagemSucesso = isCancelada
                ? 'Reserva reativada com sucesso'
                : 'Reserva cancelada com sucesso';
            UIHelper.showAlert(mensagemSucesso, 'success');

            this.closeModal();

            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
            ReservationManager.loadReservationsList();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            UIHelper.showAlert('Erro ao atualizar reserva: ' + error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }
}