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

        // Carregar barbeiros e serviços
        const barbeiros = ProfileManager.getBarbeiros();
        const servicos = ReservationManager.allServicos;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <form id="editReservationForm" class="modal-edit-form">
                <div class="form-group">
                    <label>Cliente *</label>
                    <input type="text" name="nome_cliente" value="${reserva.nome_cliente || ''}" required>
                </div>
                
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" name="telefone" value="${reserva.telefone || ''}">
                </div>
                
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${reserva.email || ''}">
                </div>
                
                <div class="form-group">
                    <label>Barbeiro *</label>
                    <select name="barbeiro_id" required>
                        ${barbeiros.map(b => `<option value="${b.id}" ${b.id === reserva.barbeiro_id ? 'selected' : ''}>${b.nome}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Serviço *</label>
                    <select name="servico_id" required>
                        ${servicos.map(s => `<option value="${s.id}" ${s.id === reserva.servico_id ? 'selected' : ''}>${s.nome}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Data *</label>
                        <input type="date" name="data" value="${UIHelper.formatDateISO(dataHora)}" required>
                    </div>
                    <div class="form-group">
                        <label>Hora *</label>
                        <input type="time" name="hora" value="${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Notas Privadas</label>
                    <textarea name="nota_privada">${reserva.nota_privada || ''}</textarea>
                </div>
            </form>
        `;

        document.getElementById('editBtn').textContent = 'Guardar';
        document.getElementById('editBtn').onclick = () => this.saveEditedBooking();
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
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            UIHelper.showAlert('Reserva atualizada com sucesso', 'success');
            this.closeModal();

            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao atualizar reserva: ' + error.message, 'error');
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
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            UIHelper.showAlert('Reserva cancelada com sucesso', 'success');
            this.closeModal();

            // Recarregar dados
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
            ReservationManager.loadReservationsList();
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao cancelar reserva: ' + error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }
}
