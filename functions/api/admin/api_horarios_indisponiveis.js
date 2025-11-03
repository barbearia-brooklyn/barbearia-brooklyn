export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        const isRecurring = data.recurrence_type && data.recurrence_type !== 'none';
        const startDate = new Date(data.data_hora_inicio);
        const endDate = new Date(data.data_hora_fim);
        const recurrenceEndDate = data.recurrence_end_date ? new Date(data.recurrence_end_date) : null;

        // Função para criar um horário indisponível
        const createUnavailable = async (inicio, fim) => {
            await env.DB.prepare(
                `INSERT INTO horarios_indisponiveis 
                (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, is_all_day, recurrence_type, recurrence_end_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                data.barbeiro_id,
                inicio,
                fim,
                data.tipo,
                data.motivo || null,
                data.is_all_day || 0,
                data.recurrence_type || 'none',
                data.recurrence_end_date || null
            ).run();

            // Cancelar reservas conflitantes
            await env.DB.prepare(
                `UPDATE reservas 
                 SET status = 'cancelada'
                 WHERE barbeiro_id = ?
                 AND status = 'confirmada'
                 AND data_hora >= ?
                 AND data_hora < ?`
            ).bind(data.barbeiro_id, inicio, fim).run();
        };

        if (isRecurring) {
            let currentStart = new Date(startDate);
            let currentEnd = new Date(endDate);
            const maxIterations = 365; // Limite de segurança
            let iterations = 0;

            while (iterations < maxIterations) {
                // Verificar se deve continuar
                if (recurrenceEndDate && currentStart > recurrenceEndDate) {
                    break;
                }

                // Criar horário indisponível para a data atual
                await createUnavailable(
                    currentStart.toISOString().slice(0, 19),
                    currentEnd.toISOString().slice(0, 19)
                );

                // Avançar para próxima ocorrência
                if (data.recurrence_type === 'daily') {
                    currentStart.setDate(currentStart.getDate() + 1);
                    currentEnd.setDate(currentEnd.getDate() + 1);
                } else if (data.recurrence_type === 'weekly') {
                    currentStart.setDate(currentStart.getDate() + 7);
                    currentEnd.setDate(currentEnd.getDate() + 7);
                }

                iterations++;

                // Se não há data final, criar apenas para 1 ano
                if (!recurrenceEndDate && iterations >= 52) {
                    break;
                }
            }
        } else {
            // Criar apenas um horário indisponível
            await createUnavailable(data.data_hora_inicio, data.data_hora_fim);
        }

        return new Response(JSON.stringify({
            success: true,
            message: isRecurring ? 'Horários recorrentes criados' : 'Horário criado'
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