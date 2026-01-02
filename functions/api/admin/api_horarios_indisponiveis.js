/**
 * API Admin - Horários Indisponíveis com Filtro por Role
 * Admin: vê todos os horários
 * Barbeiro: vê apenas seus próprios horários
 */

import { authenticate, hasPermission } from './auth.js';

// GET - Listar horários indisponíveis
export async function onRequestGet({ env, request }) {
    try {
        console.log('✅ GET Horários Indisponíveis - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        console.log('👤 User autenticado:', user.username, 'Role:', user.role);

        const url = new URL(request.url);
        const barbeiroId = url.searchParams.get('barbeiroId') || url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data');
        const data_inicio = url.searchParams.get('data_inicio');
        const data_fim = url.searchParams.get('data_fim');
        const fromDate = url.searchParams.get('fromDate');
        const toDate = url.searchParams.get('toDate');
        const grouped = url.searchParams.get('grouped') === 'true';

        console.log('Parâmetros:', { barbeiroId, data, data_inicio, data_fim, fromDate, toDate, grouped });

        if (grouped) {
            // Retornar TODAS as instâncias, mas agrupadas
            let query = `
                SELECT * FROM horarios_indisponiveis 
                WHERE 1=1
            `;
            const bindings = [];

            // FILTRO POR ROLE: Barbeiro só vê seus horários
            if (user.role === 'barbeiro' && user.barbeiro_id) {
                query += ` AND barbeiro_id = ?`;
                bindings.push(user.barbeiro_id);
                console.log('🔒 Filtro barbeiro aplicado:', user.barbeiro_id);
            }

            // Admin pode filtrar por barbeiro específico
            if (user.role === 'admin' && barbeiroId) {
                query += ` AND barbeiro_id = ?`;
                bindings.push(parseInt(barbeiroId));
            }

            // Filtro de data de início (a partir de)
            if (fromDate) {
                query += ` AND DATE(data_hora_inicio) >= ?`;
                bindings.push(fromDate);
            }

            // Filtro de data de fim (até)
            if (toDate) {
                query += ` AND DATE(data_hora_inicio) <= ?`;
                bindings.push(toDate);
            }

            query += ` ORDER BY recurrence_group_id, data_hora_inicio ASC`;

            console.log('Executando query grouped...');
            const stmt = env.DB.prepare(query);
            const horarios = bindings.length > 0 
                ? await stmt.bind(...bindings).all() 
                : await stmt.all();

            console.log(`✅ ${horarios.results ? horarios.results.length : 0} horários encontrados`);

            return new Response(JSON.stringify({
                horarios: horarios.results || [],
                total: (horarios.results || []).length,
                user: {
                    role: user.role,
                    barbeiro_id: user.barbeiro_id
                }
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

            // FILTRO POR ROLE
            if (user.role === 'barbeiro' && user.barbeiro_id) {
                query += ` AND barbeiro_id = ?`;
                bindings.push(user.barbeiro_id);
            }

            if (user.role === 'admin' && barbeiroId) {
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

            // Filtros fromDate e toDate para listagem
            if (fromDate) {
                query += ` AND DATE(data_hora_inicio) >= ?`;
                bindings.push(fromDate);
            }

            if (toDate) {
                query += ` AND DATE(data_hora_inicio) <= ?`;
                bindings.push(toDate);
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
                total: (horarios.results || []).length,
                user: {
                    role: user.role,
                    barbeiro_id: user.barbeiro_id
                }
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

// POST - Criar horário indisponível
export async function onRequestPost({ request, env }) {
    try {
        console.log('✅ POST Horário Indisponível - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

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

        // PERMISSÃO: Barbeiro só pode criar horários para si mesmo
        if (user.role === 'barbeiro' && user.barbeiro_id !== parseInt(data.barbeiro_id)) {
            return new Response(JSON.stringify({
                error: 'Você só pode criar horários indisponíveis para si mesmo'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // MAPEAR MOTIVO PARA TIPO (se tipo não fornecido)
        let tipo = data.tipo;
        if (!tipo && data.motivo) {
            const motivoLower = data.motivo.toLowerCase();
            if (motivoLower.includes('almoço') || motivoLower.includes('almoco')) {
                tipo = 'outro';
            } else if (motivoLower.includes('pausa')) {
                tipo = 'outro';
            } else if (motivoLower.includes('reunião') || motivoLower.includes('reuniao')) {
                tipo = 'outro';
            } else if (motivoLower.includes('formação') || motivoLower.includes('formacao')) {
                tipo = 'outro';
            } else if (motivoLower.includes('pessoal')) {
                tipo = 'outro';
            } else if (motivoLower.includes('férias') || motivoLower.includes('ferias')) {
                tipo = 'ferias';
            } else if (motivoLower.includes('folga')) {
                tipo = 'folga';
            } else if (motivoLower.includes('ausência') || motivoLower.includes('ausencia')) {
                tipo = 'ausencia';
            } else {
                tipo = 'outro';
            }
        }
        
        // Fallback para 'outro' se ainda não definido
        if (!tipo) {
            tipo = 'outro';
        }

        console.log(`🏷️ Tipo atribuído: ${tipo}`);

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
                tipo,
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
                 AND status IN ('confirmada', 'faltou', 'concluida') 
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
                // Comparar apenas datas (sem hora) e usar >= para incluir o último dia
                if (recurrenceEndDate) {
                    const currentDateOnly = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate());
                    const endDateOnly = new Date(recurrenceEndDate.getFullYear(), recurrenceEndDate.getMonth(), recurrenceEndDate.getDate());
                    
                    if (currentDateOnly > endDateOnly) {
                        break;
                    }
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

// PATCH - Atualizar grupo de recorrência
export async function onRequestPatch({ request, env }) {
    try {
        console.log('✅ PATCH Grupo Recorrência - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const data = await request.json();
        console.log('Dados recebidos:', data);

        if (!data.recurrence_group_id) {
            return new Response(JSON.stringify({
                error: 'recurrence_group_id é obrigatório'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar um horário do grupo para verificar permissão
        const horario = await env.DB.prepare(
            'SELECT barbeiro_id FROM horarios_indisponiveis WHERE recurrence_group_id = ? LIMIT 1'
        ).bind(data.recurrence_group_id).first();

        if (!horario) {
            return new Response(JSON.stringify({
                error: 'Grupo de recorrência não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // PERMISSÃO: Barbeiro só pode atualizar seus próprios horários
        if (user.role === 'barbeiro' && user.barbeiro_id !== horario.barbeiro_id) {
            return new Response(JSON.stringify({
                error: 'Você só pode atualizar seus próprios horários'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualizar campos do grupo
        const updates = [];
        const params = [];

        if (data.motivo !== undefined) {
            updates.push('motivo = ?');
            params.push(data.motivo);
        }

        if (data.tipo) {
            updates.push('tipo = ?');
            params.push(data.tipo);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({
                error: 'Nenhum campo para atualizar'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        params.push(data.recurrence_group_id);

        await env.DB.prepare(
            `UPDATE horarios_indisponiveis SET ${updates.join(', ')} WHERE recurrence_group_id = ?`
        ).bind(...params).run();

        console.log('✅ Grupo atualizado');

        return new Response(JSON.stringify({
            success: true,
            message: 'Grupo atualizado com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar grupo:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar grupo',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Deletar horário ou grupo
export async function onRequestDelete({ request, env }) {
    try {
        console.log('✅ DELETE Horário - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const recurrenceGroupId = url.searchParams.get('recurrence_group_id');

        if (!id && !recurrenceGroupId) {
            return new Response(JSON.stringify({
                error: 'id ou recurrence_group_id é obrigatório'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (recurrenceGroupId) {
            // Verificar permissão
            const horario = await env.DB.prepare(
                'SELECT barbeiro_id FROM horarios_indisponiveis WHERE recurrence_group_id = ? LIMIT 1'
            ).bind(recurrenceGroupId).first();

            if (!horario) {
                return new Response(JSON.stringify({
                    error: 'Grupo não encontrado'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (user.role === 'barbeiro' && user.barbeiro_id !== horario.barbeiro_id) {
                return new Response(JSON.stringify({
                    error: 'Você só pode deletar seus próprios horários'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            await env.DB.prepare(
                'DELETE FROM horarios_indisponiveis WHERE recurrence_group_id = ?'
            ).bind(recurrenceGroupId).run();

            console.log('✅ Grupo deletado');
        } else {
            // Verificar permissão
            const horario = await env.DB.prepare(
                'SELECT barbeiro_id FROM horarios_indisponiveis WHERE id = ?'
            ).bind(parseInt(id)).first();

            if (!horario) {
                return new Response(JSON.stringify({
                    error: 'Horário não encontrado'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (user.role === 'barbeiro' && user.barbeiro_id !== horario.barbeiro_id) {
                return new Response(JSON.stringify({
                    error: 'Você só pode deletar seus próprios horários'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            await env.DB.prepare(
                'DELETE FROM horarios_indisponiveis WHERE id = ?'
            ).bind(parseInt(id)).run();

            console.log('✅ Horário deletado');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Deletado com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao deletar:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao deletar',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
