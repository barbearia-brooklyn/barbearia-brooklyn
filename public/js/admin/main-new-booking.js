/**
 * New Booking Page Initialization
 */

loadHeaderComponent();

function loadHeaderComponent() {
    fetch('/admin/header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('headerContainer').innerHTML = html;
            setupHeaderEventListeners();
        })
        .catch(error => console.error('Erro ao carregar header:', error));
}

function setupHeaderEventListeners() {
    if (typeof AuthManager !== 'undefined') AuthManager.checkAuth();

    const profileToggle = document.getElementById('profileToggle');
    const profileMenu = document.getElementById('profileMenu');

    if (profileToggle) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu?.classList.toggle('active');
            loadProfilesList();
        });

        document.addEventListener('click', (e) => {
            if (!profileToggle.contains(e.target) && !profileMenu?.contains(e.target)) {
                profileMenu?.classList.remove('active');
            }
        });
    }

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (typeof AuthManager !== 'undefined') AuthManager.logout();
    });

    updateNavItems();
    initializeNewBooking();
}

function loadProfilesList() {
    if (typeof ProfileManager === 'undefined') return;

    const profilesList = document.getElementById('profilesList');
    if (!profilesList) return;
    profilesList.innerHTML = '';

    const barbeiros = ProfileManager.getBarbeiros();
    const selectedBarber = ProfileManager.getSelectedBarber();

    barbeiros.forEach(barber => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'profile-menu-item' + (selectedBarber === barber.id ? ' active' : '');
        item.innerHTML = `<i class="fas fa-check" style="opacity: ${selectedBarber === barber.id ? 1 : 0}"></i><span>${barber.nome}</span>`;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            ProfileManager.selectBarber(barber.id);
            document.getElementById('currentBarberName').textContent = barber.nome;
            document.getElementById('profileMenu').classList.remove('active');
        });
        profilesList.appendChild(item);
    });
}

function updateNavItems() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('[data-view="new-booking"]')?.classList.add('active');
}

function initializeNewBooking() {
    if (typeof ProfileManager === 'undefined') return;

    let selectedBarber = ProfileManager.getSelectedBarber();
    const barbeiros = ProfileManager.getBarbeiros();

    if (!selectedBarber && barbeiros.length > 0) {
        selectedBarber = barbeiros[0].id;
        ProfileManager.selectBarber(selectedBarber);
        document.getElementById('currentBarberName').textContent = barbeiros[0].nome;
    }
}
