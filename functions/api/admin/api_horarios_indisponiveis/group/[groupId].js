export async function onRequestPut({ env, params, request }) {
    try {
        const groupId = params.groupId;
        const data = await request.json();

        console.log('=== PUT GRUPO ===');
        console.log('Group ID:', groupId);
        console.log('Dados:', data);

        const result = await env.DB.prepare(
            `UPDATE horarios_indisponiveis
             SET barbeiro_id = ?, 
                 tipo = ?, 
                 motivo = ?, 
                 is_all_day = ?,
                 data_hora_inicio = ?,
                 data_hora_fim = ?,
                 recurrence_type = ?,
                 recurrence_end_date = ?
             WHERE recurrence_group_id = ?`
        ).bind(
            parseInt(data.barbeiro_id),
            data.tipo,
            data.motivo || null,
            data.is_all_day || 0,
            data.data_hora_inicio,
            data.data_hora_fim,
            data.recurrence_type || 'none',
            data.recurrence_end_date || null,
            groupId
        ).run();

        console.log('Resultado:', result);

        if (!result.success) {
            throw new Error('Falha ao atualizar grupo');
        }

        const updated = await env.DB.prepare(
            `SELECT * FROM horarios_indisponiveis
             WHERE recurrence_group_id = ?
             LIMIT 1`
        ).bind(groupId).first();

        console.log('Dados após atualização:', updated);

        return new Response(JSON.stringify({
            success: true,
            message: 'Grupo atualizado com sucesso',
            data: updated
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
