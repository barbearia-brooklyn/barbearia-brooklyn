export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const barbeiroId = url.searchParams.get('barbeiroId');
    const data = url.searchParams.get('data');

    try {
        let query = `
            SELECT r.*, b.nome as barbeiro_nome, s.nome as servico_nome
            FROM reservas r
            JOIN barbeiros b ON r.barbeiro_id = b.id
            JOIN servicos s ON r.servico_id = s.id
            WHERE 1=1
        `;

        const bindings = [];

        if (barbeiroId) {
            query += ` AND r.barbeiro_id = ?`;
            bindings.push(parseInt(barbeiroId));
        }

        if (data) {
            query += ` AND DATE(r.data_hora) = ?`;
            bindings.push(data);
        }

        query += ` ORDER BY r.data_hora ASC`;

        const stmt = env.DB.prepare(query);
        const reservas = bindings.length > 0
            ? await stmt.bind(...bindings).all()
            : await stmt.all();

        return new Response(JSON.stringify(reservas.results || []), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        const result = await env.DB.prepare(
            `INSERT INTO reservas (barbeiro_id, servico_id, nome_cliente, email, telefone, data_hora, comentario, nota_privada, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmada')`
        ).bind(
            data.barbeiro_id,
            data.servico_id,
            data.nome_cliente,
            data.email || null,
            data.telefone || null,
            data.data_hora,
            data.comentario || null,
            data.nota_privada || null
        ).run();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut({ request, env }) {
    try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 1];

        if (!id || isNaN(id)) {
            return new Response(JSON.stringify({ error: 'ID inválido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await request.json();

        const result = await env.DB.prepare(
            `UPDATE reservas
             SET barbeiro_id = ?, servico_id = ?, nome_cliente = ?,
                 email = ?, telefone = ?, data_hora = ?,
                 comentario = ?, nota_privada = ?
             WHERE id = ?`
        ).bind(
            parseInt(data.barbeiro_id),
            parseInt(data.servico_id),
            data.nome_cliente,
            data.email || null,
            data.telefone || null,
            data.data_hora,
            data.comentario || null,
            data.nota_privada || null,
            parseInt(id)
        ).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao atualizar reserva:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete({ request, env }) {
    try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 1];

        if (!id || isNaN(id)) {
            return new Response(JSON.stringify({ error: 'ID inválido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(
            `UPDATE reservas SET status = 'cancelada' WHERE id = ?`
        ).bind(parseInt(id)).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}