const API_BASE = '/api';

let barbeiros = [];
let servicos = [];

// Carregar dados iniciais
async function loadInitialData() {
    try {
        const [barbeirosRes, servicosRes] = await Promise.all([
            fetch(`${API_BASE}/api_barbeiros`),
            fetch(`${API_BASE}/api_servicos`)
        ]);

        barbeiros = await barbeirosRes.json();
        servicos = await servicosRes.json();

        populateBarbeiros();
        populateServicos();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao carregar dados. Por favor, recarregue a página.');
    }
}

function populateBarbeiros() {
    const select = document.getElementById('barbeiro');
    barbeiros.forEach(b => {
        const option = document.createElement('option');
        option.value = b.id;
        option.textContent = b.nome;
        select.appendChild(option);
    });
}

function populateServicos() {
    const select = document.getElementById('servico');
    servicos.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.nome;
        select.appendChild(option);
    });
}

// Configurar data mínima (hoje)
document.addEventListener('DOMContentLoaded', function() {
    const dataInput = document.getElementById('data');
    const today = new Date().toISOString().split('T')[0];
    dataInput.min = today;

    loadInitialData();

    // Listener para mudanças na data/barbeiro
    dataInput.addEventListener('change', loadAvailableHours);
    document.getElementById('barbeiro').addEventListener('change', loadAvailableHours);
});

async function loadAvailableHours() {
    const data = document.getElementById('data').value;
    const barbeiroId = document.getElementById('barbeiro').value;
    const horaSelect = document.getElementById('hora');

    if (!data || !barbeiroId) return;

    try {
        const response = await fetch(`/api/api_horarios-disponiveis?data=${data}&barbeiro=${barbeiroId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const horariosDisponiveis = await response.json();

        horaSelect.innerHTML = '<option value="">Selecione uma hora</option>';
        
        if (horariosDisponiveis.length === 0) {
            horaSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
            return;
        }
        
        horariosDisponiveis.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            horaSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        horaSelect.innerHTML = '<option value="">Erro ao carregar horários</option>';
    }
}

// Submit do formulário
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        barbeiro_id: parseInt(document.getElementById('barbeiro').value),
        servico_id: parseInt(document.getElementById('servico').value),
        data: document.getElementById('data').value,
        hora: document.getElementById('hora').value,
        comentario: document.getElementById('comentario').value
    };

    try {
        const response = await fetch(`${API_BASE}/api_reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            document.querySelector('.booking-form').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        } else {
            const error = await response.json();
            showError(error.message || 'Erro ao criar reserva');
        }
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao processar reserva. Tente novamente.');
    }
});

function showError(message) {
    document.querySelector('.booking-form').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('errorText').textContent = message;
}
