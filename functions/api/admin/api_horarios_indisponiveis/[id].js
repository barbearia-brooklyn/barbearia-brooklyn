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
            `UPDATE horarios_indisponiveis
             SET tipo = ?, data_hora_inicio = ?, data_hora_fim = ?, motivo = ?
             WHERE id = ?`
        ).bind(
            data.tipo,
            data.data_hora_inicio,
            data.data_hora_fim,
            data.motivo || null,
            parseInt(id)
        ).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao atualizar horário indisponível:', error);
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
            `DELETE FROM horarios_indisponiveis WHERE id = ?`
        ).bind(parseInt(id)).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao eliminar horário indisponível:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
