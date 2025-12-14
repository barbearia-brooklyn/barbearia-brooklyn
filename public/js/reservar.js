// reservar.js - Sistema de Reservas Passo-a-Passo

// ===== ESTADO DA APLICAÇÃO =====
const bookingState = {
    currentStep: 1,
    selectedService: null,
    selectedBarber: null, // null = "Sem preferência"
    selectedDate: null,
    selectedTime: null,
    assignedBarber: null, // Barbeiro atribuído quando "Sem preferência"
    services: [],
    barbers: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    availabilityCache: {}
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await initBookingSystem();
    setupNavigationListeners();
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

// ===== VERIFICAR RESERVA PENDENTE =====
function checkPendingBooking() {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    
    if (pendingBooking) {
        try {
            const bookingData = JSON.parse(pendingBooking);
            
            // Restaurar estado da reserva
            bookingState.selectedService = bookingData.servico_id;
            bookingState.selectedBarber = bookingData.barbeiro_id;
            bookingState.assignedBarber = bookingData.barbeiro_id;
            bookingState.selectedDate = bookingData.data;
            bookingState.selectedTime = bookingData.hora;
            
            // Navegar para o passo de confirmação
            bookingState.currentStep = 4;
            updateStepDisplay();
            renderSummary();
            
            // Preencher comentário se existir
            if (bookingData.comentario) {
                document.getElementById('booking-comments').value = bookingData.comentario;
            }
            
            // Limpar sessionStorage
            sessionStorage.removeItem('pendingBooking');
            
            // Mostrar mensagem
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-message';
            infoDiv.style.cssText = 'background: #e8f5e9; border: 2px solid #4caf50; color: #2e7d32; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;';
            infoDiv.innerHTML = '<i class="fas fa-info-circle"></i> <strong>Bem-vindo de volta!</strong> A sua reserva foi restaurada. Por favor, confirme os dados abaixo.';
            
            const summaryDiv = document.querySelector('.booking-summary');
            summaryDiv.parentNode.insertBefore(infoDiv, summaryDiv);
            
        } catch (error) {
            console.error('Erro ao restaurar reserva pendente:', error);
            sessionStorage.removeItem('pendingBooking');
        }
    }
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
        <div class="selection-card" data-id="${service.id}" onclick="selectService(${service.id})">
            <div class="card-icon">
                <i class="fas fa-cut"></i>
            </div>
            <h3>${service.nome}</h3>
            <p class="card-detail"><i class="fas fa-clock"></i> ${service.duracao} min</p>
        </div>
    `).join('');
}

function selectService(serviceId) {
    bookingState.selectedService = serviceId;
    
    // Atualizar UI
    document.querySelectorAll('#services-grid .selection-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.id) === serviceId);
    });
    
    // Habilitar botão
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
    
    // Opção "Sem Preferência" primeiro
    let html = `
        <div class="selection-card barber-card no-preference" data-id="null" onclick="selectBarber(null)">
            <div class="card-icon">
                <i class="fas fa-users"></i>
            </div>
            <h3>Sem Preferência</h3>
            <p class="card-detail">Qualquer barbeiro disponível</p>
        </div>
    `;
    
    // Adicionar barbeiros
    html += bookingState.barbers.map(barber => `
        <div class="selection-card barber-card" data-id="${barber.id}" onclick="selectBarber(${barber.id})">
            <img src="images/persons/${barber.avatar || 'default.png'}" alt="${barber.nome}" class="barber-photo">
            <h3>${barber.nome}</h3>
            ${barber.especialidades ? `<p class="card-detail">${barber.especialidades}</p>` : ''}
        </div>
    `).join('');
    
    grid.innerHTML = html;
}

function selectBarber(barberId) {
    bookingState.selectedBarber = barberId; // null = "Sem preferência"
    bookingState.assignedBarber = null; // Reset barbeiro atribuído
    
    // Atualizar UI
    document.querySelectorAll('#barbers-grid .selection-card').forEach(card => {
        const cardId = card.dataset.id === 'null' ? null : parseInt(card.dataset.id);
        card.classList.toggle('selected', cardId === barberId);
    });
    
    // Habilitar botão
    document.getElementById('btn-next').disabled = false;
}

// ===== CALENDÁRIO =====
function renderCalendar() {
    const monthYearDisplay = document.getElementById('calendar-month-year');
    monthYearDisplay.textContent = `${MESES[bookingState.currentMonth]} ${bookingState.currentYear}`;
    
    const grid = document.getElementById('calendar-grid');
    
    // Cabeçalho com dias da semana
    let html = DIAS_SEMANA.map(dia => `<div class="calendar-day-header">${dia}</div>`).join('');
    
    // Primeiro dia do mês
    const firstDay = new Date(bookingState.currentYear, bookingState.currentMonth, 1).getDay();
    const daysInMonth = new Date(bookingState.currentYear, bookingState.currentMonth + 1, 0).getDate();
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Dias do mês
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
    
    // Selecionar primeiro dia disponível automaticamente
    if (!bookingState.selectedDate) {
        selectFirstAvailableDate();
    }
}

function selectFirstAvailableDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Procurar primeiro dia válido no mês atual
    for (let i = 0; i < 60; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        
        // Pular domingos
        if (testDate.getDay() === 0) continue;
        
        const dateStr = formatDateToISO(testDate);
        
        // Se a data está no mês atual do calendário
        if (testDate.getMonth() === bookingState.currentMonth && 
            testDate.getFullYear() === bookingState.currentYear) {
            selectDate(dateStr);
            return;
        }
        
        // Se encontrou uma data válida mas é em outro mês, navegar para lá
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
    // Verificar se é uma data válida
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today || date.getDay() === 0) {
        return; // Data inválida
    }
    
    bookingState.selectedDate = dateStr;
    bookingState.selectedTime = null;
    bookingState.assignedBarber = null;
    
    // Atualizar UI do calendário
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.toggle('selected', day.dataset.date === dateStr);
    });
    
    // Atualizar display da data
    const displayDate = new Date(dateStr + 'T00:00:00');
    document.getElementById('selected-date-display').textContent = 
        `Horários disponíveis para ${displayDate.getDate()} de ${MESES[displayDate.getMonth()]}`;
    
    // Carregar horários APENAS para esta data
    await loadAvailableTimes(dateStr);
    
    // Desabilitar botão até selecionar horário
    document.getElementById('btn-next').disabled = true;
}

async function loadAvailableTimes(dateStr) {
    const timesGrid = document.getElementById('available-times');
    timesGrid.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> A carregar horários...</p>';
    
    try {
        let times;
        
        if (bookingState.selectedBarber === null) {
            // "Sem preferência" - buscar de todos os barbeiros
            times = await loadAllBarbersTimes(dateStr);
        } else {
            // Barbeiro específico
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
    const cacheKey = `${barberId}_${dateStr}`;
    
    if (bookingState.availabilityCache[cacheKey]) {
        return bookingState.availabilityCache[cacheKey];
    }
    
    // Parâmetros corretos: 'barbeiro' (não 'barbeiro_id') e 'data'
    const result = await utils.apiRequest(
        `/api_horarios_disponiveis?barbeiro=${barberId}&data=${dateStr}`
    );
    
    if (result.ok) {
        bookingState.availabilityCache[cacheKey] = result.data;
        return result.data;
    }
    
    return [];
}

async function loadAllBarbersTimes(dateStr) {
    // Buscar disponibilidade de todos os barbeiros
    const allAvailabilities = await Promise.all(
        bookingState.barbers.map(async barber => {
            const times = await loadBarberTimes(barber.id, dateStr);
            return { barberId: barber.id, times };
        })
    );
    
    // Agregar horários únicos e mapear barbeiros para cada horário
    const timeMap = {};
    
    allAvailabilities.forEach(({ barberId, times }) => {
        times.forEach(time => {
            if (!timeMap[time]) {
                timeMap[time] = [];
            }
            timeMap[time].push(barberId);
        });
    });
    
    // Converter para array e ordenar
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
    
    if (bookingState.selectedBarber === null) {
        // Modo "Sem preferência"
        grid.innerHTML = times.map(({ time, barbers }) => `
            <button type="button" class="time-slot" onclick="selectTime('${time}', ${JSON.stringify(barbers).replace(/"/g, '&quot;')})">
                ${time}
                ${barbers.length > 1 ? `<span class="time-availability">${barbers.length} disponíveis</span>` : ''}
            </button>
        `).join('');
    } else {
        // Barbeiro específico
        grid.innerHTML = times.map(time => `
            <button type="button" class="time-slot" onclick="selectTime('${time}')">
                ${time}
            </button>
        `).join('');
    }
}

function selectTime(time, availableBarbers = null) {
    bookingState.selectedTime = time;
    
    // Se "Sem preferência", atribuir barbeiro com mais disponibilidade
    if (availableBarbers && availableBarbers.length > 0) {
        bookingState.assignedBarber = selectBestBarber(availableBarbers);
    }
    
    // Atualizar UI
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent.includes(time));
    });
    
    // Habilitar botão
    document.getElementById('btn-next').disabled = false;
}

function selectBestBarber(availableBarbers) {
    // Contar total de horários disponíveis para cada barbeiro neste dia
    const dateStr = bookingState.selectedDate;
    const barberCounts = {};
    
    availableBarbers.forEach(barberId => {
        const cacheKey = `${barberId}_${dateStr}`;
        const times = bookingState.availabilityCache[cacheKey] || [];
        barberCounts[barberId] = times.length;
    });
    
    // Escolher barbeiro com MAIS horários disponíveis
    let bestBarber = availableBarbers[0];
    let maxCount = barberCounts[bestBarber] || 0;
    
    availableBarbers.forEach(barberId => {
        if (barberCounts[barberId] > maxCount) {
            maxCount = barberCounts[barberId];
            bestBarber = barberId;
        }
    });
    
    return bestBarber;
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
        
        // Ações específicas por passo
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
    }
}

function updateStepDisplay() {
    // Atualizar indicador de passos
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === bookingState.currentStep);
        step.classList.toggle('completed', stepNum < bookingState.currentStep);
    });
    
    // Mostrar/esconder passos
    for (let i = 1; i <= 4; i++) {
        const stepDiv = document.getElementById(`step-${i}`);
        stepDiv.style.display = i === bookingState.currentStep ? 'block' : 'none';
    }
    
    // Atualizar botões de navegação
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
        
        // Desabilitar botão se não tiver seleção
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
            // Esconder formulário e mostrar sucesso
            document.querySelector('.booking-wrapper').style.display = 'none';
            document.getElementById('booking-success').style.display = 'block';
            
            // Limpar cache
            bookingState.availabilityCache = {};
        } else {
            if (result.status === 401) {
                // Guardar reserva pendente com TODOS os dados
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