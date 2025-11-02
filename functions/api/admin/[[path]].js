export async function onRequestGet({ env, request, params }) {
    const path = params.path?.join('/') || '';
    const url = new URL(request.url);

    // GET /api/admin/reservas
    if (path === 'reservas' || path === '') {
        const barbeiroId = url.searchParams.get('barbeiroId');
        const data = url.searchParams.get('data');

        try {
            let query = `
                SELECT r.*, b.nome as barbeiro_nome, s.nome as servico_nome, r.nome as cliente_nome
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

            return new Response(JSON.stringify(reservas.results), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Not Found', { status: 404 });
}

export async function onRequestPost({ request, env, params }) {
    const path = params.path?.join('/') || '';

    // POST /api/admin/reservas - Criar nova reserva
    if (path === 'reservas' || path === '') {
        try {
            const data = await request.json();

            const result = await env.DB.prepare(
                `INSERT INTO reservas (barbeiro_id, servico_id, nome, email, telefone, data_hora, comentario, nota_privada, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmada')`
            ).bind(
                data.barbeiro_id,
                data.servico_id,
                data.cliente_nome,
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

    return new Response('Not Found', { status: 404 });
}

export async function onRequestPut({ request, env, params }) {
    const path = params.path?.join('/') || '';

    // PUT /api/admin/reservas/:id - Atualizar reserva
    if (path.startsWith('reservas/')) {
        try {
            const id = path.split('/')[1];
            const data = await request.json();

            await env.DB.prepare(
                `UPDATE reservas
                 SET barbeiro_id = ?, servico_id = ?, nome = ?, 
                     email = ?, telefone = ?, data_hora = ?,
                     comentario = ?, nota_privada = ?
                 WHERE id = ?`
            ).bind(
                data.barbeiro_id,
                data.servico_id,
                data.cliente_nome,
                data.email || null,
                data.telefone || null,
                data.data_hora,
                data.comentario || null,
                data.nota_privada || null,
                id
            ).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Not Found', { status: 404 });
}

export async function onRequestDelete({ request, env, params }) {
    const path = params.path?.join('/') || '';

    // DELETE /api/admin/reservas/:id - Cancelar reserva
    if (path.startsWith('reservas/')) {
        try {
            const id = path.split('/')[1];

            await env.DB.prepare(
                `UPDATE reservas SET status = 'cancelada' WHERE id = ?`
            ).bind(id).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Not Found', { status: 404 });
}
