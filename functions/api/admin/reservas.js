export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const barbeiroId = url.searchParams.get('barbeiro');

    try {
        let query = `
            SELECT r.*, b.nome as barbeiro_nome, s.nome as servico_nome
            FROM reservas r
            JOIN barbeiros b ON r.barbeiro_id = b.id
            JOIN servicos s ON r.servico_id = s.id
        `;

        if (barbeiroId) {
            query += ` WHERE r.barbeiro_id = ${barbeiroId}`;
        }

        query += ` ORDER BY r.data_hora DESC`;

        const reservas = await env.DB.prepare(query).all();

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

export async function onRequestPut({ request, env }) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;

        await env.DB.prepare(
            `UPDATE reservas 
             SET nome_cliente = ?, email = ?, telefone = ?, 
                 barbeiro_id = ?, servico_id = ?, data_hora = ?, 
                 comentario = ?, nota_privada = ?
             WHERE id = ?`
        ).bind(
            updateData.nome,
            updateData.email,
            updateData.telefone,
            updateData.barbeiro_id,
            updateData.servico_id,
            updateData.data_hora,
            updateData.comentario,
            updateData.nota_privada,
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

export async function onRequestDelete({ request, env }) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    try {
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
