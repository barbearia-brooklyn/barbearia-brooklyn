/**
 * Gestão de modais
 */

class ModalManager {
    static currentReservation = null;

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

        const dataHora = new Date(reserva.data_hora);
        const dataFormatada = UIHelper.formatDate(dataHora);
        const horaFormatada = UIHelper.formatTime(dataHora);

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-detail-row">
                <strong>Cliente:</strong> ${reserva.cliente_nome}
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
    }

    static closeModal() {
        document.getElementById('bookingModal').style.display = 'none';
        this.currentReservation = null;
    }

    static editBooking() {
        // TODO: Implementar edição de reserva
        UIHelper.showAlert('Funcionalidade em desenvolvimento', 'info');
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

            if (!response.ok) throw new Error('Erro ao cancelar reserva');

            UIHelper.showAlert('Reserva cancelada com sucesso', 'success');
            this.closeModal();

            // Recarregar dados
            ReservationManager.loadReservationsList();
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao cancelar reserva', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }
}
