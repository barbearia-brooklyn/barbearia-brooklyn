/**
 * Unavailable Slots API
 * Handles unavailable time slots and blocked time
 */

// Mock database
const mockUnavailable = [
  {
    id: 1,
    barberId: 1,
    barberName: 'Barbeiro 1',
    startTime: new Date(2025, 11, 25, 12, 0),
    endTime: new Date(2025, 11, 25, 13, 0),
    reason: 'Almoço',
    type: 'lunch',
  },
  {
    id: 2,
    barberId: 2,
    barberName: 'Barbeiro 2',
    startTime: new Date(2025, 11, 26, 9, 0),
    endTime: new Date(2025, 11, 26, 10, 0),
    reason: 'Manutencao',
    type: 'maintenance',
  },
];

let unavailableId = 3;

/**
 * GET /api/unavailable
 * Get all unavailable slots with optional filters
 */
export async function getUnavailable(request) {
  const url = new URL(request.url);
  const barberId = url.searchParams.get('barberId');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  let filtered = mockUnavailable;

  if (barberId) {
    filtered = filtered.filter(u => u.barberId === parseInt(barberId));
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter(u => new Date(u.startTime) >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo);
    filtered = filtered.filter(u => new Date(u.endTime) <= to);
  }

  return new Response(JSON.stringify(filtered), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/unavailable
 * Create a new unavailable slot
 */
export async function createUnavailable(request) {
  const data = await request.json();

  // Calculate duration in minutes
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const durationMinutes = (end - start) / (1000 * 60);

  const unavailable = {
    id: unavailableId++,
    ...data,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    duration: durationMinutes,
    type: data.type || 'blocked',
  };

  mockUnavailable.push(unavailable);

  return new Response(JSON.stringify(unavailable), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/unavailable/:id
 * Get a specific unavailable slot
 */
export async function getUnavailableSlot(request, id) {
  const unavailable = mockUnavailable.find(u => u.id === parseInt(id));

  if (!unavailable) {
    return new Response(JSON.stringify({ error: 'Unavailable slot not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(unavailable), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * PUT /api/unavailable/:id
 * Update an unavailable slot
 */
export async function updateUnavailable(request, id) {
  const data = await request.json();
  const index = mockUnavailable.findIndex(u => u.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Unavailable slot not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  mockUnavailable[index] = {
    ...mockUnavailable[index],
    ...data,
    id: parseInt(id),
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
  };

  return new Response(JSON.stringify(mockUnavailable[index]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * DELETE /api/unavailable/:id
 * Delete an unavailable slot
 */
export async function deleteUnavailable(request, id) {
  const index = mockUnavailable.findIndex(u => u.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Unavailable slot not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = mockUnavailable.splice(index, 1);

  return new Response(JSON.stringify(deleted[0]), {
    headers: { 'Content-Type': 'application/json' },
  });
}
