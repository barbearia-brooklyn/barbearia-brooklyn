let currentBarber = null;
let currentWeekStart = new Date();
let currentDayView = new Date();
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
    
    // Resetar para semana/dia atual
    currentWeekStart = getStartOfWeek(new Date());
    currentDayView = new Date();
    
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
        displayAllBookingsDailyView(reservas);
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

// Funções auxiliares
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadDashboardData();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadDashboardData();
}

function previousDay() {
    currentDayView.setDate(currentDayView.getDate() - 1);
    loadDashboardData();
}

function nextDay() {
    currentDayView.setDate(currentDayView.getDate() + 1);
    loadDashboardData();
}

function goToToday() {
    currentDayView = new Date();
    loadDashboardData();
}

function getServicoDuracao(servicoId) {
    const servico = allServicos.find(s => s.id === servicoId);
    return servico ? servico.duracao : 60;
}

function calculatePositionAndHeight(startTime, duracao) {
    const [hora, minuto] = startTime.split(':').map(Number);
    const totalMinutos = (hora * 60) + minuto;
    const minutosDesde10h = totalMinutos - (10 * 60);
    
    const pixelsPorMinuto = 80 / 60;
    const top = minutosDesde10h * pixelsPorMinuto;
    const height = duracao * pixelsPorMinuto;
    
    return { top, height };
}

function getBarberColor(barberId) {
    const colors = ['#d4af7a', '#7ab8d4', '#d47a7a', '#7ad4af', '#b87ad4'];
    return colors[(barberId - 1) % colors.length];
}

function getBarberColorDark(barberId) {
    const colors = ['#b8934f', '#5a97b3', '#b35555', '#55b38e', '#9555b3'];
    return colors[(barberId - 1) % colors.length];
}

// Display calendário semanal
function displayCalendar(reservas) {
    const container = document.getElementById('calendarGrid');
    const weekDisplay = document.getElementById('weekDisplay');
    
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    weekDisplay.textContent = `${formatDate(currentWeekStart)} - ${formatDate(endOfWeek)}`;
    
    container.innerHTML = '';
    
    const calendarWrapper = document.createElement('div');
    calendarWrapper.className = 'calendar-wrapper';
    
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-day-container';
    
    // Coluna de horários
    const timeColumn = createTimeColumn();
    calendarContainer.appendChild(timeColumn);
    
    // Colunas dos dias
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    for (let i = 0; i < 6; i++) {
        const dia = new Date(currentWeekStart);
        dia.setDate(dia.getDate() + i);
        const diaISO = formatDateISO(dia);
        const column = createDayColumn(dia, diasSemana[i], reservas, diaISO);
        calendarContainer.appendChild(column);
    }
    
    calendarWrapper.appendChild(calendarContainer);
    container.appendChild(calendarWrapper);
}

function createTimeColumn() {
    const column = document.createElement('div');
    column.className = 'calendar-time-column';
    
    const header = document.createElement('div');
    header.className = 'calendar-time-header';
    column.appendChild(header);
    
    const horarios = [10, 11, 12, 14, 15, 16, 17, 18, 19];
    
    horarios.forEach(h => {
        const slot = document.createElement('div');
        slot.className = 'calendar-time-slot';
        slot.textContent = `${h.toString().padStart(2, '0')}:00`;
        column.appendChild(slot);
    });
    
    return column;
}

function createDayColumn(dia, diaNome, reservas, diaISO) {
    const column = document.createElement('div');
    column.className = 'calendar-day-column';
    
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    const diaFormatado = dia.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    header.innerHTML = `<strong>${diaNome}</strong><small>${diaFormatado}</small>`;
    column.appendChild(header);
    
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'calendar-slots-container';
    slotsContainer.style.height = '720px';
    
    // Backgrounds
    const horarios = [10, 11, 12, 14, 15, 16, 17, 18, 19];
    horarios.forEach(() => {
        const bg = document.createElement('div');
        bg.className = 'calendar-slot-background';
        slotsContainer.appendChild(bg);
    });
    
    // Reservas
    const reservasDia = reservas.filter(r => formatDateISO(new Date(r.data_hora)) === diaISO)
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
    
    reservasDia.forEach(reserva => {
        const booking = createBookingElement(reserva);
        slotsContainer.appendChild(booking);
    });
    
    column.appendChild(slotsContainer);
    return column;
}

function createBookingElement(reserva) {
    const dataHora = new Date(reserva.data_hora);
    const hora = dataHora.toTimeString().slice(0, 5);
    const duracao = getServicoDuracao(reserva.servico_id);
    const { top, height } = calculatePositionAndHeight(hora, duracao);
    const cor = getBarberColor(reserva.barbeiro_id);
    const corBorda = getBarberColorDark(reserva.barbeiro_id);
    
    const div = document.createElement('div');
    div.className = 'calendar-booking';
    div.style.top = `${top}px`;
    div.style.height = `${height}px`;
    div.style.backgroundColor = cor;
    div.style.borderLeft = `3px solid ${corBorda}`;
    div.onclick = () => editBooking(reserva);
    
    div.innerHTML = `
        <strong>${reserva.nome_cliente}</strong>
        <small>${reserva.barbeiro_nome}</small>
        <small style="color: #555;">${duracao}min</small>
    `;
    
    return div;
}

// Display vista diária (todos os barbeiros)
function displayAllBookingsDailyView(reservas) {
    const container = document.getElementById('allBookings');
    container.innerHTML = '';
    
    const controls = document.createElement('div');
    controls.className = 'calendar-controls';
    controls.innerHTML = `
        <button onclick="previousDay()" class="btn-nav">
            <i class="fas fa-chevron-left"></i> Dia Anterior
        </button>
        <div>
            <span id="dayDisplay" style="font-weight: bold; font-size: 1.2em;"></span>
            <button onclick="goToToday()" class="btn-nav" style="margin-left: 10px;">
                Hoje
            </button>
        </div>
        <button onclick="nextDay()" class="btn-nav">
            Próximo Dia <i class="fas fa-chevron-right"></i>
        </button>
    `;
    container.appendChild(controls);
    
    const dayDisplay = document.getElementById('dayDisplay');
    dayDisplay.textContent = currentDayView.toLocaleDateString('pt-PT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const diaISO = formatDateISO(currentDayView);
    const reservasDia = reservas.filter(r => formatDateISO(new Date(r.data_hora)) === diaISO);
    
    if (reservasDia.length === 0) {
        container.innerHTML += '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma reserva neste dia.</p>';
        return;
    }
    
    const calendarWrapper = document.createElement('div');
    calendarWrapper.className = 'calendar-wrapper';
    calendarWrapper.style.marginTop = '20px';
    
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-day-container';
    
    // Coluna de horários
    const timeColumn = createTimeColumn();
    calendarContainer.appendChild(timeColumn);
    
    // Colunas dos barbeiros
    allBarbeiros.forEach(barbeiro => {
        const column = createBarberColumn(barbeiro, reservasDia, diaISO);
        calendarContainer.appendChild(column);
    });
    
    calendarWrapper.appendChild(calendarContainer);
    container.appendChild(calendarWrapper);
}

function createBarberColumn(barbeiro, reservasDia, diaISO) {
    const column = document.createElement('div');
    column.className = 'calendar-barber-column';
    
    const header = document.createElement('div');
    header.className = 'calendar-barber-header';
    header.style.backgroundColor = getBarberColor(barbeiro.id);
    header.style.color = '#333';
    header.innerHTML = `<strong>${barbeiro.nome}</strong>`;
    column.appendChild(header);
    
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'calendar-slots-container';
    slotsContainer.style.height = '720px';
    
    // Backgrounds
    const horarios = [10, 11, 12, 14, 15, 16, 17, 18, 19];
    horarios.forEach(() => {
        const bg = document.createElement('div');
        bg.className = 'calendar-slot-background';
        slotsContainer.appendChild(bg);
    });
    
    // Reservas deste barbeiro
    const reservasBarbeiro = reservasDia.filter(r => r.barbeiro_id === barbeiro.id)
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
    
    reservasBarbeiro.forEach(reserva => {
        const booking = createBookingElement(reserva);
        slotsContainer.appendChild(booking);
    });
    
    column.appendChild(slotsContainer);
    return column;
}

// Modal functions
function openNewBookingModal() {
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Nova Reserva';
    document.getElementById('bookingId').value = '';
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('bookingModalForm').reset();
    
    populateModalBarbeiros();
    populateModalServicos();
    
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
        option.textContent = `${s.nome} (${s.duracao} min)`;
        select.appendChild(option);
    });
}

function editBooking(reserva) {
    if (typeof reserva === 'string') {
        reserva = JSON.parse(reserva);
    }
    
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Editar Reserva';
    document.getElementById('bookingId').value = reserva.id;
    document.getElementById('deleteBtn').style.display = 'block';
    
    populateModalBarbeiros();
    populateModalServicos();
    
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

// Form submit
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

        const titles = {
            'calendar': 'Calendário Semanal',
            'list': 'Lista de Reservas',
            'all': 'Vista Diária - Todos os Barbeiros'
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

