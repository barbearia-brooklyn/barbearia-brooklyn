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
            ${reserva.telefone ? `<div class="modal-detail-row"><strong>Telefone:</strong> ${reserva.telefone}</div>` : ''}
            ${reserva.email ? `<div class="modal-detail-row"><strong>Email:</strong> ${reserva.email}</div>` : ''}
            ${reserva.nota_privada ? `<div class="modal-detail-row"><strong>Notas:</strong> ${reserva.nota_privada}</div>` : ''}
        `;

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
        <form id="editBookingForm" class="modal-form">
            <div class="form-group">
                <label>Barbeiro</label>
                <select id="editBarber" required>
                    ${ProfileManager.getBarbeiros().map(b =>
            `<option value="${b.id}" ${b.id === reserva.barbeiro_id ? 'selected' : ''}>${b.nome}</option>`
        ).join('')}
                </select>
            </div>

            <div class="form-group">
                <label>Serviço</label>
                <select id="editService" required>
                    ${ReservationManager.allServicos.map(s =>
            `<option value="${s.id}" ${s.id === reserva.servico_id ? 'selected' : ''}>${s.nome} (${s.duracao}min)</option>`
        ).join('')}
                </select>
            </div>

            <div class="form-group">
                <label>Nome do Cliente</label>
                <input type="text" id="editClientName" value="${reserva.nome_cliente}" required>
            </div>

            <div class="form-group">
                <label>Email</label>
                <input type="email" id="editClientEmail" value="${reserva.email || ''}">
            </div>

            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="editClientPhone" value="${reserva.telefone || ''}">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="editDate" value="${dataHora.toISOString().split('T')[0]}" required>
                </div>

                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" id="editTime" value="${dataHora.toTimeString().substring(0, 5)}" required>
                </div>
            </div>

            <div class="form-group">
                <label>Comentário do Cliente</label>
                <textarea id="editComment" rows="2">${reserva.comentario || ''}</textarea>
            </div>

            <div class="form-group">
                <label>Nota Privada</label>
                <textarea id="editPrivateNote" rows="2">${reserva.nota_privada || ''}</textarea>
            </div>

            <div class="form-group">
                <label>Status</label>
                <select id="editStatus" required>
                    <option value="confirmada" ${reserva.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                    <option value="cancelada" ${reserva.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
            </div>
        </form>
    `;

        // Atualizar botões do modal
        const modalFooter = document.querySelector('.modal-footer');
        modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary modal-close-btn">Cancelar</button>
        <button type="button" class="btn btn-primary" id="saveEditBtn">Guardar Alterações</button>
    `;

        // Adicionar event listeners
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());
        document.querySelector('.modal-close-btn').addEventListener('click', () => this.closeModal());
    }

    static async saveEdit() {
        const form = document.getElementById('editBookingForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            UIHelper.showLoading(true);

            const dataHora = `${document.getElementById('editDate').value}T${document.getElementById('editTime').value}:00`;

            const data = {
                barbeiro_id: parseInt(document.getElementById('editBarber').value),
                servico_id: parseInt(document.getElementById('editService').value),
                nome_cliente: document.getElementById('editClientName').value,
                email: document.getElementById('editClientEmail').value || null,
                telefone: document.getElementById('editClientPhone').value || null,
                data_hora: dataHora,
                comentario: document.getElementById('editComment').value || null,
                nota_privada: document.getElementById('editPrivateNote').value || null,
                status: document.getElementById('editStatus').value
            };

            const response = await fetch(`${ReservationManager.RESERVAS_API}/${this.currentReservation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao atualizar reserva');
            }

            UIHelper.showAlert('Reserva atualizada com sucesso!', 'success');
            this.closeModal();

            ReservationManager.loadReservationsList();
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());

        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert(error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static closeModal() {
        document.getElementById('bookingModal').style.display = 'none';
        this.currentReservation = null;
        this.editMode = false;
        document.getElementById('editBtn').textContent = 'Editar';
        document.getElementById('editBtn').onclick = () => this.editBooking();
    }

    static async deleteBooking() {
        if (!this.currentReservation) return;

        if (!confirm('Tem a certeza que deseja cancelar esta reserva?')) return;

        try {
            UIHelper.showLoading(true);

            const response = await fetch(`/api/admin/api_admin_reservas/${this.currentReservation.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();

            UIHelper.showAlert('Reserva cancelada com sucesso', 'success');
            this.closeModal();

            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
            ReservationManager.loadReservationsList();
        } catch (error) {
            console.error('Erro DELETE:', error);
            UIHelper.showAlert('Erro ao cancelar reserva: ' + error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }
}
