// functions/admin/api/api_admin_reservas.js
// API para listagem de reservas (ADMIN)

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const barbeiro_id = url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data');
        const status = url.searchParams.get('status');

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

        if (data) {
            query += ' AND DATE(r.data_hora) = DATE(?)';
            params.push(data);
        }

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.data_hora DESC';

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        return new Response(JSON.stringify(results), {
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
        const data = await request.json();

        // Validações
        if (!data.cliente_id || !data.barbeiro_id || !data.servico_id || !data.data_hora) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta'
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

        // Verificar disponibilidade
        const { results } = await env.DB.prepare(
            'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status = "confirmada"'
        ).bind(data.barbeiro_id, data.data_hora).all();

        if (results.length > 0) {
            return new Response(JSON.stringify({ error: 'Horário já reservado' }), {
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
            data.comentario || null,
            data.nota_privada || null,
            data.status || 'confirmada'
        ).run();

        if (!result.success) {
            throw new Error('Falha ao criar reserva');
        }

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
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