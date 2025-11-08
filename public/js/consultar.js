document.getElementById('consultForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('emailConsulta').value;

    // Capturar o token do Turnstile
    const turnstileToken = document.querySelector('input[name="cf-turnstile-response"]');

    if (!turnstileToken || !turnstileToken.value) {
        alert('Por favor, complete a verificação de segurança.');
        return;
    }

    try {
        const response = await fetch(`/api/api_consultar_reservas?email=${encodeURIComponent(email)}&turnstileToken=${encodeURIComponent(turnstileToken.value)}`);

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Erro ao consultar reservas');
            return;
        }

        const reservas = await response.json();

        if (reservas.length === 0) {
            document.getElementById('noReservas').style.display = 'block';
            document.getElementById('reservasList').style.display = 'none';
        } else {
            displayReservas(reservas);
            document.getElementById('reservasList').style.display = 'block';
            document.getElementById('noReservas').style.display = 'none';
        }

        document.querySelector('.consult-form').style.display = 'none';
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao consultar reservas');
    }
});

function displayReservas(reservas) {
    const now = new Date();
    const futuras = reservas.filter(r => new Date(r.data_hora) >= now);
    const passadas = reservas.filter(r => new Date(r.data_hora) < now);

    displayReservasList(futuras, 'reservasFuturas');
    displayReservasList(passadas, 'reservasPassadas');
}

function displayReservasList(reservas, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (reservas.length === 0) {
        container.innerHTML = '<p>Nenhuma reserva encontrada.</p>';
        return;
    }

    reservas.forEach(reserva => {
        const card = document.createElement('div');
        card.className = 'reserva-card';

        const dataHora = new Date(reserva.data_hora);
        const dataFormatada = dataHora.toLocaleDateString('pt-PT');
        const horaFormatada = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <h4>${reserva.servico_nome}</h4>
            <div class="reserva-info">
                <span><strong>Barbeiro:</strong> ${reserva.barbeiro_nome}</span>
                <span><strong>Data:</strong> ${dataFormatada}</span>
                <span><strong>Hora:</strong> ${horaFormatada}</span>
                <span><strong>Status:</strong> ${reserva.status}</span>
            </div>
            ${reserva.comentario ? `<p><em>${reserva.comentario}</em></p>` : ''}
        `;

        container.appendChild(card);
    });
}