/**
 * Admin Login API - Autenticação com roles e JWT
 */

import jwt from '@tsndr/cloudflare-worker-jwt';
import bcrypt from 'bcryptjs';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { username, password, turnstileToken } = await request.json();

        // Detectar ambiente
        const url = new URL(request.url);
        const isPreview = url.hostname.includes('.pages.dev') || url.hostname === 'localhost';
        const isDevelopment = env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'preview';

        console.log('Ambiente:', { hostname: url.hostname, isPreview, isDevelopment });

        // VALIDAR TURNSTILE (mantido do código original)
        if (!turnstileToken) {
            return new Response(JSON.stringify({ 
                error: 'Por favor, complete a verificação de segurança.',
                errorType: 'turnstile_missing'
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let turnstileValid = false;
        
        if (!env.TURNSTILE_SECRET_KEY && isPreview) {
            console.warn('⚠️ Turnstile bypass em preview');
            turnstileValid = true;
        } else if (env.TURNSTILE_SECRET_KEY) {
            try {
                const turnstileResponse = await fetch(
                    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            secret: env.TURNSTILE_SECRET_KEY,
                            response: turnstileToken,
                            remoteip: request.headers.get('CF-Connecting-IP')
                        })
                    }
                );

                const turnstileResult = await turnstileResponse.json();
                console.log('Turnstile:', turnstileResult);

                if (!turnstileResult.success) {
                    if (isPreview || isDevelopment) {
                        console.warn('⚠️ Turnstile falhou em preview - permitindo');
                        turnstileValid = true;
                    } else {
                        return new Response(JSON.stringify({ 
                            error: 'Falha na verificação de segurança.',
                            errorType: 'turnstile_failed'
                        }), { 
                            status: 403,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else {
                    turnstileValid = true;
                }
            } catch (error) {
                console.error('Erro Turnstile:', error);
                if (isPreview || isDevelopment) {
                    turnstileValid = true;
                } else {
                    return new Response(JSON.stringify({ 
                        error: 'Erro ao validar segurança.',
                        errorType: 'turnstile_error'
                    }), { 
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        if (!turnstileValid) {
            return new Response(JSON.stringify({ 
                error: 'Falha na verificação de segurança.',
                errorType: 'turnstile_invalid'
            }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // BUSCAR USER NA BASE DE DADOS
        console.log('Buscando user:', username);
        
        const user = await env.DB.prepare(
            `SELECT id, username, password_hash, nome, role, barbeiro_id, ativo 
             FROM admin_users 
             WHERE username = ? AND ativo = 1`
        ).bind(username).first();

        if (!user) {
            console.log('❌ User não encontrado ou inativo');
            return new Response(JSON.stringify({ 
                error: 'Credenciais inválidas',
                errorType: 'invalid_credentials'
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // VERIFICAR PASSWORD
        // Nota: Se a password na BD for plain text (migração), comparar diretamente
        // Depois de criar os hashes, usar bcrypt.compare
        let passwordValid = false;
        
        try {
            // Tentar com bcrypt primeiro
            passwordValid = await bcrypt.compare(password, user.password_hash);
        } catch (error) {
            // Se falhar (password não é hash), comparar plain text (TEMPORÁRIO)
            console.warn('⚠️ Comparação plain text - migrar para bcrypt!');
            passwordValid = password === user.password_hash;
        }

        if (!passwordValid) {
            console.log('❌ Password inválida');
            return new Response(JSON.stringify({ 
                error: 'Credenciais inválidas',
                errorType: 'invalid_credentials'
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // GERAR TOKEN JWT
        const secret = env.JWT_SECRET || 'brooklyn-secret-2025';
        const token = await jwt.sign({
            userId: user.id,
            username: user.username,
            role: user.role,
            barbeiroId: user.barbeiro_id,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        }, secret);

        // ATUALIZAR ULTIMO LOGIN
        await env.DB.prepare(
            'UPDATE admin_users SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(user.id).run();

        console.log('✅ Login bem-sucedido:', user.username, 'Role:', user.role);

        // RETORNAR RESPOSTA
        return new Response(JSON.stringify({ 
            success: true, 
            token,
            user: {
                id: user.id,
                username: user.username,
                nome: user.nome,
                role: user.role,
                barbeiro_id: user.barbeiro_id
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Erro no login:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao processar login.',
            errorType: 'server_error',
            details: error.message 
        }), { 
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}