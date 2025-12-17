// reservar.js - Sistema de Reservas Passo-a-Passo

// ===== ESTADO DA APLICAÇÃO =====
const bookingState = {
    currentStep: 1,
    selectedService: null,
    selectedBarber: null,
    selectedDate: null,
    selectedTime: null,
    assignedBarber: null,
    services: [],
    barbers: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
    // REMOVIDO: availabilityCache - sempre buscar dados frescos
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await initBookingSystem();
    setupNavigationListeners();
    setupStepNavigation();
    checkPendingBooking();
});

async function initBookingSystem() {
    try {
        await Promise.all([
            loadServices(),
            loadBarbers()
        ]);
    } catch (error) {
        console.error('Erro ao inicializar sistema:', error);
        utils.showError('booking-error', 'Erro ao carregar dados. Por favor, recarregue a página.');
    }
}

// ===== NAVEGAÇÃO INTERATIVA NOS PASSOS =====
function setupStepNavigation() {
    const stepElements = document.querySelectorAll('.step');
    
    stepElements.forEach((step, index) => {
        const stepNumber = index + 1;
        
        step.addEventListener('click', () => {
            // Permitir clicar se for passo anterior ou completado
            if (stepNumber < bookingState.currentStep || step.classList.contains('completed')) {
                goToStep(stepNumber);
            }
        });
    });
}

function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;
    if (stepNumber > bookingState.currentStep) return; // Não pode avançar clicando
    
    bookingState.currentStep = stepNumber;
    updateStepDisplay();
    scrollToTop();
    
    // Ações específicas ao voltar para cada passo
    if (stepNumber === 3) {
        renderCalendar();
        if (bookingState.selectedDate) {
            loadAvailableTimes(bookingState.selectedDate);
        }
    } else if (stepNumber === 4) {
        renderSummary();
    }
}

// ===== VERIFICAR RESERVA PENDENTE =====
function checkPendingBooking() {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    
    if (pendingBooking) {
        try {
            const bookingData = JSON.parse(pendingBooking);
            
            bookingState.selectedService = bookingData.servico_id;
            bookingState.selectedBarber = bookingData.barbeiro_id;
            bookingState.assignedBarber = bookingData.barbeiro_id;
            bookingState.selectedDate = bookingData.data;
            bookingState.selectedTime = bookingData.hora;
            
            bookingState.currentStep = 4;
            updateStepDisplay();
            renderSummary();
            
            if (bookingData.comentario) {
                document.getElementById('booking-comments').value = bookingData.comentario;
            }
            
            sessionStorage.removeItem('pendingBooking');
            showRestoredBookingMessage();
            
        } catch (error) {
            console.error('Erro ao restaurar reserva pendente:', error);
            sessionStorage.removeItem('pendingBooking');
        }
    }
}

function showRestoredBookingMessage() {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.innerHTML = '<i class="fas fa-info-circle"></i> <strong>Bem-vindo de volta!</strong> A sua reserva foi restaurada. Por favor, confirme os dados abaixo.';
    
    const summaryDiv = document.querySelector('.booking-summary');
    summaryDiv.parentNode.insertBefore(infoDiv, summaryDiv);
}

// ===== FUNÇÕES UTILITÁRIAS =====
function formatPrice(price) {
    return utils.formatPrice(price);
}

// ===== CARREGAR SERVIÇOS =====
async function loadServices() {
    const result = await utils.apiRequest('/api_servicos');
    
    if (result.ok) {
        bookingState.services = result.data;
        renderServices();
    } else {
        throw new Error('Falha ao carregar serviços');
    }
}

function renderServices() {
    const grid = document.getElementById('services-grid');
    
    grid.innerHTML = bookingState.services.map(service => `
        <div class="selection-list-item" data-id="${service.id}" onclick="selectService(${service.id})">
            <div class="list-item-left">
                <div class="list-item-image">
                    <img src="images/services/${service.svg || 'default.svg'}" alt="${service.nome}" onerror="this.src='images/services/default.svg'">
                </div>
                <div class="list-item-content">
                    <h5>${service.nome}</h5>
                    <p class="item-detail"><i class="fas fa-clock"></i> ${service.duracao} min</p>
                </div>
            </div>
            <div class="list-item-price">${formatPrice(service.preco)}</div>
        </div>
    `).join('');
}

function selectService(serviceId) {
    bookingState.selectedService = serviceId;
    
    document.querySelectorAll('#services-grid .selection-list-item').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.id) === serviceId);
    });
    
    document.getElementById('btn-next').disabled = false;
}

// ===== CARREGAR BARBEIROS =====
async function loadBarbers() {
    const result = await utils.apiRequest('/api_barbeiros');
    
    if (result.ok) {
        bookingState.barbers = result.data;
        renderBarbers();
    } else {
        throw new Error('Falha ao carregar barbeiros');
    }
}

function renderBarbers() {
    const grid = document.getElementById('barbers-grid');
    
    let html = `
        <div class="selection-list-item barber-item no-preference" data-id="null" onclick="selectBarber(null)">
            <div class="list-item-left">
                <div class="list-item-image">
                    <i class="fas fa-users"></i>
                </div>
                <div class="list-item-content">
                    <h5>Sem Preferência</h5>
                    <p class="item-detail">Qualquer barbeiro disponível</p>
                </div>
            </div>
        </div>
    `;
    
    html += bookingState.barbers.map(barber => `
        <div class="selection-list-item barber-item" data-id="${barber.id}" onclick="selectBarber(${barber.id})">
            <div class="list-item-left">
                <div class="list-item-image">
                    <img src="images/barbers/${barber.foto || 'default.png'}" alt="${barber.nome}" onerror="this.src='images/barbers/default.png'">
                </div>
                <div class="list-item-content">
                    <h5>${barber.nome}</h5>
                    ${barber.especialidades ? `<p class="item-detail">${barber.especialidades}</p>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = html;
}

function selectBarber(barberId) {
    bookingState.selectedBarber = barberId;
    bookingState.assignedBarber = null;
    
    document.querySelectorAll('#barbers-grid .selection-list-item').forEach(card => {
        const cardId = card.dataset.id === 'null' ? null : parseInt(card.dataset.id);
        card.classList.toggle('selected', cardId === barberId);
    });
    
    document.getElementById('btn-next').disabled = false;
}

// ===== CALENDÁRIO =====
function renderCalendar() {
    const monthYearDisplay = document.getElementById('calendar-month-year');
    monthYearDisplay.textContent = `${MESES[bookingState.currentMonth]} ${bookingState.currentYear}`;
    
    const grid = document.getElementById('calendar-grid');
    
    let html = DIAS_SEMANA.map(dia => `<div class="calendar-day-header">${dia}</div>`).join('');
    
    const firstDay = new Date(bookingState.currentYear, bookingState.currentMonth, 1).getDay();
    const daysInMonth = new Date(bookingState.currentYear, bookingState.currentMonth + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(bookingState.currentYear, bookingState.currentMonth, day);
        const dateStr = formatDateToISO(date);
        const isPast = date < today;
        const isSunday = date.getDay() === 0;
        const isSelected = dateStr === bookingState.selectedDate;
        
        let className = 'calendar-day';
        if (isPast || isSunday) className += ' disabled';
        if (isSelected) className += ' selected';
        
        html += `<div class="${className}" data-date="${dateStr}" onclick="${isPast || isSunday ? '' : `selectDate('${dateStr}')`}">${day}</div>`;
    }
    
    grid.innerHTML = html;
    
    if (!bookingState.selectedDate) {
        selectFirstAvailableDate();
    }
}

function selectFirstAvailableDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 60; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        
        if (testDate.getDay() === 0) continue;
        
        const dateStr = formatDateToISO(testDate);
        
        if (testDate.getMonth() === bookingState.currentMonth && 
            testDate.getFullYear() === bookingState.currentYear) {
            selectDate(dateStr);
            return;
        }
        
        if (testDate.getMonth() !== bookingState.currentMonth || 
            testDate.getFullYear() !== bookingState.currentYear) {
            bookingState.currentMonth = testDate.getMonth();
            bookingState.currentYear = testDate.getFullYear();
            renderCalendar();
            return;
        }
    }
}

async function selectDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today || date.getDay() === 0) {
        return;
    }
    
    bookingState.selectedDate = dateStr;
    bookingState.selectedTime = null;
    bookingState.assignedBarber = null;
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.toggle('selected', day.dataset.date === dateStr);
    });
    
    const displayDate = new Date(dateStr + 'T00:00:00');
    document.getElementById('selected-date-display').textContent = 
        `Horários disponíveis para ${displayDate.getDate()} de ${MESES[displayDate.getMonth()]}`;
    
    await loadAvailableTimes(dateStr);
    
    document.getElementById('btn-next').disabled = true;
}

async function loadAvailableTimes(dateStr) {
    const timesGrid = document.getElementById('available-times');
    timesGrid.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> A carregar horários...</p>';
    
    try {
        let times;
        
        if (bookingState.selectedBarber === null) {
            times = await loadAllBarbersTimes(dateStr);
        } else {
            times = await loadBarberTimes(bookingState.selectedBarber, dateStr);
        }
        
        if (times && times.length > 0) {
            renderAvailableTimes(times);
            return times;
        } else {
            timesGrid.innerHTML = '<p class="no-times">Não há horários disponíveis neste dia</p>';
            return [];
        }
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        timesGrid.innerHTML = '<p class="error">Erro ao carregar horários</p>';
        return [];
    }
}

async function loadBarberTimes(barberId, dateStr) {
    // Sempre buscar dados frescos da API - SEM CACHE
    const result = await utils.apiRequest(
        `/api_horarios_disponiveis?barbeiro=${barberId}&data=${dateStr}`
    );
    
    if (result.ok) {
        return result.data;
    }
    
    return [];
}

async function loadAllBarbersTimes(dateStr) {
    const allAvailabilities = await Promise.all(
        bookingState.barbers.map(async barber => {
            const times = await loadBarberTimes(barber.id, dateStr);
            return { barberId: barber.id, times };
        })
    );
    
    const timeMap = {};
    
    allAvailabilities.forEach(({ barberId, times }) => {
        times.forEach(time => {
            if (!timeMap[time]) {
                timeMap[time] = [];
            }
            timeMap[time].push(barberId);
        });
    });
    
    const uniqueTimes = Object.keys(timeMap)
        .sort()
        .map(time => ({
            time,
            barbers: timeMap[time]
        }));
    
    return uniqueTimes;
}

function renderAvailableTimes(times) {
    const grid = document.getElementById('available-times');
    const agora = new Date();
    const dataReserva = new Date(bookingState.selectedDate + 'T00:00:00');
    const ehHoje = dataReserva.toDateString() === agora.toDateString();
    
    if (bookingState.selectedBarber === null) {
        const timesFiltrados = times.filter(({ time }) => {
            if (!ehHoje) return true;
            
            const [horas, minutos] = time.split(':').map(Number);
            const horaReserva = new Date(dataReserva);
            horaReserva.setHours(horas, minutos, 0, 0);
            
            return horaReserva > agora;
        });
        
        if (timesFiltrados.length === 0) {
            grid.innerHTML = '<p class="no-times">Não há horários disponíveis para hoje</p>';
            return;
        }
        
        grid.innerHTML = timesFiltrados.map(({ time, barbers }) => `
            <button type="button" class="time-slot" onclick="selectTime('${time}', ${JSON.stringify(barbers).replace(/"/g, '&quot;')})">
                ${time}
                ${barbers.length > 1 ? `<span class="time-availability">${barbers.length} disponíveis</span>` : ''}
            </button>
        `).join('');
    } else {
        const timesFiltrados = times.filter(time => {
            if (!ehHoje) return true;
            
            const [horas, minutos] = time.split(':').map(Number);
            const horaReserva = new Date(dataReserva);
            horaReserva.setHours(horas, minutos, 0, 0);
            
            return horaReserva > agora;
        });
        
        if (timesFiltrados.length === 0) {
            grid.innerHTML = '<p class="no-times">Não há horários disponíveis para hoje</p>';
            return;
        }
        
        grid.innerHTML = timesFiltrados.map(time => `
            <button type="button" class="time-slot" onclick="selectTime('${time}')">
                ${time}
            </button>
        `).join('');
    }
}

function selectTime(time, availableBarbers = null) {
    bookingState.selectedTime = time;
    
    if (availableBarbers && availableBarbers.length > 0) {
        bookingState.assignedBarber = availableBarbers[Math.floor(Math.random() * availableBarbers.length)];
    }
    
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent.includes(time));
    });
    
    document.getElementById('btn-next').disabled = false;
}

// ===== NAVEGAÇÃO ENTRE PASSOS =====
function setupNavigationListeners() {
    document.getElementById('btn-next').addEventListener('click', nextStep);
    document.getElementById('btn-back').addEventListener('click', previousStep);
    document.getElementById('btn-confirm').addEventListener('click', confirmBooking);
    
    document.getElementById('prev-month').addEventListener('click', () => {
        bookingState.currentMonth--;
        if (bookingState.currentMonth < 0) {
            bookingState.currentMonth = 11;
            bookingState.currentYear--;
        }
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        bookingState.currentMonth++;
        if (bookingState.currentMonth > 11) {
            bookingState.currentMonth = 0;
            bookingState.currentYear++;
        }
        renderCalendar();
    });
}

function nextStep() {
    if (bookingState.currentStep < 4) {
        bookingState.currentStep++;
        updateStepDisplay();
        scrollToTop();
        if (bookingState.currentStep === 3) {
            renderCalendar();
        } else if (bookingState.currentStep === 4) {
            renderSummary();
        }
    }
}

function previousStep() {
    if (bookingState.currentStep > 1) {
        bookingState.currentStep--;
        updateStepDisplay();
        scrollToTop();
    }
}

function updateStepDisplay() {
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === bookingState.currentStep);
        step.classList.toggle('completed', stepNum < bookingState.currentStep);
    });
    
    for (let i = 1; i <= 4; i++) {
        const stepDiv = document.getElementById(`step-${i}`);
        stepDiv.style.display = i === bookingState.currentStep ? 'block' : 'none';
    }
    
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const btnConfirm = document.getElementById('btn-confirm');
    
    btnBack.style.display = bookingState.currentStep > 1 ? 'inline-block' : 'none';
    
    if (bookingState.currentStep === 4) {
        btnNext.style.display = 'none';
        btnConfirm.style.display = 'inline-block';
    } else {
        btnNext.style.display = 'inline-block';
        btnConfirm.style.display = 'none';
        
        let hasSelection = false;
        if (bookingState.currentStep === 1) hasSelection = bookingState.selectedService !== null;
        else if (bookingState.currentStep === 2) hasSelection = bookingState.selectedBarber !== null;
        else if (bookingState.currentStep === 3) hasSelection = bookingState.selectedTime !== null;
        
        btnNext.disabled = !hasSelection;
    }
}

function renderSummary() {
    const service = bookingState.services.find(s => s.id === bookingState.selectedService);
    const barberId = bookingState.assignedBarber || bookingState.selectedBarber;
    const barber = bookingState.barbers.find(b => b.id === barberId);
    
    document.getElementById('summary-service').textContent = service?.nome || 'N/A';
    document.getElementById('summary-barber').textContent = 
        barber?.nome || (bookingState.selectedBarber === null ? 'Sem preferência' : 'N/A');
    
    const date = new Date(bookingState.selectedDate + 'T00:00:00');
    document.getElementById('summary-date').textContent = 
        `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
    
    document.getElementById('summary-time').textContent = bookingState.selectedTime || 'N/A';
}

// ===== CONFIRMAR RESERVA =====
async function confirmBooking() {
    utils.hideMessages('booking-error');
    
    const btnConfirm = document.getElementById('btn-confirm');
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A confirmar...';
    
    try {
        const bookingData = {
            servico_id: bookingState.selectedService,
            barbeiro_id: bookingState.assignedBarber || bookingState.selectedBarber,
            data: bookingState.selectedDate,
            hora: bookingState.selectedTime,
            comentario: document.getElementById('booking-comments')?.value || ''
        };
        
        const result = await utils.apiRequest('/api_reservas', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        
        if (result.ok) {
            document.getElementById('booking-form').style.display = 'none';
            document.getElementById('booking-success').style.display = 'block';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            if (result.status === 401) {
                sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
                window.location.href = 'login.html?redirect=reservar.html';
            } else {
                utils.showError('booking-error', result.data?.error || 'Erro ao criar reserva');
                btnConfirm.disabled = false;
                btnConfirm.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
            }
        }
    } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        utils.showError('booking-error', 'Erro ao processar reserva');
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====
function formatDateToISO(date) {
    return date.toISOString().split('T')[0];
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}