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

        if (!data.barbeiro_id || !data.tipo || !data.data_hora_inicio || !data.data_hora_fim) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta',
                received: data
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. ELIMINAR TODAS AS INSTÂNCIAS DO GRUPO ANTIGO
        console.log('Eliminando grupo antigo:', groupId);
        await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
        ).bind(groupId).run();

        // 2. REUTILIZAR O GROUP ID
        const newGroupId = groupId;
        console.log('Reutilizando Group ID:', newGroupId);

        // 3. CALCULAR DATAS E DURAÇÃO
        try {
            const startDate = new Date(data.data_hora_inicio);
            const endDate = new Date(data.data_hora_fim);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Datas inválidas: ' + data.data_hora_inicio + ' ou ' + data.data_hora_fim);
            }

            const timeDiff = endDate.getTime() - startDate.getTime();
            console.log('Duração (ms):', timeDiff);

            if (timeDiff <= 0) {
                throw new Error('Data/hora de fim deve ser posterior à de início');
            }

            // 4. CALCULAR DATA DE TÉRMINO DA RECORRÊNCIA
            const recurrenceType = data.recurrence_type || 'none';
            const recurrenceEndDate = data.recurrence_end_date;

            let endRecurrenceDate;
            if (recurrenceType !== 'none' && recurrenceEndDate) {
                endRecurrenceDate = new Date(recurrenceEndDate);
                if (isNaN(endRecurrenceDate.getTime())) {
                    throw new Error('Data de fim de recorrência inválida: ' + recurrenceEndDate);
                }
            } else if (recurrenceType !== 'none') {
                endRecurrenceDate = new Date(startDate);
                endRecurrenceDate.setDate(endRecurrenceDate.getDate() + 365);
            } else {
                endRecurrenceDate = new Date(startDate);
            }

            console.log('Recurrence type:', recurrenceType);
            console.log('End date recurrence:', endRecurrenceDate);

            const dayInMs = 24 * 60 * 60 * 1000;
            const weekInMs = 7 * dayInMs;
            const incrementInMs = recurrenceType === 'daily' ? dayInMs : (recurrenceType === 'weekly' ? weekInMs : 0);

            // 5. INSERIR NOVAS INSTÂNCIAS
            let currentDate = new Date(startDate);
            let instanceCount = 0;

            while (currentDate <= endRecurrenceDate && instanceCount < 1000) {
                try {
                    const currentEnd = new Date(currentDate.getTime() + timeDiff);

                    const startStr = currentDate.toISOString().slice(0, 19);
                    const endStr = currentEnd.toISOString().slice(0, 19);

                    console.log(`Inserindo instância ${instanceCount + 1}:`, startStr, endStr);

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
                        data.is_all_day ? 1 : 0,
                        recurrenceType,
                        newGroupId,
                        recurrenceEndDate ? recurrenceEndDate.toISOString().slice(0, 10) : null
                    ).run();

                    instanceCount++;

                    // Próxima instância
                    if (incrementInMs > 0) {
                        currentDate = new Date(currentDate.getTime() + incrementInMs);
                    } else {
                        break; // Sem recorrência, sair
                    }
                } catch (insertError) {
                    console.error('Erro ao inserir instância:', insertError);
                    throw insertError;
                }
            }

            console.log('Total instâncias criadas:', instanceCount);

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

        } catch (dateError) {
            console.error('Erro ao processar datas:', dateError);
            throw dateError;
        }

    } catch (error) {
        console.error('Erro ao atualizar grupo:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar grupo',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ✅ ADICIONAR ESTA FUNÇÃO QUE ESTAVA A FALTAR
export async function onRequestDelete({ env, params }) {
    try {
        const groupId = params.groupId;

        console.log('=== DELETE GRUPO ===');
        console.log('Group ID:', groupId);

        const result = await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
        ).bind(groupId).run();

        console.log('Resultado do DELETE:', result);

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

