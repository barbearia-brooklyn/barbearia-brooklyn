// Reservations API for Admin Dashboard
// GET /api/admin/reservations - Get all reservations with filters
// POST /api/admin/reservations - Create new reservation
// PUT /api/admin/reservations/:id - Update reservation
// DELETE /api/admin/reservations/:id - Delete reservation

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
    const reservationId = pathParts[pathParts.length - 1];
    const isDetailRoute = reservationId !== 'reservations' && reservationId !== '';

    const db = getDatabase();

    if (method === 'GET') {
      return handleGet(db, url, isDetailRoute, reservationId);
    } else if (method === 'POST') {
      return handlePost(db, request);
    } else if (method === 'PUT') {
      return handlePut(db, request, reservationId);
    } else if (method === 'DELETE') {
      return handleDelete(db, reservationId);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Reservations API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleGet(db, url, isDetailRoute, reservationId) {
  try {
    if (isDetailRoute) {
      // Get single reservation
      const stmt = db.prepare(`
        SELECT r.*, c.nome as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone,
               b.nome as barbeiro_nome, s.nome as servico_nome, s.duracao as servico_duracao
        FROM reservas r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        LEFT JOIN barbeiros b ON r.barbeiro_id = b.id
        LEFT JOIN servicos s ON r.servico_id = s.id
        WHERE r.id = ?
      `);
      const reservation = stmt.get(parseInt(reservationId));

      if (!reservation) {
        return new Response(JSON.stringify({ error: 'Reservation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(reservation), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all reservations with filters
      const barbeiroid = url.searchParams.get('barbeiro_id');
      const status = url.searchParams.get('status');
      const dataInicio = url.searchParams.get('data_inicio');
      const dataFim = url.searchParams.get('data_fim');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = `
        SELECT r.*, c.nome as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone,
               b.nome as barbeiro_nome, s.nome as servico_nome, s.duracao as servico_duracao, s.preco
        FROM reservas r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        LEFT JOIN barbeiros b ON r.barbeiro_id = b.id
        LEFT JOIN servicos s ON r.servico_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (barbeiroid) {
        query += ' AND r.barbeiro_id = ?';
        params.push(parseInt(barbeiroid));
      }
      if (status) {
        query += ' AND r.status = ?';
        params.push(status);
      }
      if (dataInicio) {
        query += ' AND r.data_hora >= ?';
        params.push(dataInicio);
      }
      if (dataFim) {
        query += ' AND r.data_hora <= ?';
        params.push(dataFim);
      }

      query += ' ORDER BY r.data_hora DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = db.prepare(query);
      const reservations = stmt.all(...params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM reservas WHERE 1=1';
      const countParams = [];
      if (barbeiroid) {
        countQuery += ' AND barbeiro_id = ?';
        countParams.push(parseInt(barbeiroid));
      }
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      if (dataInicio) {
        countQuery += ' AND data_hora >= ?';
        countParams.push(dataInicio);
      }
      if (dataFim) {
        countQuery += ' AND data_hora <= ?';
        countParams.push(dataFim);
      }

      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...countParams);

      return new Response(JSON.stringify({
        data: reservations,
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
    const { cliente_id, barbeiro_id, servico_id, data_hora, comentario, status } = body;

    // Validate required fields
    if (!cliente_id || !barbeiro_id || !servico_id || !data_hora) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stmt = db.prepare(`
      INSERT INTO reservas (cliente_id, barbeiro_id, servico_id, data_hora, comentario, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cliente_id,
      barbeiro_id,
      servico_id,
      data_hora,
      comentario || null,
      status || 'confirmada'
    );

    return new Response(JSON.stringify({
      id: result.lastInsertRowid,
      message: 'Reservation created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

async function handlePut(db, request, reservationId) {
  try {
    const body = await request.json();
    const { status, comentario, nota_privada } = body;

    const updateFields = [];
    const params = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (comentario !== undefined) {
      updateFields.push('comentario = ?');
      params.push(comentario);
    }
    if (nota_privada !== undefined) {
      updateFields.push('nota_privada = ?');
      params.push(nota_privada);
    }

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    updateFields.push('atualizado_em = CURRENT_TIMESTAMP');
    params.push(parseInt(reservationId));

    const stmt = db.prepare(`
      UPDATE reservas
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return new Response(JSON.stringify({ message: 'Reservation updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

function handleDelete(db, reservationId) {
  try {
    const stmt = db.prepare('DELETE FROM reservas WHERE id = ?');
    stmt.run(parseInt(reservationId));

    return new Response(JSON.stringify({ message: 'Reservation deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}
