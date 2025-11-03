export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        const repetir = data.repetir || 'nao';
        const tododia = data.todo_dia || 0;

        if (repetir === 'nao') {
            // Criar horário único
            const result = await env.DB.prepare(
                `INSERT INTO horarios_indisponiveis (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, todo_dia, repetir)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                data.barbeiro_id,
                data.data_hora_inicio,
                data.data_hora_fim,
                data.tipo,
                data.motivo || null,
                tododia,
                repetir
            ).run();

            // Cancelar reservas conflitantes
            await cancelConflictingReservations(env, data.barbeiro_id, data.data_hora_inicio, data.data_hora_fim);

            return new Response(JSON.stringify({
                success: true,
                id: result.meta.last_row_id
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Criar horários repetidos
            const startDate = new Date(data.data_hora_inicio);
            const endDate = new Date(data.data_hora_fim);
            const startTime = startDate.toTimeString().slice(0, 8);
            const endTime = endDate.toTimeString().slice(0, 8);

            const occurrences = [];
            const maxDate = new Date(startDate);
            maxDate.setFullYear(maxDate.getFullYear() + 1); // 365 dias

            let currentDate = new Date(startDate);

            while (currentDate <= maxDate) {
                const occurrenceStart = new Date(currentDate);
                const occurrenceEnd = new Date(currentDate);

                // Aplicar horários
                const [startH, startM, startS] = startTime.split(':');
                const [endH, endM, endS] = endTime.split(':');

                occurrenceStart.setHours(parseInt(startH), parseInt(startM), parseInt(startS));
                occurrenceEnd.setHours(parseInt(endH), parseInt(endM), parseInt(endS));

                occurrences.push({
                    inicio: occurrenceStart.toISOString().replace('T', ' ').slice(0, 19),
                    fim: occurrenceEnd.toISOString().replace('T', ' ').slice(0, 19)
                });

                // Avançar para próxima ocorrência
                if (repetir === 'diario') {
                    currentDate.setDate(currentDate.getDate() + 1);
                } else if (repetir === 'semanal') {
                    currentDate.setDate(currentDate.getDate() + 7);
                }
            }

            // Inserir todas as ocorrências
            for (const occurrence of occurrences) {
                await env.DB.prepare(
                    `INSERT INTO horarios_indisponiveis (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, todo_dia, repetir)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    data.barbeiro_id,
                    occurrence.inicio,
                    occurrence.fim,
                    data.tipo,
                    data.motivo || null,
                    tododia,
                    repetir
                ).run();

                // Cancelar reservas conflitantes para cada ocorrência
                await cancelConflictingReservations(env, data.barbeiro_id, occurrence.inicio, occurrence.fim);
            }

            return new Response(JSON.stringify({
                success: true,
                count: occurrences.length
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Erro ao criar horário indisponível:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function cancelConflictingReservations(env, barbeiroId, inicio, fim) {
    await env.DB.prepare(
        `UPDATE reservas 
         SET status = 'cancelada'
         WHERE barbeiro_id = ?
         AND status = 'confirmada'
         AND data_hora >= ?
         AND data_hora < ?`
    ).bind(barbeiroId, inicio, fim).run();
}