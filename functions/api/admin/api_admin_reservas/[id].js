// /functions/api/admin/api_admin_reservas/[id].js

export async function onRequestPut({ request, env, params }) {
    try {
        const id = params.id;

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

export async function onRequestDelete({ request, env, params }) {
    try {
        const id = params.id;

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
