// Barbers API for Admin Dashboard
// GET /api/admin/barbeiros - Get all barbers
// GET /api/admin/barbeiros/:id - Get single barber

import { getDatabase } from '../../../src/db';
import { validateAdminAuth } from '../../../src/auth';

export default async function handler(request, context) {
  try {
    // Validate admin authentication
    const user = await validateAdminAuth(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { method } = request;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const barbeiroid = pathParts[pathParts.length - 1];
    const isDetailRoute = barbeiroid !== 'barbeiros' && barbeiroid !== '';

    const db = getDatabase();

    if (method === 'GET') {
      return handleGet(db, isDetailRoute, barbeiroid);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Barbers API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleGet(db, isDetailRoute, barbeiroid) {
  try {
    if (isDetailRoute) {
      // Get single barber with stats
      const stmt = db.prepare('SELECT * FROM barbeiros WHERE id = ? AND ativo = 1');
      const barber = stmt.get(parseInt(barbeiroid));

      if (!barber) {
        return new Response(JSON.stringify({ error: 'Barber not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get barber's reservations count for today
      const todayStmt = db.prepare(`
        SELECT COUNT(*) as count FROM reservas
        WHERE barbeiro_id = ? AND DATE(data_hora) = DATE('now')
      `);
      const { count: reservationsToday } = todayStmt.get(parseInt(barbeiroid));

      return new Response(JSON.stringify({
        ...barber,
        reservationsToday
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all active barbers
      const stmt = db.prepare(`
        SELECT b.*, COUNT(r.id) as totalReservations
        FROM barbeiros b
        LEFT JOIN reservas r ON b.id = r.barbeiro_id AND r.status = 'confirmada'
        WHERE b.ativo = 1
        GROUP BY b.id
        ORDER BY b.nome
      `);
      const barbers = stmt.all();

      return new Response(JSON.stringify(barbers), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    throw error;
  }
}
