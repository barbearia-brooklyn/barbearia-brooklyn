// consultar.js - Consultar Reserva por Código

const { apiRequest, hideMessages, showError, formatDate, formatTime } = utils;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('consultForm');
    if (form) {
        form.addEventListener('submit', handleConsultSubmit);
    }
});

// ===== CONSULTAR RESERVA =====
async function handleConsultSubmit(e) {
    e.preventDefault();

    const codigo = document.getElementById('reservation-code').value.trim();
    const resultContainer = document.getElementById('consultation-result');

    hideMessages('consult-error');
    resultContainer.innerHTML = '';

    if (!codigo) {
        showError('consult-error', 'Por favor, insira um código de reserva');
        return;
    }

    // Mostrar loading
    resultContainer.innerHTML = '<div class="loading">A procurar reserva...</div>';

    const result = await apiRequest(`/api_consultar_reservas?codigo=${encodeURIComponent(codigo)}`);

    if (result.ok && result.data.length > 0) {
        const reserva = result.data[0];
        displayReservation(reserva);
    } else {
        resultContainer.innerHTML = '';
        showError('consult-error', 'Reserva não encontrada. Verifique o código e tente novamente.');
    }
}

// ===== EXIBIR DETALHES DA RESERVA =====
function displayReservation(reserva) {
    const resultContainer = document.getElementById('consultation-result');
    const dataHora = new Date(reserva.data_hora);
    const now = new Date();
    const isPast = dataHora < now;

    const statusClass = reserva.status === 'cancelada' ? 'cancelled' :
        (isPast ? 'past' : 'upcoming');

    const statusText = {
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'concluida': 'Concluída'
    }[reserva.status] || reserva.status;

    resultContainer.innerHTML = `
        <div class="reservation-details ${statusClass}">
            <div class="status-badge ${reserva.status}">
                ${statusText}
            </div>

            <div class="detail-section">
                <h3>Informações da Reserva</h3>
                <div class="detail-row">
                    <span class="label">Código:</span>
                    <span class="value"><strong>${reserva.codigo}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="label">Serviço:</span>
                    <span class="value">${reserva.servico_nome}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Barbeiro:</span>
                    <span class="value">${reserva.barbeiro_nome}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Data:</span>
                    <span class="value">${formatDate(dataHora)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Hora:</span>
                    <span class="value">${formatTime(dataHora)}</span>
                </div>
                ${reserva.comentario ? `
                <div class="detail-row">
                    <span class="label">Comentário:</span>
                    <span class="value">${reserva.comentario}</span>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <h3>Dados do Cliente</h3>
                <div class="detail-row">
                    <span class="label">Nome:</span>
                    <span class="value">${reserva.cliente_nome}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Email:</span>
                    <span class="value">${reserva.cliente_email}</span>
                </div>
                ${reserva.cliente_telefone ? `
                <div class="detail-row">
                    <span class="label">Telefone:</span>
                    <span class="value">${reserva.cliente_telefone}</span>
                </div>
                ` : ''}
            </div>

            ${reserva.status === 'confirmada' && !isPast ? `
            <div class="actions">
                <p class="info-text">
                    <strong>Nota:</strong> Para cancelar ou alterar a sua reserva, 
                    entre em contacto connosco ou aceda à sua área de cliente.
                </p>
                <a href="login.html" class="btn-primary">Aceder ao Perfil</a>
            </div>
            ` : ''}
        </div>
    `;
}