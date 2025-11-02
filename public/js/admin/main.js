/**
 * Inicialização do dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando dashboard...');

    // Verificar autenticação
    AuthManager.checkAuth();

    // Hamburger menu (Mobile)
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');

    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            sidebar.classList.toggle('active');
        });

        // Fechar menu ao clicar em um nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                hamburger.classList.remove('active');
                sidebar.classList.remove('active');
            });
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                sidebar.classList.remove('active');
            }
        });
    }

    // Inicializar módulos
    UIHelper;
    CalendarManager.init();
    ProfileManager.init();
    ReservationManager.init();
    ModalManager.init();

    // Mostrar view de perfis por padrão
    ProfileManager.showProfilesView();

    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;

            switch(view) {
                case 'profiles':
                    ProfileManager.showProfilesView();
                    break;
                case 'calendar':
                    if (ProfileManager.getSelectedBarber() === null) {
                        UIHelper.showAlert('Selecione um perfil primeiro', 'info');
                        ProfileManager.showProfilesView();
                    }
                    break;
                case 'list':
                    ReservationManager.showListView();
                    break;
                case 'new-booking':
                    ReservationManager.showNewBookingView();
                    break;
            }
        });
    });
    console.log('Dashboard inicializado com sucesso');
});
