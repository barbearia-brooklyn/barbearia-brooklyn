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
    
    // Resetar para semana atual
    currentWeekStart = getStartOfWeek(new Date());
    
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
        displayAllBookings(reservas);
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

// Funções auxiliares para calendário
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

// Navegação de semanas
function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadDashboardData();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadDashboardData();
}

// Display do calendário semanal
function displayCalendar(reservas) {
    const container = document.getElementById('calendarGrid');
    const weekDisplay = document.getElementById('weekDisplay');
    
    // Calcular fim da semana
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    weekDisplay.textContent = `${formatDate(currentWeekStart)} - ${formatDate(endOfWeek)}`;
    
    // Criar estrutura do calendário
    container.innerHTML = '';
    
    const calendarTable = document.createElement('div');
    calendarTable.style.overflowX = 'auto';
    
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
                <tr style="background-color: var(--primary-green); color: white;">
                    <th style="padding: 15px; border: 1px solid #ddd; min-width: 80px;">Hora</th>
    `;
    
    // Cabeçalho com dias da semana
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    for (let i = 0; i < 6; i++) {
        const dia = new Date(currentWeekStart);
        dia.setDate(dia.getDate() + i);
        const diaNome = diasSemana[i];
        const diaFormatado = dia.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        
        tableHTML += `<th style="padding: 15px; border: 1px solid #ddd; min-width: 150px;">
            ${diaNome}<br><small>${diaFormatado}</small>
        </th>`;
    }
    
    tableHTML += `</tr></thead><tbody>`;
    
    // Horários (10h-20h, com pausa 13h-14h)
    const horarios = [];
    for (let h = 10; h < 20; h++) {
        if (h !== 13) {
            horarios.push(`${h.toString().padStart(2, '0')}:00`);
        }
    }
    
    // Criar mapa de reservas por data e hora
    const reservasMap = {};
    reservas.forEach(reserva => {
        const dataHora = new Date(reserva.data_hora);
        const dataISO = formatDateISO(dataHora);
        const hora = dataHora.toTimeString().slice(0, 5);
        
        if (!reservasMap[dataISO]) {
            reservasMap[dataISO] = {};
        }
        if (!reservasMap[dataISO][hora]) {
            reservasMap[dataISO][hora] = [];
        }
        reservasMap[dataISO][hora].push(reserva);
    });
    
    // Preencher linhas do calendário
    horarios.forEach(hora => {
        tableHTML += `<tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f5f5f5;">${hora}</td>`;
        
        for (let i = 0; i < 6; i++) {
            const dia = new Date(currentWeekStart);
            dia.setDate(dia.getDate() + i);
            const diaISO = formatDateISO(dia);
            
            const reservasDia = reservasMap[diaISO]?.[hora] || [];
            
            let cellContent = '';
            if (reservasDia.length > 0) {
                reservasDia.forEach(reserva => {
                    const cor = getBarberColor(reserva.barbeiro_id);
                    cellContent += `
                        <div onclick="editBooking(${JSON.stringify(reserva).replace(/"/g, '&quot;')})" 
                             style="background-color: ${cor}; padding: 5px; margin: 2px 0; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                            <strong>${reserva.nome_cliente}</strong><br>
                            <small>${reserva.barbeiro_nome}</small>
                        </div>
                    `;
                });
            }
            
            tableHTML += `<td style="padding: 5px; border: 1px solid #ddd; vertical-align: top; min-height: 60px;">${cellContent}</td>`;
        }
        
        tableHTML += `</tr>`;
    });
    
    tableHTML += `</tbody></table>`;
    
    calendarTable.innerHTML = tableHTML;
    container.appendChild(calendarTable);
}

// Cores diferentes por barbeiro
function getBarberColor(barberId) {
    const colors = [
        '#d4af7a', // dourado
        '#7ab8d4', // azul claro
        '#d47a7a', // vermelho claro
        '#7ad4af', // verde claro
        '#b87ad4'  // roxo claro
    ];
    return colors[(barberId - 1) % colors.length];
}

// Display de todas as reservas (vista geral)
function displayAllBookings(reservas) {
    const container = document.getElementById('allBookings');
    container.innerHTML = '';
    
    // Agrupar reservas por data
    const reservasPorData = {};
    const now = new Date();
    
    reservas
        .filter(r => new Date(r.data_hora) >= now)
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
        .forEach(reserva => {
            const dataHora = new Date(reserva.data_hora);
            const dataStr = dataHora.toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            if (!reservasPorData[dataStr]) {
                reservasPorData[dataStr] = [];
            }
            reservasPorData[dataStr].push(reserva);
        });
    
    if (Object.keys(reservasPorData).length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma reserva futura encontrada.</p>';
        return;
    }
    
    // Criar cards por dia
    Object.entries(reservasPorData).forEach(([data, reservasDia]) => {
        const daySection = document.createElement('div');
        daySection.style.marginBottom = '30px';
        
        const dayTitle = document.createElement('h3');
        dayTitle.textContent = data.charAt(0).toUpperCase() + data.slice(1);
        dayTitle.style.color = 'var(--primary-green)';
        dayTitle.style.marginBottom = '15px';
        daySection.appendChild(dayTitle);
        
        const reservasGrid = document.createElement('div');
        reservasGrid.style.display = 'grid';
        reservasGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        reservasGrid.style.gap = '15px';
        
        reservasDia.forEach(reserva => {
            const card = document.createElement('div');
            card.className = 'booking-item';
            card.onclick = () => editBooking(reserva);
            
            const dataHora = new Date(reserva.data_hora);
            const horaFormatada = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0;">${reserva.nome_cliente}</h4>
                    <span style="background: var(--primary-green); color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.9em;">${horaFormatada}</span>
                </div>
                <p><strong>Barbeiro:</strong> ${reserva.barbeiro_nome}</p>
                <p><strong>Serviço:</strong> ${reserva.servico_nome}</p>
                ${reserva.telefone ? `<p><strong>Tel:</strong> ${reserva.telefone}</p>` : ''}
            `;
            
            reservasGrid.appendChild(card);
        });
        
        daySection.appendChild(reservasGrid);
        container.appendChild(daySection);
    });
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
    // Se reserva for string (do onclick do HTML), fazer parse
    if (typeof reserva === 'string') {
        reserva = JSON.parse(reserva);
    }
    
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
