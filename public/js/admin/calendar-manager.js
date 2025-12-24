/**
 * Calendar Manager
 * Manages calendar views (general and individual) with API integration
 */

import { apiReservations, apiUnavailable, apiBarbers } from './api-client.js';

class CalendarManager {
  constructor() {
    this.barbers = [];
    this.reservations = [];
    this.unavailable = [];
    this.currentView = 'general';
    this.selectedBarber = null;
    this.currentWeekStart = this.getMonday(new Date());
    this.workingHours = { start: 9, end: 19 };
  }

  /**
   * Initialize calendar
   */
  async initialize() {
    try {
      this.barbers = await apiBarbers.getAll();
      this.selectedBarber = this.barbers[0]?.id || 1;
      await this.loadData();
      this.render();
    } catch (error) {
      console.error('Calendar initialization error:', error);
      this.showError('Erro ao carregar calendário');
    }
  }

  /**
   * Load reservations and unavailable data
   */
  async loadData() {
    try {
      this.reservations = await apiReservations.getAll({ barberId: this.selectedBarber });
      this.unavailable = await apiUnavailable.getAll({ barberId: this.selectedBarber });
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }

  /**
   * Switch between views
   */
  switchView(viewType) {
    this.currentView = viewType;
    this.render();
  }

  /**
   * Get Monday of current week
   */
  getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Navigate to previous week
   */
  previousWeek() {
    this.currentWeekStart = new Date(this.currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.render();
  }

  /**
   * Navigate to next week
   */
  nextWeek() {
    this.currentWeekStart = new Date(this.currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.render();
  }

  /**
   * Select a barber
   */
  async selectBarber(barberId) {
    this.selectedBarber = barberId;
    await this.loadData();
    this.render();
  }

  /**
   * Render the calendar
   */
  render() {
    if (this.currentView === 'general') {
      this.renderGeneralView();
    } else {
      this.renderIndividualView();
    }
  }

  /**
   * Render general view (all barbers, 5 columns)
   */
  renderGeneralView() {
    const container = document.getElementById('calendarGridGeneral');
    if (!container) return;

    container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'calendar-table';

    // Header row with barber names
    const headerRow = document.createElement('tr');
    headerRow.className = 'calendar-header';
    const timeHeader = document.createElement('th');
    timeHeader.className = 'time-column';
    timeHeader.textContent = 'Hora';
    headerRow.appendChild(timeHeader);

    this.barbers.slice(0, 5).forEach(barber => {
      const th = document.createElement('th');
      th.className = 'barber-column';
      th.textContent = barber.name;
      headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    // Time slots
    for (let hour = this.workingHours.start; hour < this.workingHours.end; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        const row = document.createElement('tr');
        row.className = 'calendar-row';

        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = timeStr;
        row.appendChild(timeCell);

        this.barbers.slice(0, 5).forEach(barber => {
          const cell = document.createElement('td');
          cell.className = 'slot-cell';
          cell.dataset.barberId = barber.id;
          cell.dataset.time = timeStr;
          cell.addEventListener('click', () => this.onSlotClick(barber.id, timeStr, new Date()));

          // Check for reservations or unavailable
          const reservation = this.getReservationAtTime(barber.id, hour, minutes);
          const unavailable = this.getUnavailableAtTime(barber.id, hour, minutes);

          if (reservation) {
            cell.classList.add('reserved');
            cell.innerHTML = `<small>${reservation.clientName}</small>`;
          } else if (unavailable) {
            cell.classList.add('unavailable');
            cell.innerHTML = `<small>${unavailable.reason}</small>`;
          }

          row.appendChild(cell);
        });

        table.appendChild(row);
      }
    }

    container.appendChild(table);
  }

  /**
   * Render individual view (selected barber, weekly)
   */
  renderIndividualView() {
    const container = document.getElementById('calendarGridIndividual');
    if (!container) return;

    container.innerHTML = '';

    const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const grid = document.createElement('div');
    grid.className = 'week-grid';

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(this.currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);

      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';

      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.innerHTML = `
        <h4>${weekDays[i]}</h4>
        <p>${dayDate.toLocaleDateString('pt-PT')}</p>
      `;
      dayCard.appendChild(dayHeader);

      const daySlots = document.createElement('div');
      daySlots.className = 'day-slots';

      // Get reservations for this day
      const dayReservations = this.reservations.filter(r => {
        const rDate = new Date(r.dateTime);
        return rDate.toDateString() === dayDate.toDateString();
      });

      dayReservations.forEach(res => {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.innerHTML = `
          <div class="slot-time">${new Date(res.dateTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="slot-client">${res.clientName}</div>
          <div class="slot-service" style="font-size: 0.8em; color: #666;">${res.serviceName}</div>
        `;
        daySlots.appendChild(slot);
      });

      if (dayReservations.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-day';
        empty.textContent = 'Sem reservas';
        daySlots.appendChild(empty);
      }

      dayCard.appendChild(daySlots);
      grid.appendChild(dayCard);
    }

    container.appendChild(grid);
  }

  /**
   * Get reservation at specific time
   */
  getReservationAtTime(barberId, hour, minutes) {
    return this.reservations.find(r => {
      const rDate = new Date(r.dateTime);
      return r.barberId === barberId && 
             rDate.getHours() === hour && 
             rDate.getMinutes() === minutes;
    });
  }

  /**
   * Get unavailable at specific time
   */
  getUnavailableAtTime(barberId, hour, minutes) {
    return this.unavailable.find(u => {
      const uDate = new Date(u.startTime);
      return u.barberId === barberId && 
             uDate.getHours() === hour && 
             uDate.getMinutes() === minutes;
    });
  }

  /**
   * Handle slot click
   */
  onSlotClick(barberId, timeStr, date) {
    const event = new CustomEvent('slotClicked', {
      detail: { barberId, timeStr, date }
    });
    document.dispatchEvent(event);
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(message);
  }
}

// Export manager
window.CalendarManager = CalendarManager;
