// Obter todas as instâncias de um grupo
export async function onRequestGet({ env, params }) {
    try {
        const groupId = params.groupId;

        const stmt = env.DB.prepare(
            `SELECT * FROM horarios_indisponiveis
             WHERE recurrence_group_id = ?
             ORDER BY data_hora_inicio ASC`
        );

        const instances = await stmt.bind(groupId).all();

        return new Response(JSON.stringify(instances.results || []), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut({ env, params, request }) {
    try {
        const groupId = params.groupId;
        const data = await request.json();

        console.log('=== PUT GRUPO ===');
        console.log('Group ID:', groupId);
        console.log('Dados:', data);

        const result = await env.DB.prepare(
            `UPDATE horarios_indisponiveis
             SET barbeiro_id = ?, tipo = ?, motivo = ?, is_all_day = ?
             WHERE recurrence_group_id = ?`
        ).bind(
            parseInt(data.barbeiro_id), // ✅ ADICIONAR ESTE CAMPO
            data.tipo,
            data.motivo || null,
            data.is_all_day || 0,
            groupId
        ).run();

        console.log('Resultado:', result);

        if (!result.success) {
            throw new Error('Falha ao atualizar grupo');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Grupo atualizado com sucesso'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao atualizar grupo:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete({ env, params }) {
    try {
        const groupId = params.groupId;

        const result = await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
        ).bind(groupId).run();

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
