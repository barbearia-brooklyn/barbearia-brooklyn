// /functions/api/admin/api_horarios_indisponiveis/group/[groupId].js

export async function onRequestGet({ env, params }) {
    try {
        const groupId = params.groupId;

        const instances = await env.DB.prepare(
            `SELECT * FROM horarios_indisponiveis
             WHERE recurrence_group_id = ?
             ORDER BY data_hora_inicio ASC`
        ).bind(groupId).all();

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
    let deletedCount = 0;

    try {
        const groupId = params.groupId;
        const data = await request.json();

        console.log('=== PUT GRUPO ===');
        console.log('Group ID:', groupId);
        console.log('Dados recebidos:', JSON.stringify(data, null, 2));

        if (!data.barbeiro_id || !data.tipo || !data.data_hora_inicio || !data.data_hora_fim) {
            console.error('Campos obrigatórios faltando:', {
                barbeiro_id: !!data.barbeiro_id,
                tipo: !!data.tipo,
                data_hora_inicio: !!data.data_hora_inicio,
                data_hora_fim: !!data.data_hora_fim
            });

            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta',
                missing: {
                    barbeiro_id: !data.barbeiro_id,
                    tipo: !data.tipo,
                    data_hora_inicio: !data.data_hora_inicio,
                    data_hora_fim: !data.data_hora_fim
                }
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. ELIMINAR TODAS AS INSTÂNCIAS DO GRUPO ANTIGO
        console.log('Passo 1: Eliminando instâncias antigas...');
        const deleteResult = await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
        ).bind(groupId).run();

        deletedCount = deleteResult.meta.duration ? 'sucesso' : 'verificar';
        console.log('Delete result:', JSON.stringify(deleteResult));

        // 2. REUTILIZAR O GROUP ID
        const newGroupId = groupId;

        // 3. CALCULAR PARÂMETROS
        console.log('Passo 2: Calculando parâmetros de recorrência...');

        const recurrenceType = data.recurrence_type || 'none';
        const recurrenceEndDateStr = data.recurrence_end_date;

        // ✅ CORRIGIR PARSE DAS DATAS
        const startDate = new Date(data.data_hora_inicio);
        const endDate = new Date(data.data_hora_fim);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error(`Datas inválidas: início=${data.data_hora_inicio}, fim=${data.data_hora_fim}`);
        }

        const timeDiff = endDate.getTime() - startDate.getTime();

        console.log('Start date:', startDate);
        console.log('End date:', endDate);
        console.log('Time diff (ms):', timeDiff);

        let endRecurrenceDate;
        if (recurrenceType !== 'none' && recurrenceEndDateStr) {
            endRecurrenceDate = new Date(recurrenceEndDateStr + 'T23:59:59');
        } else if (recurrenceType !== 'none') {
            endRecurrenceDate = new Date(startDate);
            endRecurrenceDate.setDate(endRecurrenceDate.getDate() + 365);
        } else {
            endRecurrenceDate = new Date(startDate);
        }

        const dayInMs = 24 * 60 * 60 * 1000;
        const weekInMs = 7 * dayInMs;
        const incrementInMs = recurrenceType === 'daily' ? dayInMs : (recurrenceType === 'weekly' ? weekInMs : 0);

        console.log('Recurrence:', recurrenceType);
        console.log('End recurrence date:', endRecurrenceDate);
        console.log('Increment:', incrementInMs);

        // 4. INSERIR INSTÂNCIAS
        console.log('Passo 3: Inserindo novas instâncias...');

        let currentDate = new Date(startDate);
        let instanceCount = 0;
        const errors = [];

        while (currentDate <= endRecurrenceDate) {
            try {
                const currentEnd = new Date(currentDate.getTime() + timeDiff);

                const startStr = currentDate.toISOString().slice(0, 19);
                const endStr = currentEnd.toISOString().slice(0, 19);

                console.log(`Inserindo instância ${instanceCount + 1}: ${startStr} a ${endStr}`);

                const insertResult = await env.DB.prepare(
                    `INSERT INTO horarios_indisponiveis 
                     (barbeiro_id, tipo, data_hora_inicio, data_hora_fim, motivo, is_all_day, recurrence_type, recurrence_group_id, recurrence_end_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    parseInt(data.barbeiro_id),
                    data.tipo,
                    startStr,
                    endStr,
                    data.motivo || null,
                    parseInt(data.is_all_day) || 0,
                    recurrenceType,
                    newGroupId,
                    endRecurrenceDate.toISOString().slice(0, 10)
                ).run();

                console.log(`Instância ${instanceCount + 1} inserida:`, insertResult.success);
                instanceCount++;

            } catch (insertError) {
                console.error(`Erro ao inserir instância ${instanceCount + 1}:`, insertError);
                errors.push({
                    instancia: instanceCount,
                    data: currentDate,
                    erro: insertError.message
                });
            }

            if (incrementInMs > 0) {
                currentDate = new Date(currentDate.getTime() + incrementInMs);
            } else {
                break;
            }
        }

        console.log('Total instâncias criadas:', instanceCount);

        if (instanceCount === 0) {
            throw new Error('Nenhuma instância foi criada. Verifique os dados.');
        }

        if (errors.length > 0) {
            console.error('Erros durante inserção:', errors);
        }

        // 5. VERIFICAR RESULTADO
        console.log('Passo 4: Verificando resultado...');

        const updated = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM horarios_indisponiveis
             WHERE recurrence_group_id = ?`
        ).bind(newGroupId).first();

        console.log('Final count:', updated.count);

        return new Response(JSON.stringify({
            success: true,
            message: 'Grupo atualizado com sucesso',
            groupId: newGroupId,
            instanceCount: instanceCount,
            deleted: deletedCount,
            errors: errors.length > 0 ? errors : []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao atualizar grupo:', error);
        console.error('Stack:', error.stack);

        return new Response(JSON.stringify({
            error: 'Erro ao atualizar grupo',
            details: error.message,
            deletedRecords: deletedCount,
            timestamp: new Date().toISOString()
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