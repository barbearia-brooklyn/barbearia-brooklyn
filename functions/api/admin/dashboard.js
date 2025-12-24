// Dashboard API for Admin Dashboard
// GET /api/admin/dashboard/stats - Get dashboard statistics
// Statistics: reservations this month, today, completed yesterday, barber comparison

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

    if (method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = getDatabase();
    return handleGetStats(db);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleGetStats(db) {
  try {
    // Get current date info
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // 1. Reservations this month (status = confirmada)
    const stmtMonth = db.prepare(`
      SELECT COUNT(*) as count FROM reservas
      WHERE DATE(data_hora) >= ? 
        AND DATE(data_hora) < DATE(?)
        AND status = 'confirmada'
    `);
    const { count: mesReservas } = stmtMonth.get(monthStart, new Date().toISOString().split('T')[0]);

    // 2. Reservations today (status = confirmada)
    const stmtToday = db.prepare(`
      SELECT COUNT(*) as count FROM reservas
      WHERE DATE(data_hora) = ?
        AND status = 'confirmada'
    `);
    const { count: hojeReservas } = stmtToday.get(today);

    // 3. Completed reservations yesterday (status = concluida)
    const stmtYesterday = db.prepare(`
      SELECT COUNT(*) as count FROM reservas
      WHERE DATE(data_hora) = ?
        AND status = 'concluida'
    `);
    const { count: diaAnteriorConcluidas } = stmtYesterday.get(yesterday);

    // 4. Get barbers comparison data
    const stmtBarbers = db.prepare(`
      SELECT 
        b.id,
        b.nome,
        COALESCE(
          (SELECT COUNT(*) FROM reservas 
           WHERE barbeiro_id = b.id 
             AND DATE(data_hora) = ?
             AND status = 'concluida'),
          0
        ) as concluidas_ontem,
        COALESCE(
          (SELECT COUNT(*) FROM reservas 
           WHERE barbeiro_id = b.id 
             AND DATE(data_hora) = ?
             AND status = 'confirmada'),
          0
        ) as agendadas_hoje
      FROM barbeiros b
      WHERE b.ativo = 1
      ORDER BY b.nome
    `);
    const barbeiros = stmtBarbers.all(yesterday, today);

    return new Response(JSON.stringify({
      mes_reservas: mesReservas || 0,
      hoje_reservas: hojeReservas || 0,
      dia_anterior_concluidas: diaAnteriorConcluidas || 0,
      barbeiros: barbeiros || [],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}
