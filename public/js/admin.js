let currentBarber = null;
let currentWeekStart = new Date();

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

// Carregar perfis de barbeiros
async function loadProfiles() {
    try {
        const response = await fetch('/api/admin/barbeiros', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        const barbeiros = await response.json();
        const grid = document.getElementById('profilesGrid');

        barbeiros.forEach(barbeiro => {
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
    } catch (error) {
        console.error('Erro:', error);
    }
}

function selectProfile(barberId) {
    currentBarber = barberId;
    document.getElementById('profileSelector').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
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
    // Carregar reservas do barbeiro
    try {
        const response = await fetch(`/api/admin/reservas?barbeiro=${currentBarber}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        const reservas = await response.json();
        displayCalendar(reservas);
    } catch (error) {
        console.error('Erro:', error);
    }
}

function displayCalendar(reservas) {
    // Implementar lógica de calendário
    console.log('Reservas:', reservas);
}

// Navegação de vistas
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const view = this.dataset.view;
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.view-content').forEach(v => v.style.display = 'none');
        document.getElementById(`${view}View`).style.display = 'block';
    });
});

function openNewBookingModal() {
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Nova Reserva';
    document.getElementById('bookingId').value = '';
    document.getElementById('deleteBtn').style.display = 'none';
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('bookingModalForm').reset();
}

// Inicializar
if (window.location.pathname.includes('admin-dashboard')) {
    if (!localStorage.getItem('adminToken')) {
        window.location.href = '/admin-login.html';
    } else {
        loadProfiles();
    }
}
