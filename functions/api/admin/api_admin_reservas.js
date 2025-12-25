/**
 * API Admin - Reservas
 * Listagem e criação de reservas com filtros avançados
 */

import { verifyAdminToken } from './auth';

// GET - Listar reservas
export async function onRequestGet({ request, env }) {
    try {
        // Verificar autenticação admin
        const authResult = await verifyAdminToken(request, env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const url = new URL(request.url);
        const barbeiro_id = url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data');
        const data_inicio = url.searchParams.get('data_inicio');
        const data_fim = url.searchParams.get('data_fim');
        const status = url.searchParams.get('status');
        const cliente_id = url.searchParams.get('cliente_id');

        let query = `
            SELECT 
                r.id,
                r.cliente_id,
                r.barbeiro_id,
                r.servico_id,
                r.data_hora,
                r.comentario,
                r.nota_privada,
                r.status,
                r.criado_em,
                c.nome as cliente_nome,
                c.email as cliente_email,
                c.telefone as cliente_telefone,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.duracao as servico_duracao,
                s.preco as servico_preco
            FROM reservas r
            INNER JOIN clientes c ON r.cliente_id = c.id
            INNER JOIN barbeiros b ON r.barbeiro_id = b.id
            INNER JOIN servicos s ON r.servico_id = s.id
            WHERE 1=1
        `;

        const params = [];

        if (barbeiro_id) {
            query += ' AND r.barbeiro_id = ?';
            params.push(parseInt(barbeiro_id));
        }

        if (cliente_id) {
            query += ' AND r.cliente_id = ?';
            params.push(parseInt(cliente_id));
        }

        // Filtro por data exata
        if (data) {
            query += ' AND DATE(r.data_hora) = DATE(?)';
            params.push(data);
        }

        // Filtro por intervalo de datas
        if (data_inicio && data_fim) {
            query += ' AND DATE(r.data_hora) BETWEEN DATE(?) AND DATE(?)';
            params.push(data_inicio, data_fim);
        } else if (data_inicio) {
            query += ' AND DATE(r.data_hora) >= DATE(?)';
            params.push(data_inicio);
        } else if (data_fim) {
            query += ' AND DATE(r.data_hora) <= DATE(?)';
            params.push(data_fim);
        }

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.data_hora DESC';

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        return new Response(JSON.stringify({
            reservas: results,
            total: results.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar reservas',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST - Criar nova reserva (ADMIN)
export async function onRequestPost({ request, env }) {
    try {
        // Verificar autenticação admin
        const authResult = await verifyAdminToken(request, env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await request.json();

        // Validações
        if (!data.cliente_id || !data.barbeiro_id || !data.servico_id || !data.data_hora) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta: cliente_id, barbeiro_id, servico_id, data_hora'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se o cliente existe
        const cliente = await env.DB.prepare(
            'SELECT id FROM clientes WHERE id = ?'
        ).bind(parseInt(data.cliente_id)).first();

        if (!cliente) {
            return new Response(JSON.stringify({
                error: 'Cliente não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se barbeiro existe
        const barbeiro = await env.DB.prepare(
            'SELECT id FROM barbeiros WHERE id = ?'
        ).bind(parseInt(data.barbeiro_id)).first();

        if (!barbeiro) {
            return new Response(JSON.stringify({
                error: 'Barbeiro não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se serviço existe
        const servico = await env.DB.prepare(
            'SELECT id FROM servicos WHERE id = ?'
        ).bind(parseInt(data.servico_id)).first();

        if (!servico) {
            return new Response(JSON.stringify({
                error: 'Serviço não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar disponibilidade
        const { results: conflicts } = await env.DB.prepare(
            `SELECT id FROM reservas 
             WHERE barbeiro_id = ? 
             AND data_hora = ? 
             AND status IN ('confirmada', 'pendente')`
        ).bind(parseInt(data.barbeiro_id), data.data_hora).all();

        if (conflicts.length > 0) {
            return new Response(JSON.stringify({ 
                error: 'Horário já reservado para este barbeiro' 
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Criar reserva
        const result = await env.DB.prepare(
            `INSERT INTO reservas (cliente_id, barbeiro_id, servico_id, data_hora, comentario, nota_privada, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            parseInt(data.cliente_id),
            parseInt(data.barbeiro_id),
            parseInt(data.servico_id),
            data.data_hora,
            data.comentario || data.notas || null,
            data.nota_privada || null,
            data.status || 'confirmada'
        ).run();

        if (!result.success) {
            throw new Error('Falha ao criar reserva');
        }

        // Buscar reserva criada com todos os detalhes
        const newReserva = await env.DB.prepare(
            `SELECT 
                r.*,
                c.nome as cliente_nome,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.preco as servico_preco
            FROM reservas r
            INNER JOIN clientes c ON r.cliente_id = c.id
            INNER JOIN barbeiros b ON r.barbeiro_id = b.id
            INNER JOIN servicos s ON r.servico_id = s.id
            WHERE r.id = ?`
        ).bind(result.meta.last_row_id).first();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
            reserva: newReserva,
            message: 'Reserva criada com sucesso'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao criar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
