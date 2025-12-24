// Unavailable Times API for Admin Dashboard
// GET /api/admin/unavailable-times - Get unavailable times
// POST /api/admin/unavailable-times - Create new unavailable time
// PUT /api/admin/unavailable-times/:id - Update unavailable time
// DELETE /api/admin/unavailable-times/:id - Delete unavailable time

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
    const timeId = pathParts[pathParts.length - 1];
    const isDetailRoute = timeId !== 'unavailable-times' && timeId !== '';

    const db = getDatabase();

    if (method === 'GET') {
      return handleGet(db, url, isDetailRoute, timeId);
    } else if (method === 'POST') {
      return handlePost(db, request);
    } else if (method === 'PUT') {
      return handlePut(db, request, timeId);
    } else if (method === 'DELETE') {
      return handleDelete(db, timeId);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unavailable times API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleGet(db, url, isDetailRoute, timeId) {
  try {
    if (isDetailRoute) {
      // Get single unavailable time
      const stmt = db.prepare(`
        SELECT h.*, b.nome as barbeiro_nome
        FROM horarios_indisponiveis h
        LEFT JOIN barbeiros b ON h.barbeiro_id = b.id
        WHERE h.id = ?
      `);
      const time = stmt.get(parseInt(timeId));

      if (!time) {
        return new Response(JSON.stringify({ error: 'Unavailable time not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(time), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all unavailable times with filters
      const barbeiroid = url.searchParams.get('barbeiro_id');
      const dataInicio = url.searchParams.get('data_inicio');
      const dataFim = url.searchParams.get('data_fim');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = `
        SELECT h.*, b.nome as barbeiro_nome
        FROM horarios_indisponiveis h
        LEFT JOIN barbeiros b ON h.barbeiro_id = b.id
        WHERE 1=1
      `;
      const params = [];

      if (barbeiroid) {
        query += ' AND h.barbeiro_id = ?';
        params.push(parseInt(barbeiroid));
      }
      if (dataInicio) {
        query += ' AND h.data_hora_inicio >= ?';
        params.push(dataInicio);
      }
      if (dataFim) {
        query += ' AND h.data_hora_fim <= ?';
        params.push(dataFim);
      }

      query += ' ORDER BY h.data_hora_inicio DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = db.prepare(query);
      const times = stmt.all(...params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM horarios_indisponiveis WHERE 1=1';
      const countParams = [];
      if (barbeiroid) {
        countQuery += ' AND barbeiro_id = ?';
        countParams.push(parseInt(barbeiroid));
      }
      if (dataInicio) {
        countQuery += ' AND data_hora_inicio >= ?';
        countParams.push(dataInicio);
      }
      if (dataFim) {
        countQuery += ' AND data_hora_fim <= ?';
        countParams.push(dataFim);
      }

      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...countParams);

      return new Response(JSON.stringify({
        data: times,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    throw error;
  }
}

async function handlePost(db, request) {
  try {
    const body = await request.json();
    const {
      barbeiro_id,
      data_hora_inicio,
      data_hora_fim,
      tipo,
      motivo,
      is_all_day,
      recurrence_type,
      recurrence_end_date
    } = body;

    // Validate required fields
    if (!barbeiro_id || !data_hora_inicio || !data_hora_fim || !tipo) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate tipo
    const validTypes = ['folga', 'almoco', 'ferias', 'ausencia', 'outro'];
    if (!validTypes.includes(tipo)) {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const recurrenceGroupId = `group_${Date.now()}_${Math.random()}`;

    const stmt = db.prepare(`
      INSERT INTO horarios_indisponiveis
      (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, is_all_day, recurrence_type, recurrence_end_date, recurrence_group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      barbeiro_id,
      data_hora_inicio,
      data_hora_fim,
      tipo,
      motivo || null,
      is_all_day ? 1 : 0,
      recurrence_type || 'none',
      recurrence_end_date || null,
      recurrenceGroupId
    );

    return new Response(JSON.stringify({
      id: result.lastInsertRowid,
      message: 'Unavailable time created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

async function handlePut(db, request, timeId) {
  try {
    const body = await request.json();
    const { motivo, tipo, recurrence_type, recurrence_end_date } = body;

    const updateFields = [];
    const params = [];

    if (motivo !== undefined) {
      updateFields.push('motivo = ?');
      params.push(motivo);
    }
    if (tipo !== undefined) {
      updateFields.push('tipo = ?');
      params.push(tipo);
    }
    if (recurrence_type !== undefined) {
      updateFields.push('recurrence_type = ?');
      params.push(recurrence_type);
    }
    if (recurrence_end_date !== undefined) {
      updateFields.push('recurrence_end_date = ?');
      params.push(recurrence_end_date);
    }

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    params.push(parseInt(timeId));

    const stmt = db.prepare(`
      UPDATE horarios_indisponiveis
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return new Response(JSON.stringify({ message: 'Unavailable time updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

function handleDelete(db, timeId) {
  try {
    const stmt = db.prepare('DELETE FROM horarios_indisponiveis WHERE id = ?');
    stmt.run(parseInt(timeId));

    return new Response(JSON.stringify({ message: 'Unavailable time deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}
