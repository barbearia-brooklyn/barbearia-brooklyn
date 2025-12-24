/**
 * Calendar Page Initialization
 */

let calendarManager;

/**
 * Initialize page
 */
async function initializeCalendarPage() {
  // Load header
  await loadHeaderComponent();
  setupHeaderEventListeners();
  updateNavItems();

  // Initialize calendar manager
  calendarManager = new window.CalendarManager();
  await calendarManager.initialize();

  // Setup event listeners
  setupCalendarEventListeners();
}

/**
 * Setup event listeners for calendar
 */
function setupCalendarEventListeners() {
  // View switcher buttons
  const generalBtn = document.getElementById('viewGeneralBtn');
  const individualBtn = document.getElementById('viewIndividualBtn');

  if (generalBtn) {
    generalBtn.addEventListener('click', () => {
      generalBtn.classList.add('active');
      individualBtn?.classList.remove('active');
      document.getElementById('generalViewContainer')?.style.display = 'block';
      document.getElementById('individualViewContainer')?.style.display = 'none';
      document.getElementById('barberSelectorWrapper')?.style.display = 'flex';
      document.getElementById('weekNavigation')?.style.display = 'none';
      calendarManager.switchView('general');
    });
  }

  if (individualBtn) {
    individualBtn.addEventListener('click', () => {
      individualBtn.classList.add('active');
      generalBtn?.classList.remove('active');
      document.getElementById('generalViewContainer')?.style.display = 'none';
      document.getElementById('individualViewContainer')?.style.display = 'block';
      document.getElementById('barberSelectorWrapper')?.style.display = 'flex';
      document.getElementById('weekNavigation')?.style.display = 'flex';
      calendarManager.switchView('individual');
    });
  }

  // Barber selector
  const barberSelect = document.getElementById('barberSelect');
  if (barberSelect && calendarManager.barbers.length > 0) {
    // Populate barber options
    calendarManager.barbers.forEach(barber => {
      const option = document.createElement('option');
      option.value = barber.id;
      option.textContent = barber.name;
      if (barber.id === calendarManager.selectedBarber) {
        option.selected = true;
      }
      barberSelect.appendChild(option);
    });

    barberSelect.addEventListener('change', (e) => {
      calendarManager.selectBarber(parseInt(e.target.value));
    });
  }

  // Week navigation
  document.getElementById('prevWeekBtn')?.addEventListener('click', () => {
    calendarManager.previousWeek();
    updateWeekDisplay();
  });

  document.getElementById('nextWeekBtn')?.addEventListener('click', () => {
    calendarManager.nextWeek();
    updateWeekDisplay();
  });

  // Slot click handler
  document.addEventListener('slotClicked', (e) => {
    const { barberId, timeStr, date } = e.detail;
    openTimeSlotModal(barberId, timeStr, date);
  });

  updateWeekDisplay();
}

/**
 * Update week display
 */
function updateWeekDisplay() {
  const weekStart = calendarManager.currentWeekStart;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const rangeDisplay = document.getElementById('weekRangeDisplay');
  const yearDisplay = document.getElementById('weekYearDisplay');

  if (rangeDisplay) {
    rangeDisplay.textContent = `${weekStart.toLocaleDateString('pt-PT')} - ${weekEnd.toLocaleDateString('pt-PT')}`;
  }
  if (yearDisplay) {
    yearDisplay.textContent = `Semana ${Math.ceil((weekStart.getDate()) / 7)}`;
  }
}

/**
 * Open time slot modal for booking/unavailable
 */
function openTimeSlotModal(barberId, timeStr, date) {
  const modal = document.getElementById('calendarActionModal');
  if (modal) {
    modal.style.display = 'block';

    // Store context for modal actions
    window.currentSlotContext = {
      barberId,
      timeStr,
      date,
    };

    // Setup action buttons
    const newBookingBtn = document.getElementById('newBookingActionBtn');
    const newUnavailableBtn = document.getElementById('newUnavailableActionBtn');

    if (newBookingBtn) {
      newBookingBtn.onclick = () => {
        // Open booking form or modal
        window.location.href = `/admin/new-booking.html?time=${timeStr}&barber=${barberId}`;
      };
    }

    if (newUnavailableBtn) {
      newUnavailableBtn.onclick = () => {
        // Open unavailable form
        openUnavailableForm(barberId, timeStr);
      };
    }
  }
}

/**
 * Open unavailable form
 */
function openUnavailableForm(barberId, timeStr) {
  // Create a simple form or redirect
  // For now, we'll create a prompt-based approach
  const reason = prompt('Motivo da indisponibilidade:');
  if (reason) {
    // Would call API to create unavailable
    alert(`Indisponibilidade criada para ${timeStr} - ${reason}`);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCalendarPage);
} else {
  initializeCalendarPage();
}
