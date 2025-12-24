/**
 * Calendar Manager
 * Gerencia visualização do calendário com vista geral e individual
 */

const CalendarManager = {
    currentView: 'general', // 'general' ou 'individual'
    selectedBarber: null,
    currentWeekStart: new Date(),
    bookings: [],
    unavailable: [],
    barbers: [],
    apiBase: '/api/admin',

    init() {
        console.log('Inicializando CalendarManager...');
        this.setupEventListeners();
        this.loadBarbers();
        this.loadCalendarData();
    },

    setupEventListeners() {
        // View switcher
        document.getElementById('viewGeneralBtn')?.addEventListener('click', () => this.switchView('general'));
        document.getElementById('viewIndividualBtn')?.addEventListener('click', () => this.switchView('individual'));

        // Barber selector
        document.getElementById('barberSelect')?.addEventListener('change', (e) => {
            this.selectedBarber = e.target.value;
            this.renderIndividualView();
        });

        // Week navigation
        document.getElementById('prevWeekBtn')?.addEventListener('click', () => this.previousWeek());
        document.getElementById('nextWeekBtn')?.addEventListener('click', () => this.nextWeek());
    },

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) btn.classList.add('active');
        });

        // Show/hide containers
        document.getElementById('generalViewContainer').style.display = view === 'general' ? 'block' : 'none';
        document.getElementById('individualViewContainer').style.display = view === 'individual' ? 'block' : 'none';
        document.getElementById('barberSelectorWrapper').style.display = view === 'individual' ? 'flex' : 'none';
        document.getElementById('weekNavigation').style.display = view === 'individual' ? 'flex' : 'none';

        if (view === 'general') {
            this.renderGeneralView();
        } else {
            if (!this.selectedBarber && this.barbers.length > 0) {
                this.selectedBarber = this.barbers[0].id;
                document.getElementById('barberSelect').value = this.selectedBarber;
            }
            this.renderIndividualView();
        }
    },

    async loadBarbers() {
        try {
            if (typeof ProfileManager !== 'undefined') {
                this.barbers = ProfileManager.getBarbeiros();
                this.populateBarberSelect();
            }
        } catch (error) {
            console.error('Erro ao carregar barbeiros:', error);
            this.barbers = [
                { id: 1, nome: 'Barbeiro 1' },
                { id: 2, nome: 'Barbeiro 2' },
                { id: 3, nome: 'Barbeiro 3' }
            ];
            this.populateBarberSelect();
        }
    },

    populateBarberSelect() {
        const select = document.getElementById('barberSelect');
        if (!select) return;

        this.barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = barber.nome;
            select.appendChild(option);
        });
    },

    async loadCalendarData() {
        try {
            // Mock data - será substituído por API real
            this.bookings = [
                { id: 1, barberId: 1, customerName: 'João Silva', service: 'Corte', date: new Date(2025, 11, 24, 10, 0), duration: 30, status: 'confirmed' },
                { id: 2, barberId: 2, customerName: 'Pedro Santos', service: 'Corte + Barba', date: new Date(2025, 11, 24, 11, 0), duration: 45, status: 'confirmed' },
                { id: 3, barberId: 1, customerName: 'Miguel Costa', service: 'Corte', date: new Date(2025, 11, 24, 14, 0), duration: 30, status: 'pending' },
                { id: 4, barberId: 3, customerName: 'Carlos Lima', service: 'Barba', date: new Date(2025, 11, 24, 15, 30), duration: 20, status: 'confirmed' },
                { id: 5, barberId: 2, customerName: 'Fernando Dias', service: 'Corte', date: new Date(2025, 11, 25, 9, 0), duration: 30, status: 'confirmed' }
            ];

            this.unavailable = [
                { id: 101, barberId: 1, date: new Date(2025, 11, 24, 12, 0), duration: 60, reason: 'Almoço' },
                { id: 102, barberId: 3, date: new Date(2025, 11, 24, 13, 0), duration: 30, reason: 'Reunião' }
            ];

            this.renderGeneralView();
        } catch (error) {
            console.error('Erro ao carregar dados do calendário:', error);
        }
    },

    renderGeneralView() {
        const container = document.getElementById('calendarGridGeneral');
        if (!container) return;

        const grid = document.createElement('div');
        grid.className = 'calendar-grid-general';

        // Time column header
        const timeHeader = document.createElement('div');
        timeHeader.className = 'calendar-time-slot header';
        timeHeader.textContent = 'Hora';
        grid.appendChild(timeHeader);

        // Barber columns header
        this.barbers.forEach(barber => {
            const header = document.createElement('div');
            header.className = 'calendar-time-slot day-header';
            header.innerHTML = `<div class="day-name">${barber.nome}</div>`;
            grid.appendChild(header);
        });

        // Time slots (9:00 to 19:00 in 30-minute intervals)
        const startHour = 9;
        const endHour = 19;

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 30) {
                // Time label
                const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                const timeSlot = document.createElement('div');
                timeSlot.className = 'calendar-time-slot time';
                timeSlot.textContent = timeStr;
                grid.appendChild(timeSlot);

                // Booking slots for each barber
                this.barbers.forEach(barber => {
                    const slot = document.createElement('div');
                    slot.className = 'calendar-time-slot empty';
                    
                    // Find booking/unavailable at this time
                    const booking = this.bookings.find(b => 
                        b.barberId == barber.id && 
                        b.date.getHours() === hour && 
                        b.date.getMinutes() === min
                    );

                    const unavail = this.unavailable.find(u => 
                        u.barberId == barber.id && 
                        u.date.getHours() === hour && 
                        u.date.getMinutes() === min
                    );

                    if (booking) {
                        slot.innerHTML = `
                            <div class="booking-card">
                                <span class="booking-card-name">${booking.customerName}</span>
                                <span class="booking-card-time">${booking.service}</span>
                            </div>
                        `;
                        slot.style.cursor = 'pointer';
                        slot.addEventListener('click', () => this.editBooking(booking));
                    } else if (unavail) {
                        slot.innerHTML = `
                            <div class="booking-card unavailable">
                                ${unavail.reason}
                            </div>
                        `;
                    } else {
                        slot.addEventListener('click', () => this.createBooking(barber, new Date(2025, 11, 24, hour, min)));
                    }

                    grid.appendChild(slot);
                });
            }
        }

        container.innerHTML = '';
        container.appendChild(grid);
    },

    renderIndividualView() {
        const container = document.getElementById('calendarGridIndividual');
        if (!container || !this.selectedBarber) return;

        const barber = this.barbers.find(b => b.id == this.selectedBarber);
        if (!barber) return;

        container.innerHTML = '';

        // Get week dates
        const startDate = new Date(this.currentWeekStart);
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Segunda

        // Update week display
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 4); // Sexta
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        const startMonth = monthNames[startDate.getMonth()];
        const endMonth = monthNames[endDate.getMonth()];
        const year = startDate.getFullYear();

        document.getElementById('weekRangeDisplay').textContent = 
            `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth}`;
        document.getElementById('weekYearDisplay').textContent = year;

        // Render day cards (Segunda a Sexta)
        for (let i = 0; i < 5; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);

            const dayCard = this.createDayCard(barber, dayDate);
            container.appendChild(dayCard);
        }
    },

    createDayCard(barber, date) {
        const card = document.createElement('div');
        card.className = 'calendar-day-card';

        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = dayNames[date.getDay()];
        const dayDate = date.getDate();
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthName = monthNames[date.getMonth()];

        // Header
        const header = document.createElement('div');
        header.className = 'day-card-header';
        header.innerHTML = `
            <div class="day-date">${dayDate}</div>
            <div class="day-name">${dayName} ${monthName}</div>
        `;
        card.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'day-card-content';

        // Get bookings for this day and barber
        const dayBookings = this.bookings.filter(b => 
            b.barberId == barber.id &&
            b.date.getDate() === date.getDate() &&
            b.date.getMonth() === date.getMonth() &&
            b.date.getFullYear() === date.getFullYear()
        );

        if (dayBookings.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'calendar-empty-state';
            empty.innerHTML = '<p>Sem reservas para este dia</p>';
            content.appendChild(empty);
        } else {
            dayBookings.forEach(booking => {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot booked';
                const timeStr = `${String(booking.date.getHours()).padStart(2, '0')}:${String(booking.date.getMinutes()).padStart(2, '0')}`;
                timeSlot.innerHTML = `
                    <div class="time-slot-time">${timeStr}</div>
                    <div class="time-slot-info">
                        <div class="time-slot-customer">${booking.customerName}</div>
                        <div class="time-slot-service">${booking.service}</div>
                    </div>
                    <span class="time-slot-status ${booking.status}">${booking.status === 'confirmed' ? 'Confirmada' : 'Pendente'}</span>
                `;
                timeSlot.addEventListener('click', () => this.editBooking(booking));
                content.appendChild(timeSlot);
            });
        }

        // Add empty slots for creation
        const addSlot = document.createElement('div');
        addSlot.className = 'time-slot';
        addSlot.style.cursor = 'pointer';
        addSlot.innerHTML = `
            <i class="fas fa-plus" style="color: var(--color-primary); font-size: 16px; margin: auto;"></i>
        `;
        addSlot.addEventListener('click', () => this.createBooking(barber, date));
        content.appendChild(addSlot);

        card.appendChild(content);
        return card;
    },

    previousWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.renderIndividualView();
    },

    nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.renderIndividualView();
    },

    createBooking(barber, date) {
        console.log('Criar booking para', barber.nome, 'em', date);
        // TODO: Abrir modal de criação de reserva
    },

    editBooking(booking) {
        console.log('Editar booking:', booking);
        // TODO: Abrir modal de edição de reserva
    },

    loadCalendar(barberId) {
        this.selectedBarber = barberId;
        this.loadCalendarData();
    }
};
