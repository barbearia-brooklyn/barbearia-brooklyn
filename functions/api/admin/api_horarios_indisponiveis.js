export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        // Inserir horário indisponível
        const result = await env.DB.prepare(
            `INSERT INTO horarios_indisponiveis 
             (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, recorrencia, todo_dia, data_fim_recorrencia)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            data.barbeiro_id,
            data.data_hora_inicio,
            data.data_hora_fim,
            data.tipo,
            data.motivo || null,
            data.recorrencia || 'unico',
            data.todo_dia || 0,
            data.data_fim_recorrencia || null
        ).run();

        // Cancelar reservas conflitantes
        await cancelConflictingReservations(env, data);

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao criar horário indisponível:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function cancelConflictingReservations(env, horario) {
    const inicio = new Date(horario.data_hora_inicio);
    const fim = new Date(horario.data_hora_fim);

    if (horario.recorrencia === 'unico') {
        // Cancelar apenas no período específico
        await env.DB.prepare(
            `UPDATE reservas 
             SET status = 'cancelada'
             WHERE barbeiro_id = ?
             AND status = 'confirmada'
             AND data_hora >= ?
             AND data_hora < ?`
        ).bind(
            horario.barbeiro_id,
            horario.data_hora_inicio,
            horario.data_hora_fim
        ).run();
    } else {
        // Para recorrência, cancelar baseado no padrão
        const dataFimRecorrencia = horario.data_fim_recorrencia
            ? new Date(horario.data_fim_recorrencia)
            : new Date(inicio.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 ano

        if (horario.recorrencia === 'diario') {
            // Cancelar diariamente no mesmo horário
            await cancelRecurringReservations(env, horario, inicio, fim, dataFimRecorrencia, 1);
        } else if (horario.recorrencia === 'semanal') {
            // Cancelar semanalmente no mesmo dia e horário
            await cancelRecurringReservations(env, horario, inicio, fim, dataFimRecorrencia, 7);
        }
    }
}

async function cancelRecurringReservations(env, horario, inicio, fim, dataFim, intervaloDias) {
    let currentDate = new Date(inicio);

    while (currentDate <= dataFim) {
        const inicioOcorrencia = new Date(currentDate);
        const fimOcorrencia = new Date(currentDate);
        fimOcorrencia.setHours(fim.getHours(), fim.getMinutes(), 0, 0);

        await env.DB.prepare(
            `UPDATE reservas 
             SET status = 'cancelada'
             WHERE barbeiro_id = ?
             AND status = 'confirmada'
             AND data_hora >= ?
             AND data_hora < ?`
        ).bind(
            horario.barbeiro_id,
            inicioOcorrencia.toISOString(),
            fimOcorrencia.toISOString()
        ).run();

        currentDate.setDate(currentDate.getDate() + intervaloDias);
    }
}