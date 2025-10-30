let currentBarber = null;
let currentWeekStart = new Date();
let allBarbeiros = [];
let allServicos = [];

// Login
document.getElementById('adminLoginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin-dashboard.html';
        } else {
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('loginError').textContent = 'Credenciais inválidas';
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer login');
    }
});

// Carregar serviços
async function loadServicos() {
    try {
        const response = await fetch('/api/servicos');
        if (!response.ok) {
            throw new Error('Erro ao carregar serviços');
        }
        allServicos = await response.json();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

// Carregar perfis de barbeiros
async function loadProfiles() {
    try {
        const response = await fetch('/api/barbeiros');

        if (!response.ok) {
            throw new Error('Erro ao carregar barbeiros');
        }

        allBarbeiros = await response.json();
        const grid = document.getElementById('profilesGrid');
        grid.innerHTML = '';

        allBarbeiros.forEach(barbeiro => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.onclick = () => selectProfile(barbeiro.id);
            
            card.innerHTML = `
                <div class="profile-avatar">
                    ${barbeiro.nome.charAt(0)}
                </div>
                <h3>${barbeiro.nome}</h3>
            `;

            grid.appendChild(card);
        });

        // Adicionar opção "Todos"
        const allCard = document.createElement('div');
        allCard.className = 'profile-card';
        allCard.onclick = () => selectProfile('all');
        allCard.innerHTML = `
            <div class="profile-avatar">
                <i class="fas fa-users"></i>
            </div>
            <h3>Todos os Barbeiros</h3>
        `;
        grid.appendChild(allCard);

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar barbeiros');
    }
}

function selectProfile(barberId) {
    currentBarber = barberId;
    document.getElementById('profileSelector').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
    
    // Atualizar nome do barbeiro no header
    if (barberId === 'all') {
        document.getElementById('currentBarberInfo').textContent = 'Todos os Barbeiros';
    } else {
        const barbeiro = allBarbeiros.find(b => b.id === barberId);
        if (barbeiro) {
            document.getElementById('currentBarberInfo').textContent = barbeiro.nome;
        }
    }
    
    loadDashboardData();
}

function changeProfile() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('profileSelector').style.display = 'flex';
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}

async function loadDashboardData() {
    try {
        let url = '/api/admin/reservas';
        if (currentBarber !== 'all') {
            url += `?barbeiro=${currentBarber}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar reservas');
        }

        const reservas = await response.json();
        displayReservasList(reservas);
        displayCalendar(reservas);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar reservas');
    }
}

function displayReservasList(reservas) {
    const container = document.getElementById('bookingsList');
    container.innerHTML = '';

    if (reservas.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma reserva encontrada.</p>';
        return;
    }

    // Filtrar apenas reservas futuras e ordenar por data
    const now = new Date();
    const futuras = reservas
        .filter(r => new Date(r.data_hora) >= now)
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    if (futuras.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma reserva futura encontrada.</p>';
        return;
    }

    futuras.forEach(reserva => {
        const card = document.createElement('div');
        card.className = 'booking-item';
        card.onclick = () => editBooking(reserva);
        
        const dataHora = new Date(reserva.data_hora);
        const dataFormatada = dataHora.toLocaleDateString('pt-PT');
        const horaFormatada = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <h4>${reserva.nome_cliente}</h4>
            <p><strong>Barbeiro:</strong> ${reserva.barbeiro_nome}</p>
            <p><strong>Serviço:</strong> ${reserva.servico_nome}</p>
            <p><strong>Data:</strong> ${dataFormatada} às ${horaFormatada}</p>
            <p><strong>Email:</strong> ${reserva.email}</p>
            ${reserva.telefone ? `<p><strong>Telefone:</strong> ${reserva.telefone}</p>` : ''}
            ${reserva.comentario ? `<p><em>"${reserva.comentario}"</em></p>` : ''}
            ${reserva.nota_privada ? `<p style="color: #e74c3c;"><strong>Nota:</strong> ${reserva.nota_privada}</p>` : ''}
        `;

        container.appendChild(card);
    });
}

function displayCalendar(reservas) {
    const container = document.getElementById('calendarGrid');
    container.innerHTML = '<p style="text-align: center; padding: 40px;">Vista de calendário em desenvolvimento...</p>';
    
    // Aqui podes adicionar a lógica do calendário semanal mais tarde
    // Por agora, a vista de lista é suficiente
}

function openNewBookingModal() {
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Nova Reserva';
    document.getElementById('bookingId').value = '';
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('bookingModalForm').reset();
    
    // Preencher barbeiros e serviços
    populateModalBarbeiros();
    populateModalServicos();
    
    // Definir data mínima como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalData').min = today;
}

function populateModalBarbeiros() {
    const select = document.getElementById('modalBarbeiro');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    allBarbeiros.forEach(b => {
        const option = document.createElement('option');
        option.value = b.id;
        option.textContent = b.nome;
        select.appendChild(option);
    });
}

function populateModalServicos() {
    const select = document.getElementById('modalServico');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    allServicos.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.nome;
        select.appendChild(option);
    });
}

function editBooking(reserva) {
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Editar Reserva';
    document.getElementById('bookingId').value = reserva.id;
    document.getElementById('deleteBtn').style.display = 'block';
    
    populateModalBarbeiros();
    populateModalServicos();
    
    // Preencher dados
    document.getElementById('modalNome').value = reserva.nome_cliente;
    document.getElementById('modalEmail').value = reserva.email;
    document.getElementById('modalTelefone').value = reserva.telefone || '';
    document.getElementById('modalBarbeiro').value = reserva.barbeiro_id;
    document.getElementById('modalServico').value = reserva.servico_id;
    
    const dataHora = new Date(reserva.data_hora);
    document.getElementById('modalData').value = dataHora.toISOString().split('T')[0];
    document.getElementById('modalHora').value = dataHora.toTimeString().slice(0, 5);
    
    document.getElementById('modalComentario').value = reserva.comentario || '';
    document.getElementById('modalNotaPrivada').value = reserva.nota_privada || '';
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('bookingModalForm').reset();
}

async function deleteBooking() {
    const id = document.getElementById('bookingId').value;
    
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/reservas?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            alert('Reserva cancelada com sucesso!');
            closeModal();
            loadDashboardData();
        } else {
            throw new Error('Erro ao cancelar reserva');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cancelar reserva');
    }
}

// Form submit do modal
document.getElementById('bookingModalForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('bookingId').value;
    const data = {
        nome: document.getElementById('modalNome').value,
        email: document.getElementById('modalEmail').value,
        telefone: document.getElementById('modalTelefone').value,
        barbeiro_id: parseInt(document.getElementById('modalBarbeiro').value),
        servico_id: parseInt(document.getElementById('modalServico').value),
        data_hora: `${document.getElementById('modalData').value}T${document.getElementById('modalHora').value}:00`,
        comentario: document.getElementById('modalComentario').value,
        nota_privada: document.getElementById('modalNotaPrivada').value
    };

    try {
        let response;
        if (id) {
            // Editar
            data.id = parseInt(id);
            response = await fetch('/api/admin/reservas', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });
        } else {
            // Criar nova reserva
            response = await fetch('/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: data.nome,
                    email: data.email,
                    telefone: data.telefone,
                    barbeiro_id: data.barbeiro_id,
                    servico_id: data.servico_id,
                    data: data.data_hora.split('T')[0],
                    hora: data.data_hora.split('T')[1].slice(0, 5),
                    comentario: data.comentario
                })
            });
        }

        if (response.ok) {
            alert('Reserva salva com sucesso!');
            closeModal();
            loadDashboardData();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar reserva');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar reserva: ' + error.message);
    }
});

// Navegação de vistas
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const view = this.dataset.view;
        
        if (!view) return;
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.view-content').forEach(v => v.style.display = 'none');
        const viewElement = document.getElementById(`${view}View`);
        if (viewElement) {
            viewElement.style.display = 'block';
        }

        // Atualizar título do dashboard
        const titles = {
            'calendar': 'Calendário Semanal',
            'list': 'Lista de Reservas',
            'all': 'Todas as Reservas'
        };
        document.getElementById('dashboardTitle').textContent = titles[view] || 'Dashboard';
    });
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Inicializar
if (window.location.pathname.includes('admin-dashboard')) {
    if (!localStorage.getItem('adminToken')) {
        window.location.href = '/admin-login.html';
    } else {
        loadServicos();
        loadProfiles();
    }
}
