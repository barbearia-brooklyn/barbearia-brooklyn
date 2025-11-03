export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const barbeiroId = url.searchParams.get('barbeiroId');
    const data = url.searchParams.get('data');
    const fromDate = url.searchParams.get('fromDate');

    try {
        let query = `
            SELECT * FROM horarios_indisponiveis
            WHERE 1=1
        `;

        const bindings = [];

        if (barbeiroId) {
            query += ` AND barbeiro_id = ?`;
            bindings.push(parseInt(barbeiroId));
        }

        if (data) {
            query += ` AND DATE(data_hora_inicio) <= ? AND DATE(data_hora_fim) >= ?`;
            bindings.push(data, data);
        }

        if (fromDate) {
            query += ` AND DATE(data_hora_fim) >= ?`;
            bindings.push(fromDate);
        }

        query += ` ORDER BY data_hora_inicio ASC`;

        const stmt = env.DB.prepare(query);
        const horarios = bindings.length > 0
            ? await stmt.bind(...bindings).all()
            : await stmt.all();

        return new Response(JSON.stringify(horarios.results || []), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao carregar horários indisponíveis:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
            const maxIterations = 365;
            let iterations = 0;

            while (iterations < maxIterations) {
                if (recurrenceEndDate && currentStart > recurrenceEndDate) {
                    break;
                }

                await createUnavailable(
                    currentStart.toISOString().slice(0, 19),
                    currentEnd.toISOString().slice(0, 19)
                );

                if (data.recurrence_type === 'daily') {
                    currentStart.setDate(currentStart.getDate() + 1);
                    currentEnd.setDate(currentEnd.getDate() + 1);
                } else if (data.recurrence_type === 'weekly') {
                    currentStart.setDate(currentStart.getDate() + 7);
                    currentEnd.setDate(currentEnd.getDate() + 7);
                }

                iterations++;

                if (!recurrenceEndDate && iterations >= 52) {
                    break;
                }
            }
        } else {
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