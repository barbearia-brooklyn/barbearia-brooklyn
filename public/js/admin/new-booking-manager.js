/**
 * Brooklyn Barbearia - New Booking Manager
 * Handles creating new reservas from admin panel
 */

// Initialize booking form on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewBooking);
} else {
    initNewBooking();
}

/**
 * Initialize new booking form
 */
async function initNewBooking() {
    try {
        // Verify API is loaded
        if (!window.api) {
            console.error('❌ API client not loaded');
            alert('Erro: Cliente API não foi carregado. Por favor, recarregue a página.');
            return;
        }

        // Load barbeiros
        await loadBarbeiros();

        // Load servicos
        await loadServicos();

        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookingDate').min = today;
        document.getElementById('bookingDate').value = today;

        // Setup form submission
        setupFormHandler();

        console.log('✅ New booking form initialized');
    } catch (error) {
        console.error('❌ Error initializing form:', error);
        alert('Erro ao carregar dados do formulário. Por favor, recarregue a página.');
    }
}

/**
 * Load barbeiros into dropdown
 */
async function loadBarbeiros() {
    try {
        const response = await window.api.barbeiros.getAll();
        const barbeiros = response.barbeiros || response || [];

        const barberSelect = document.getElementById('bookingBarber');
        barberSelect.innerHTML = '<option value="">Selecione um barbeiro</option>';
        
        barbeiros.forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            barberSelect.appendChild(option);
        });

        console.log(`✅ Loaded ${barbeiros.length} barbeiros`);
    } catch (error) {
        console.error('❌ Error loading barbeiros:', error);
        throw error;
    }
}

/**
 * Load servicos into dropdown
 */
async function loadServicos() {
    try {
        const response = await window.api.servicos.getAll();
        const servicos = response.servicos || response || [];

        const serviceSelect = document.getElementById('bookingService');
        serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';
        
        servicos.forEach(servico => {
            const option = document.createElement('option');
            option.value = servico.id;
            option.textContent = `${servico.nome} - €${servico.preco}`;
            serviceSelect.appendChild(option);
        });

        console.log(`✅ Loaded ${servicos.length} servicos`);
    } catch (error) {
        console.error('❌ Error loading servicos:', error);
        throw error;
    }
}

/**
 * Setup form submission handler
 */
function setupFormHandler() {
    const form = document.getElementById('newBookingForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar...';

        try {
            // Validate form data
            const formData = {
                barbeiro_id: parseInt(document.getElementById('bookingBarber').value),
                data_hora: `${document.getElementById('bookingDate').value}T${document.getElementById('bookingTime').value}:00`,
                servico_id: parseInt(document.getElementById('bookingService').value),
                cliente_nome: document.getElementById('clientName').value,
                cliente_telefone: document.getElementById('clientPhone').value,
                cliente_email: document.getElementById('clientEmail').value || null,
                notas: document.getElementById('bookingNotes').value || null,
                notificar_email: document.getElementById('notifyEmail').checked,
                notificar_lembrete: document.getElementById('notifyReminder').checked
            };

            // Validate required fields
            if (!formData.barbeiro_id || !formData.servico_id || !formData.cliente_nome || !formData.cliente_telefone) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.');
            }

            // Create reserva
            const response = await window.api.reservas.create(formData);
            console.log('✅ Reserva created successfully:', response);

            // Success feedback
            alert('✅ Reserva criada com sucesso!');
            window.location.href = '/admin/reservations.html';
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            alert(`❌ Erro ao criar reserva: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}
