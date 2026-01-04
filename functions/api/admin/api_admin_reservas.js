/**
 * API Admin - Reservas com Filtro por Role
 * Admin: vê todas as reservas
 * Barbeiro: vê apenas suas próprias reservas
 */

import { authenticate, hasPermission } from './auth.js';
import { 
    setNextAppointment,
    markAppointmentAsCompleted,
    undoCompletedAppointment,
    updateNextAppointmentAfterCancellation
} from '../../utils/appointmentManager.js';
import { generateCancellationEmailContent } from '../../templates/emailCancelamento.js';
import { generateEmailContent } from '../../templates/emailReserva.js';

// GET - Listar reservas
export async function onRequestGet({ request, env }) {
    try {
        console.log('✅ GET Reservas - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const url = new URL(request.url);
        const barbeiro_id = url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data');
        const data_inicio = url.searchParams.get('data_inicio');
        const data_fim = url.searchParams.get('data_fim');
        const status = url.searchParams.get('status');
        const cliente_id = url.searchParams.get('cliente_id');

        let query = `
            SELECT 
                r.id,
                r.cliente_id,
                r.barbeiro_id,
                r.servico_id,
                r.data_hora,
                r.comentario,
                r.nota_privada,
                r.status,
                r.created_by,
                r.duracao_minutos,
                r.criado_em,
                c.nome as cliente_nome,
                c.email as cliente_email,
                c.telefone as cliente_telefone,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.duracao as servico_duracao,
                s.preco as servico_preco
            FROM reservas r
            INNER JOIN clientes c ON r.cliente_id = c.id
            INNER JOIN barbeiros b ON r.barbeiro_id = b.id
            INNER JOIN servicos s ON r.servico_id = s.id
            WHERE 1=1
        `;

        const params = [];

        // FILTRO POR ROLE: Barbeiro só vê suas reservas
        if (user.role === 'barbeiro' && user.barbeiro_id) {
            query += ` AND r.barbeiro_id = ?`;
            params.push(user.barbeiro_id);
            console.log('🔒 Filtro barbeiro aplicado:', user.barbeiro_id);
        }

        // Admin pode filtrar por barbeiro específico
        if (user.role === 'admin' && barbeiro_id) {
            query += ' AND r.barbeiro_id = ?';
            params.push(parseInt(barbeiro_id));
        }

        if (cliente_id) {
            query += ' AND r.cliente_id = ?';
            params.push(parseInt(cliente_id));
        }

        // Filtro por data exata
        if (data) {
            query += ' AND DATE(r.data_hora) = DATE(?)';
            params.push(data);
        }

        // Filtro por intervalo de datas
        if (data_inicio && data_fim) {
            query += ' AND DATE(r.data_hora) BETWEEN DATE(?) AND DATE(?)';
            params.push(data_inicio, data_fim);
        } else if (data_inicio) {
            query += ' AND DATE(r.data_hora) >= DATE(?)';
            params.push(data_inicio);
        } else if (data_fim) {
            query += ' AND DATE(r.data_hora) <= DATE(?)';
            params.push(data_fim);
        }

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.data_hora DESC';

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        const response = {
            reservas: results || [],
            total: results ? results.length : 0,
            user: {
                role: user.role,
                barbeiro_id: user.barbeiro_id
            }
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar reservas:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar reservas',
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

// POST - Criar nova reserva (ADMIN + BARBEIRO)
export async function onRequestPost({ request, env }) {
    try {
        console.log('✅ POST Reserva - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const data = await request.json();

        // Validações
        if (!data.cliente_id || !data.barbeiro_id || !data.servico_id || !data.data_hora) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta: cliente_id, barbeiro_id, servico_id, data_hora'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // PERMISSÃO: Barbeiro só pode criar reservas para si mesmo
        if (user.role === 'barbeiro' && user.barbeiro_id !== parseInt(data.barbeiro_id)) {
            return new Response(JSON.stringify({
                error: 'Você só pode criar reservas para si mesmo'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se o cliente existe
        const cliente = await env.DB.prepare(
            'SELECT id, nome, email, telefone FROM clientes WHERE id = ?'
        ).bind(parseInt(data.cliente_id)).first();

        if (!cliente) {
            return new Response(JSON.stringify({
                error: 'Cliente não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se barbeiro existe
        const barbeiro = await env.DB.prepare(
            'SELECT id, nome FROM barbeiros WHERE id = ?'
        ).bind(parseInt(data.barbeiro_id)).first();

        if (!barbeiro) {
            return new Response(JSON.stringify({
                error: 'Barbeiro não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se serviço existe e buscar duração
        const servico = await env.DB.prepare(
            'SELECT id, nome, duracao, preco FROM servicos WHERE id = ?'
        ).bind(parseInt(data.servico_id)).first();

        if (!servico) {
            return new Response(JSON.stringify({
                error: 'Serviço não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Determinar duração: usar a fornecida ou buscar do serviço
        const duracaoFinal = data.duracao_minutos ? parseInt(data.duracao_minutos) : servico.duracao;

        // Verificar disponibilidade
        const { results: conflicts } = await env.DB.prepare(
            `SELECT id FROM reservas 
             WHERE barbeiro_id = ? 
             AND data_hora = ? 
             AND status IN ('confirmada', 'faltou', 'concluida')`
        ).bind(parseInt(data.barbeiro_id), data.data_hora).all();

        if (conflicts && conflicts.length > 0) {
            return new Response(JSON.stringify({
                error: 'Horário já reservado para este barbeiro'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Determinar created_by
        let created_by = data.created_by || 'admin'; // Default para admin
        if (user.role === 'barbeiro') {
            created_by = 'barbeiro';
        }
        // Validar valores permitidos
        if (!['online', 'admin', 'barbeiro'].includes(created_by)) {
            created_by = 'admin';
        }

        // Criar reserva
        const result = await env.DB.prepare(
            `INSERT INTO reservas (cliente_id, barbeiro_id, servico_id, data_hora, comentario, nota_privada, status, created_by, duracao_minutos) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            parseInt(data.cliente_id),
            parseInt(data.barbeiro_id),
            parseInt(data.servico_id),
            data.data_hora,
            data.comentario || data.notas || null,
            data.nota_privada || null,
            data.status || 'confirmada',
            created_by,
            duracaoFinal
        ).run();

        if (!result.success) {
            throw new Error('Falha ao criar reserva');
        }
        
        // Atualizar next_appointment_date do cliente se a reserva está confirmada
        if (data.status === 'confirmada' || !data.status) {
            await setNextAppointment(env, parseInt(data.cliente_id), data.data_hora);
        }

        // === DEBUG DETALHADO DE EMAIL ===
        const shouldSendEmail = data.notificar_email === true;
        const hasValidEmail = cliente.email && cliente.email.includes('@');

        if (shouldSendEmail && hasValidEmail) {
            try {
                // Gerar conteúdo do email
                const emailContent = generateEmailContent(
                    {
                        nome: cliente.nome,
                        email: cliente.email,
                        telefone: cliente.telefone,
                        data: data.data_hora.split('T')[0],
                        hora: data.data_hora.split('T')[1].substring(0, 5),
                        comentario: data.comentario || data.notas
                    },
                    barbeiro,
                    servico,
                    result.meta.last_row_id
                );
                
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Brooklyn Barbearia <noreply@brooklynbarbearia.pt>',
                        to: cliente.email,
                        subject: 'Confirmação de Reserva - Brooklyn Barbearia',
                        html: emailContent.html,
                        attachments: [
                            {
                                filename: `reserva-${result.meta.last_row_id}.ics`,
                                content: btoa(emailContent.ics),
                                content_type: 'text/calendar'
                            }
                        ]
                    })
                });

                const emailResponseData = await emailResponse.json();
                console.log('📨 Resposta Resend - Dados:', JSON.stringify(emailResponseData, null, 2));

                if (!emailResponse.ok) {
                    console.error('❌ ERRO ao enviar email:', emailResponseData);
                }
            } catch (emailError) {
                console.error('❌❌❌ EXCEÇÃO ao enviar email:', emailError);
                console.error('   Stack:', emailError.stack);
            }
        } else if (shouldSendEmail && !hasValidEmail) {
            console.log('⚠️ Email NÃO enviado - Cliente não tem email válido');
        } else {
            console.log('❌ Email NÃO enviado - Checkbox não marcada (notificar_email =', data.notificar_email, ')');
        }

        // Buscar reserva criada com todos os detalhes
        const newReserva = await env.DB.prepare(
            `SELECT 
                r.*,
                c.nome as cliente_nome,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.preco as servico_preco
             FROM reservas r
             INNER JOIN clientes c ON r.cliente_id = c.id
             INNER JOIN barbeiros b ON r.barbeiro_id = b.id
             INNER JOIN servicos s ON r.servico_id = s.id
             WHERE r.id = ?`
        ).bind(result.meta.last_row_id).first();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
            reserva: newReserva,
            message: 'Reserva criada com sucesso'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao criar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao criar reserva',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT - Atualizar reserva
export async function onRequestPut({ request, env }) {
    try {
        console.log('\n\n==========================================================');
        console.log('🔄 PUT RESERVA INICIADO');
        console.log('==========================================================');
        
        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        const data = await request.json();

        console.log('🆔 Reserva ID:', id);
        console.log('📝 Dados recebidos:', JSON.stringify(data, null, 2));

        // Buscar reserva existente
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({
                error: 'Reserva não encontrada'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('🔍 Reserva atual:', JSON.stringify(reserva, null, 2));

        // PERMISSÃO: Barbeiro só pode atualizar suas próprias reservas
        if (user.role === 'barbeiro' && user.barbeiro_id !== reserva.barbeiro_id) {
            return new Response(JSON.stringify({
                error: 'Você só pode atualizar suas próprias reservas'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Guardar status anterior para comparação
        const statusAnterior = reserva.status;
        const statusNovo = data.status;

        console.log('🛡️ Status - Anterior:', statusAnterior, '| Novo:', statusNovo);

        // Atualizar apenas campos fornecidos
        const updates = [];
        const params = [];

        if (data.status) {
            updates.push('status = ?');
            params.push(data.status);
        }

        if (data.comentario !== undefined) {
            updates.push('comentario = ?');
            params.push(data.comentario);
        }

        if (data.nota_privada !== undefined) {
            updates.push('nota_privada = ?');
            params.push(data.nota_privada);
        }

        if (data.data_hora) {
            updates.push('data_hora = ?');
            params.push(data.data_hora);
        }

        if (data.duracao_minutos !== undefined) {
            updates.push('duracao_minutos = ?');
            params.push(data.duracao_minutos ? parseInt(data.duracao_minutos) : null);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({
                error: 'Nenhum campo para atualizar'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        params.push(parseInt(id));

        console.log('🔧 Updates SQL:', updates);
        console.log('🔧 Params:', params);

        await env.DB.prepare(
            `UPDATE reservas SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...params).run();

        console.log('✅ UPDATE na BD executado com sucesso');

        // GESTÃO DE STATUS E APPOINTMENTS
        
        // Se mudou para 'concluida'
        if (statusNovo === 'concluida' && statusAnterior !== 'concluida') {
            console.log('✅ Marcando appointment como concluída...');
            await markAppointmentAsCompleted(env, reserva.cliente_id, reserva.data_hora);
        }

        // Se era 'concluida' e mudou para outro status
        if (statusAnterior === 'concluida' && statusNovo && statusNovo !== 'concluida') {
            console.log('↩️ Revertendo appointment concluída...');
            await undoCompletedAppointment(env, reserva.cliente_id, reserva.data_hora);
        }

        // Se foi cancelada por admin/barbeiro, enviar email SEMPRE (independente de checkbox)
        if (statusNovo === 'cancelada' && statusAnterior !== 'cancelada') {
            console.log('\n==========================================================');
            console.log('📧 INÍCIO DEBUG EMAIL DE CANCELAMENTO');
            console.log('==========================================================');
            console.log('📧 Processando cancelamento de reserva ID:', reserva.id);
            console.log('📅 Data/Hora da reserva:', reserva.data_hora);
            console.log('🆔 Cliente ID:', reserva.cliente_id);
            
            // Buscar dados completos para o email
            const cliente = await env.DB.prepare(
                'SELECT * FROM clientes WHERE id = ?'
            ).bind(reserva.cliente_id).first();
            
            console.log('\n👤 === DADOS DO CLIENTE ===');
            console.log('   Nome:', cliente?.nome);
            console.log('   Email:', cliente?.email);
            console.log('   Telefone:', cliente?.telefone);
            console.log('   Objeto completo:', JSON.stringify(cliente, null, 2));
            
            const hasValidEmail = cliente?.email && cliente.email.includes('@');
            console.log('\n❓ === VALIDAÇÃO EMAIL ===');
            console.log('   Email existe?', !!cliente?.email);
            console.log('   Email valor:', cliente?.email);
            console.log('   Contém @?', cliente?.email?.includes('@'));
            console.log('   Email VáLIDO?', hasValidEmail);
            console.log('   RESEND_API_KEY existe?', !!env.RESEND_API_KEY);
            console.log('   RESEND_API_KEY length:', env.RESEND_API_KEY?.length);
            
            if (hasValidEmail) {
                console.log('\n✅ Email válido! Buscando dados adicionais...');
                
                const barbeiro = await env.DB.prepare(
                    'SELECT * FROM barbeiros WHERE id = ?'
                ).bind(reserva.barbeiro_id).first();
                
                console.log('   Barbeiro:', barbeiro?.nome);
                
                const servico = await env.DB.prepare(
                    'SELECT * FROM servicos WHERE id = ?'
                ).bind(reserva.servico_id).first();
                
                console.log('   Serviço:', servico?.nome);
                
                const motivo = data.nota_privada || data.motivo_cancelamento || 'Cancelamento solicitado pela barbearia.';
                console.log('   Motivo do cancelamento:', motivo);
                
                console.log('\n🎭 Gerando conteúdo do email...');
                const emailContent = generateCancellationEmailContent(
                    reserva, 
                    cliente, 
                    barbeiro, 
                    servico, 
                    motivo
                );
                console.log('   HTML length:', emailContent.html?.length);
                console.log('   ICS length:', emailContent.ics?.length);
                
                // Enviar email
                try {
                    console.log('\n🚀 === TENTANDO ENVIAR EMAIL ===');
                    console.log('   URL: https://api.resend.com/emails');
                    console.log('   Method: POST');
                    console.log('   Para:', cliente.email);
                    console.log('   De: Brooklyn Barbearia <noreply@brooklynbarbearia.pt>');
                    console.log('   Subject: Reserva Cancelada - Brooklyn Barbearia');
                    
                    const emailPayload = {
                        from: 'Brooklyn Barbearia <noreply@brooklynbarbearia.pt>',
                        to: cliente.email,
                        subject: 'Reserva Cancelada - Brooklyn Barbearia',
                        html: emailContent.html,
                        attachments: [{
                            filename: `cancelamento-${reserva.id}.ics`,
                            content: btoa(emailContent.ics),
                            content_type: 'text/calendar'
                        }]
                    };
                    
                    console.log('\n📦 Payload (SEM html/ics):', JSON.stringify({
                        ...emailPayload,
                        html: `[HTML ${emailPayload.html?.length} chars]`,
                        attachments: emailPayload.attachments.map(a => ({
                            filename: a.filename,
                            content: `[BASE64 ${a.content?.length} chars]`,
                            content_type: a.content_type
                        }))
                    }, null, 2));
                    
                    console.log('\n🔑 Authorization header: Bearer [API_KEY com', env.RESEND_API_KEY?.length, 'caracteres]');
                    
                    const emailResponse = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(emailPayload)
                    });
                    
                    console.log('\n📨 === RESPOSTA RESEND ===');
                    console.log('   Status:', emailResponse.status);
                    console.log('   Status Text:', emailResponse.statusText);
                    console.log('   OK?', emailResponse.ok);
                    console.log('   Headers:', JSON.stringify(Object.fromEntries(emailResponse.headers), null, 2));
                    
                    const emailResponseData = await emailResponse.json();
                    console.log('   Body:', JSON.stringify(emailResponseData, null, 2));
                    
                    if (!emailResponse.ok) {
                        console.error('\n❌❌❌ ERRO AO ENVIAR EMAIL!');
                        console.error('   Status:', emailResponse.status);
                        console.error('   Resposta:', JSON.stringify(emailResponseData, null, 2));
                    } else {
                        console.log('\n✅✅✅ EMAIL DE CANCELAMENTO ENVIADO COM SUCESSO!');
                        console.log('   Email ID:', emailResponseData.id);
                    }
                } catch (emailError) {
                    console.error('\n❌❌❌ EXCEÇÃO AO ENVIAR EMAIL!');
                    console.error('   Mensagem:', emailError.message);
                    console.error('   Nome:', emailError.name);
                    console.error('   Stack:', emailError.stack);
                    console.error('   Objeto completo:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError), 2));
                }
            } else {
                console.log('\n⚠️ EMAIL NÃO ENVIADO - Cliente não tem email válido');
                console.log('   Email do cliente:', cliente?.email);
            }
            
            console.log('\n==========================================================');
            console.log('📧 FIM DEBUG EMAIL DE CANCELAMENTO');
            console.log('==========================================================\n');
            
            // Atualizar next_appointment
            console.log('🔄 Atualizando next_appointment...');
            await updateNextAppointmentAfterCancellation(env, reserva.cliente_id);
        }

        console.log('\n✅ PUT RESERVA CONCLUÍDO COM SUCESSO');
        console.log('==========================================================\n\n');

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva atualizada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('\n❌❌❌ ERRO GERAL AO ATUALIZAR RESERVA!');
        console.error('   Mensagem:', error.message);
        console.error('   Stack:', error.stack);
        console.error('   Objeto completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Deletar reserva
export async function onRequestDelete({ request, env }) {
    try {
        console.log('✅ DELETE Reserva - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();

        console.log('Deletando reserva ID:', id);

        // Buscar reserva existente
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({
                error: 'Reserva não encontrada'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // PERMISSÃO: Barbeiro só pode deletar suas próprias reservas
        if (user.role === 'barbeiro' && user.barbeiro_id !== reserva.barbeiro_id) {
            return new Response(JSON.stringify({
                error: 'Você só pode deletar suas próprias reservas'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualizar next_appointment antes de deletar
        await updateNextAppointmentAfterCancellation(env, reserva.cliente_id);

        await env.DB.prepare(
            'DELETE FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).run();

        console.log('✅ Reserva deletada');

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva deletada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao deletar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao deletar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
