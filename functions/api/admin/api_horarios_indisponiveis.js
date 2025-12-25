/**
 * API Admin - Horários Indisponíveis
 * Gestão de bloqueios de horários
 */

export async function onRequestGet({ env, request }) {
    try {
        console.log('✅ GET Horários Indisponíveis - Iniciando...');

        const url = new URL(request.url);
        const barbeiroId = url.searchParams.get('barbeiroId') || url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data');
        const data_inicio = url.searchParams.get('data_inicio');
        const data_fim = url.searchParams.get('data_fim');
        const fromDate = url.searchParams.get('fromDate');
        const grouped = url.searchParams.get('grouped') === 'true';

        console.log('Parâmetros:', { barbeiroId, data, data_inicio, data_fim, fromDate, grouped });

        if (grouped) {
            // Retornar apenas grupos (primeiro item de cada grupo)
            let query = `
                SELECT h.*
                FROM horarios_indisponiveis h
                WHERE h.id IN (
                    SELECT MIN(id)
                    FROM horarios_indisponiveis
                    WHERE 1=1
            `;

            const bindings = [];

            if (barbeiroId) {
                query += ` AND barbeiro_id = ?`;
                bindings.push(parseInt(barbeiroId));
            }

            if (fromDate) {
                query += ` AND DATE(data_hora_fim) >= ?`;
                bindings.push(fromDate);
            }

            query += `
                    GROUP BY COALESCE(recurrence_group_id, CAST(id AS TEXT))
                )
                ORDER BY h.data_hora_inicio ASC
            `;

            console.log('Executando query grouped...');
            const stmt = env.DB.prepare(query);
            const horarios = bindings.length > 0
                ? await stmt.bind(...bindings).all()
                : await stmt.all();

            // Para cada grupo, contar quantos itens tem
            const results = await Promise.all((horarios.results || []).map(async (h) => {
                if (h.recurrence_group_id) {
                    const countStmt = env.DB.prepare(
                        `SELECT COUNT(*) as count FROM horarios_indisponiveis WHERE recurrence_group_id = ?`
                    );
                    const countResult = await countStmt.bind(h.recurrence_group_id).first();
                    h.instance_count = countResult.count;
                } else {
                    h.instance_count = 1;
                }
                return h;
            }));

            console.log(`✅ ${results.length} horários grouped encontrados`);

            return new Response(JSON.stringify({
                horarios: results,
                total: results.length
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            // Comportamento normal - retornar todos
            let query = `
                SELECT * FROM horarios_indisponiveis
                WHERE 1=1
            `;

            const bindings = [];

            if (barbeiroId) {
                query += ` AND barbeiro_id = ?`;
                bindings.push(parseInt(barbeiroId));
            }

            // Filtro por data exata
            if (data) {
                query += ` AND DATE(data_hora_inicio) <= ? AND DATE(data_hora_fim) >= ?`;
                bindings.push(data, data);
            }

            // Filtro por intervalo de datas
            if (data_inicio && data_fim) {
                query += ` AND (
                    (DATE(data_hora_inicio) BETWEEN DATE(?) AND DATE(?))
                    OR (DATE(data_hora_fim) BETWEEN DATE(?) AND DATE(?))
                    OR (DATE(data_hora_inicio) <= DATE(?) AND DATE(data_hora_fim) >= DATE(?))
                )`;
                bindings.push(data_inicio, data_fim, data_inicio, data_fim, data_inicio, data_fim);
            } else if (data_inicio) {
                query += ` AND DATE(data_hora_fim) >= DATE(?)`;
                bindings.push(data_inicio);
            } else if (data_fim) {
                query += ` AND DATE(data_hora_inicio) <= DATE(?)`;
                bindings.push(data_fim);
            }

            if (fromDate) {
                query += ` AND DATE(data_hora_fim) >= ?`;
                bindings.push(fromDate);
            }
            query += ` ORDER BY data_hora_inicio ASC`;

            console.log('Executando query normal...');
            const stmt = env.DB.prepare(query);
            const horarios = bindings.length > 0
                ? await stmt.bind(...bindings).all()
                : await stmt.all();

            console.log(`✅ ${horarios.results ? horarios.results.length : 0} horários encontrados`);

            return new Response(JSON.stringify({
                horarios: horarios.results || [],
                total: (horarios.results || []).length
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar horários indisponíveis:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao carregar horários indisponíveis',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        console.log('✅ POST Horário Indisponível - Iniciando...');

        const data = await request.json();
        console.log('Dados recebidos:', data);

        // Validações
        if (!data.barbeiro_id || !data.data_hora_inicio || !data.data_hora_fim) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios: barbeiro_id, data_hora_inicio, data_hora_fim'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isRecurring = data.recurrence_type && data.recurrence_type !== 'none';
        const startDate = new Date(data.data_hora_inicio);
        const endDate = new Date(data.data_hora_fim);
        const recurrenceEndDate = data.recurrence_end_date ? new Date(data.recurrence_end_date) : null;

        // Gerar ID único para o grupo de recorrência
        const recurrenceGroupId = isRecurring ? `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

        // Função para criar um horário indisponível
        const createUnavailable = async (inicio, fim) => {
            await env.DB.prepare(
                `INSERT INTO horarios_indisponiveis 
                (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, is_all_day, recurrence_type, recurrence_end_date, recurrence_group_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                parseInt(data.barbeiro_id),
                inicio,
                fim,
                data.tipo || 'bloqueio',
                data.motivo || null,
                data.is_all_day || 0,
                data.recurrence_type || 'none',
                data.recurrence_end_date || null,
                recurrenceGroupId
            ).run();

            // Cancelar reservas conflitantes
            await env.DB.prepare(
                `UPDATE reservas 
                 SET status = 'cancelada'
                 WHERE barbeiro_id = ?
                 AND status = 'confirmada'
                 AND data_hora >= ?
                 AND data_hora < ?`
            ).bind(parseInt(data.barbeiro_id), inicio, fim).run();
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

        console.log('✅ Horário(s) criado(s) com sucesso');

        return new Response(JSON.stringify({
            success: true,
            recurrence_group_id: recurrenceGroupId,
            message: isRecurring ? 'Horários recorrentes criados' : 'Horário criado com sucesso'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('❌ Erro ao criar horário indisponível:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao criar horário indisponível',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
