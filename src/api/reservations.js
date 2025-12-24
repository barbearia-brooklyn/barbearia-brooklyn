/**
 * Reservations API
 * Handles all reservation-related endpoints
 */

// Mock database
const mockReservations = [
  {
    id: 1,
    clientId: 1,
    barberId: 1,
    clientName: 'João Silva',
    clientEmail: 'joao@email.com',
    clientPhone: '912345678',
    serviceId: 1,
    serviceName: 'Corte de Cabelo',
    duration: 30,
    price: 15,
    dateTime: new Date(2025, 11, 25, 9, 0),
    status: 'confirmed',
    notes: '',
    sendEmail: true,
    sendSMS: false,
  },
  {
    id: 2,
    clientId: 2,
    barberId: 2,
    clientName: 'Maria Santos',
    clientEmail: 'maria@email.com',
    clientPhone: '911223344',
    serviceId: 2,
    serviceName: 'Barba',
    duration: 20,
    price: 10,
    dateTime: new Date(2025, 11, 25, 10, 0),
    status: 'pending',
    notes: 'Cliente novo',
    sendEmail: true,
    sendSMS: false,
  },
  {
    id: 3,
    clientId: 3,
    barberId: 3,
    clientName: 'Carlos Oliveira',
    clientEmail: 'carlos@email.com',
    clientPhone: '913456789',
    serviceId: 3,
    serviceName: 'Corte + Barba',
    duration: 45,
    price: 25,
    dateTime: new Date(2025, 11, 25, 14, 30),
    status: 'confirmed',
    notes: '',
    sendEmail: true,
    sendSMS: false,
  },
];

let reservationId = 4;

/**
 * GET /api/reservations
 * Get all reservations with optional filters
 */
export async function getReservations(request) {
  const url = new URL(request.url);
  const barberId = url.searchParams.get('barberId');
  const status = url.searchParams.get('status');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  let filtered = mockReservations;

  if (barberId) {
    filtered = filtered.filter(r => r.barberId === parseInt(barberId));
  }

  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter(r => new Date(r.dateTime) >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo);
    filtered = filtered.filter(r => new Date(r.dateTime) <= to);
  }

  return new Response(JSON.stringify(filtered), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/reservations
 * Create a new reservation
 */
export async function createReservation(request) {
  const data = await request.json();

  const reservation = {
    id: reservationId++,
    ...data,
    dateTime: new Date(data.dateTime),
    status: data.status || 'pending',
  };

  mockReservations.push(reservation);

  return new Response(JSON.stringify(reservation), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/reservations/:id
 * Get a specific reservation
 */
export async function getReservation(request, id) {
  const reservation = mockReservations.find(r => r.id === parseInt(id));

  if (!reservation) {
    return new Response(JSON.stringify({ error: 'Reservation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(reservation), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * PUT /api/reservations/:id
 * Update a reservation
 */
export async function updateReservation(request, id) {
  const data = await request.json();
  const index = mockReservations.findIndex(r => r.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Reservation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  mockReservations[index] = {
    ...mockReservations[index],
    ...data,
    id: parseInt(id),
  };

  return new Response(JSON.stringify(mockReservations[index]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * DELETE /api/reservations/:id
 * Cancel a reservation
 */
export async function deleteReservation(request, id) {
  const index = mockReservations.findIndex(r => r.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Reservation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = mockReservations.splice(index, 1);

  return new Response(JSON.stringify(deleted[0]), {
    headers: { 'Content-Type': 'application/json' },
  });
}
