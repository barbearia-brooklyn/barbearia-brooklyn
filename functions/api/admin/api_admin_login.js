/**
 * Brooklyn Barbearia - Admin Login API
 * Sistema de login com JWT e password hashing nativo
 */

import { generateJWT, verifyPassword } from './auth.js';

/**
 * Verifica Turnstile token
 */
async function verifyTurnstileToken(token, secret) {
    if (!secret || secret === 'dummy-secret') {
        console.log('⚠️  Turnstile secret não configurado - modo desenvolvimento');
        return true;
    }

    if (token === 'dummy-token-for-development') {
        console.log('⚠️  Token Turnstile dummy - modo desenvolvimento');
        return true;
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                secret: secret,
                response: token
            })
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('❌ Erro ao verificar Turnstile:', error);
        return false;
    }
}

/**
 * Handler do login
 */
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { username, password, turnstileToken } = body;

        // Validar input
        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Username e password são obrigatórios'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar Turnstile (se configurado)
        const turnstileSecret = env.TURNSTILE_SECRET_KEY;
        if (turnstileSecret && turnstileToken) {
            const turnstileValid = await verifyTurnstileToken(turnstileToken, turnstileSecret);
            if (!turnstileValid) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Verificação de segurança falhou'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Buscar utilizador na base de dados
        const user = await env.DB.prepare(`
            SELECT id, username, password_hash, nome, role, barbeiro_id, ativo
            FROM admin_users
            WHERE username = ? AND ativo = 1
        `).bind(username).first();

        if (!user) {
            console.log('❌ User não encontrado ou inativo:', username);
            return new Response(JSON.stringify({
                success: false,
                error: 'Credenciais inválidas'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar password
        const passwordValid = await verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            console.log('❌ Password inválida para user:', username);
            return new Response(JSON.stringify({
                success: false,
                error: 'Credenciais inválidas'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualizar ultimo_login
        await env.DB.prepare(`
            UPDATE admin_users
            SET ultimo_login = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(user.id).run();

        // Gerar JWT token
        const jwtSecret = env.JWT_SECRET || 'brooklyn-secret-2025-CHANGE-THIS';
        const token = await generateJWT({
            id: user.id,
            username: user.username,
            role: user.role,
            barbeiro_id: user.barbeiro_id
        }, jwtSecret, 86400); // 24 horas

        console.log('✅ Login bem-sucedido:', username, 'Role:', user.role);

        return new Response(JSON.stringify({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                nome: user.nome,
                role: user.role,
                barbeiro_id: user.barbeiro_id
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro no login:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Erro interno do servidor'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
