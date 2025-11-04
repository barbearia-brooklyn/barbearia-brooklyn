// /functions/api/admin/api_horarios_indisponiveis/group/[groupId].js

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
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao obter grupo:', error);
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

        if (!data.barbeiro_id || !data.tipo || !data.data_hora_inicio || !data.data_hora_fim) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. ELIMINAR TODAS AS INSTÂNCIAS DO GRUPO ANTIGO
        console.log('Eliminando grupo antigo...');
        await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
        ).bind(groupId).run();

        // 2. REUTILIZAR O GROUP ID
        const newGroupId = groupId;
        console.log('Group ID (reutilizado):', newGroupId);

        // 3. CALCULAR PARÂMETROS DE RECORRÊNCIA
        const recurrenceType = data.recurrence_type || 'none';
        const recurrenceEndDate = data.recurrence_end_date;

        const startDate = new Date(data.data_hora_inicio);
        const endDate = new Date(data.data_hora_fim);
        const timeDiff = endDate - startDate;

        let endRecurrenceDate;
        if (recurrenceType !== 'none' && recurrenceEndDate) {
            endRecurrenceDate = new Date(recurrenceEndDate);
        } else if (recurrenceType !== 'none') {
            endRecurrenceDate = new Date(startDate);
            endRecurrenceDate.setDate(endRecurrenceDate.getDate() + 365);
        } else {
            endRecurrenceDate = startDate;
        }

        const dayInMs = 24 * 60 * 60 * 1000;
        const weekInMs = 7 * dayInMs;
        const incrementInMs = recurrenceType === 'daily' ? dayInMs : (recurrenceType === 'weekly' ? weekInMs : 0);

        console.log('Recurrence type:', recurrenceType);
        console.log('End date:', endRecurrenceDate);

        // 4. INSERIR TODAS AS NOVAS INSTÂNCIAS
        let currentDate = new Date(startDate);
        let instanceCount = 0;

        while (currentDate <= endRecurrenceDate) {
            const currentEnd = new Date(currentDate.getTime() + timeDiff);

            const startStr = currentDate.toISOString().slice(0, 19);
            const endStr = currentEnd.toISOString().slice(0, 19);

            console.log(`Inserindo instância ${instanceCount + 1}:`, startStr);

            await env.DB.prepare(
                `INSERT INTO horarios_indisponiveis 
                 (barbeiro_id, tipo, data_hora_inicio, data_hora_fim, motivo, is_all_day, recurrence_type, recurrence_group_id, recurrence_end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                parseInt(data.barbeiro_id),
                data.tipo,
                startStr,
                endStr,
                data.motivo || null,
                data.is_all_day || 0,
                recurrenceType,
                newGroupId,
                recurrenceEndDate ? recurrenceEndDate.toISOString().slice(0, 10) : null
            ).run();

            instanceCount++;

            if (incrementInMs > 0) {
                currentDate = new Date(currentDate.getTime() + incrementInMs);
            } else {
                break;
            }
        }

        console.log('Total instâncias criadas:', instanceCount);

        // 5. BUSCAR RESULTADO
        const updated = await env.DB.prepare(
            `SELECT * FROM horarios_indisponiveis
             WHERE recurrence_group_id = ?
             ORDER BY data_hora_inicio ASC`
        ).bind(newGroupId).all();

        return new Response(JSON.stringify({
            success: true,
            message: 'Grupo atualizado com sucesso',
            groupId: newGroupId,
            instanceCount: instanceCount,
            data: updated.results || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao atualizar grupo:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar grupo',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete({ env, params }) {
    try {
        const groupId = params.groupId;

        console.log('=== DELETE GRUPO ===');
        console.log('Group ID:', groupId);

        const result = await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
        ).bind(groupId).run();

        console.log('Resultado:', result);

        return new Response(JSON.stringify({
            success: true,
            message: 'Grupo eliminado com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao eliminar grupo:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao eliminar grupo',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
