/**
 * Reservations Page Initialization
 */

loadHeaderComponent();

function loadHeaderComponent() {
    fetch('/admin/header.html')
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('headerContainer');
            if (container) {
                container.innerHTML = html;
                setupHeaderEventListeners();
            }
        })
        .catch(error => console.error('Erro ao carregar header:', error));
}

function setupHeaderEventListeners() {
    if (typeof AuthManager !== 'undefined') {
        AuthManager.checkAuth();
    }

    const profileToggle = document.getElementById('profileToggle');
    const profileMenu = document.getElementById('profileMenu');

    if (profileToggle && profileMenu) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
            loadProfilesList();
        });

        document.addEventListener('click', (e) => {
            if (!profileToggle.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (typeof AuthManager !== 'undefined') {
            AuthManager.logout();
        }
    });

    updateNavItems();
    initializeReservationsPage();
}

function loadProfilesList() {
    const profilesList = document.getElementById('profilesList');
    if (!profilesList) return;

    profilesList.innerHTML = '';
    
    if (typeof ProfileManager === 'undefined') return;

    const barbeiros = ProfileManager.getBarbeiros();
    const selectedBarber = ProfileManager.getSelectedBarber();

    barbeiros.forEach(barber => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'profile-menu-item';
        if (selectedBarber === barber.id) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <i class="fas fa-check" style="opacity: ${selectedBarber === barber.id ? 1 : 0}"></i>
            <span>${barber.nome}</span>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            ProfileManager.selectBarber(barber.id);
            document.getElementById('currentBarberName').textContent = barber.nome;
            document.getElementById('profileMenu').classList.remove('active');
            loadReservations();
        });

        profilesList.appendChild(item);
    });
}

function updateNavItems() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-view="list"]')?.classList.add('active');
}

function initializeReservationsPage() {
    if (typeof ReservationsManager === 'undefined') {
        console.error('ReservationsManager not loaded');
        return;
    }

    if (typeof ProfileManager === 'undefined') {
        console.error('ProfileManager not loaded');
        return;
    }

    ReservationsManager.init();
    
    let selectedBarber = ProfileManager.getSelectedBarber();
    const barbeiros = ProfileManager.getBarbeiros();

    if (!selectedBarber && barbeiros.length > 0) {
        selectedBarber = barbeiros[0].id;
        ProfileManager.selectBarber(selectedBarber);
        document.getElementById('currentBarberName').textContent = barbeiros[0].nome;
    }

    // Load reservations list
    loadReservations();
}

function loadReservations() {
    if (typeof ReservationsManager !== 'undefined') {
        ReservationsManager.loadReservations();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Reservations page loaded');
});
