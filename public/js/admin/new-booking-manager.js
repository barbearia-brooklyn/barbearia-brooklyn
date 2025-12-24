/**
 * New Booking Manager
 * Gerencia criação de novas reservas
 */

const NewBookingManager = {
    services: [
        { id: 'corte', name: 'Corte de Cabelo', duration: 30, price: 15 },
        { id: 'barba', name: 'Barba', duration: 20, price: 10 },
        { id: 'corte-barba', name: 'Corte + Barba', duration: 45, price: 25 },
        { id: 'design', name: 'Design de Barba', duration: 30, price: 20 }
    ],
    barbers: [],
    apiBase: '/api/admin',

    init() {
        console.log('Inicializando NewBookingManager...');
        this.setupEventListeners();
        this.loadBarbers();
        this.setMinDate();
    },

    setupEventListeners() {
        const form = document.getElementById('newBookingForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    async loadBarbers() {
        try {
            if (typeof ProfileManager !== 'undefined') {
                this.barbers = ProfileManager.getBarbeiros();
            } else {
                this.barbers = [
                    { id: 1, nome: 'Barbeiro 1' },
                    { id: 2, nome: 'Barbeiro 2' },
                    { id: 3, nome: 'Barbeiro 3' }
                ];
            }
            this.populateBarberSelect();
        } catch (error) {
            console.error('Erro ao carregar barbeiros:', error);
        }
    },

    populateBarberSelect() {
        const select = document.getElementById('bookingBarber');
        if (!select) return;

        this.barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = barber.nome;
            select.appendChild(option);
        });
    },

    setMinDate() {
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        const barberId = document.getElementById('bookingBarber').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const serviceId = document.getElementById('bookingService').value;
        const clientName = document.getElementById('clientName').value;
        const clientPhone = document.getElementById('clientPhone').value;
        const clientEmail = document.getElementById('clientEmail').value;
        const notes = document.getElementById('bookingNotes').value;
        const notifyEmail = document.getElementById('notifyEmail').checked;
        const notifyReminder = document.getElementById('notifyReminder').checked;

        // Validations
        if (!barberId || !date || !time || !serviceId || !clientName || !clientPhone) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Validate phone
        if (!/^\d{9,}$/.test(clientPhone.replace(/[\s-]/g, ''))) {
            alert('Por favor, insira um número de telefone válido');
            return;
        }

        // Get service details
        const service = this.services.find(s => s.id === serviceId);
        const barber = this.barbers.find(b => b.id == barberId);

        // Create booking object
        const booking = {
            id: Date.now(),
            barberId: parseInt(barberId),
            barberName: barber.nome,
            date: new Date(`${date}T${time}`),
            serviceId: serviceId,
            serviceName: service.name,
            duration: service.duration,
            price: service.price,
            clientName: clientName,
            clientPhone: clientPhone,
            clientEmail: clientEmail,
            notes: notes,
            status: 'pending',
            notifications: {
                email: notifyEmail,
                reminder: notifyReminder
            },
            createdAt: new Date()
        };

        // TODO: Send to API
        console.log('Nova reserva criada:', booking);

        // Show success message
        alert(`Reserva criada com sucesso!\n\nCliente: ${clientName}\nData: ${date} às ${time}\nServiço: ${service.name}\nPreço: €${service.price.toFixed(2)}`);

        // Reset form
        e.target.reset();
    }
};
