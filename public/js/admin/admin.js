/**
 * Inicialização do dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    AuthManager.checkAuth();

    // Inicializar módulos
    UIHelper;  // Já inicializado no carregamento
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
});
