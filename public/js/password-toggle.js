/**
 * Password Toggle Utility
 * Adiciona automaticamente ícone de olho para mostrar/ocultar password
 * em todos os campos de password da página
 */

(function() {
    'use strict';

    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPasswordToggles);
    } else {
        initPasswordToggles();
    }

    function initPasswordToggles() {
        // Encontrar todos os inputs type="password"
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        
        passwordInputs.forEach(input => {
            // Verificar se já tem toggle (evitar duplicação)
            if (input.parentElement.classList.contains('password-wrapper')) {
                return;
            }

            // Criar wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'password-wrapper';
            
            // Substituir input pelo wrapper
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            // Criar botão toggle
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.setAttribute('aria-label', 'Mostrar password');
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            
            // Adicionar toggle ao wrapper
            wrapper.appendChild(toggleBtn);

            // Adicionar evento de click
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                togglePasswordVisibility(input, toggleBtn);
            });
        });
    }

    function togglePasswordVisibility(input, button) {
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            // Mostrar password
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            button.setAttribute('aria-label', 'Ocultar password');
        } else {
            // Ocultar password
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            button.setAttribute('aria-label', 'Mostrar password');
        }
    }

    // Exportar função para reinicializar (para conteúdo dinâmico)
    window.initPasswordToggles = initPasswordToggles;
})();
