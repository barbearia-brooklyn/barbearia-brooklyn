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

    console.log('\n=== LOGIN API CHAMADA ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);

    try {
        const body = await request.json();
        const { username, password, turnstileToken } = body;

        console.log('\ud83d\udc64 Username recebido:', username);
        console.log('\ud83d\udd11 Password recebida:', password ? '***' + password.slice(-3) : 'NÃO FORNECIDA');
        console.log('\ud83d\udd12 Turnstile token:', turnstileToken ? turnstileToken.substring(0, 20) + '...' : 'NÃO FORNECIDO');

        // Validar input
        if (!username || !password) {
            console.log('\u274c Validação falhou: campos vazios');
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
                console.log('\u274c Turnstile validation falhou');
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
        console.log('\ud83d\udcca A procurar user na BD...');
        const user = await env.DB.prepare(`
            SELECT id, username, password_hash, nome, role, barbeiro_id, ativo
            FROM admin_users
            WHERE username = ? AND ativo = 1
        `).bind(username).first();

        if (!user) {
            console.log('\u274c User não encontrado ou inativo:', username);
            return new Response(JSON.stringify({
                success: false,
                error: 'Credenciais inválidas'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('\u2705 User encontrado:', user.username);
        console.log('\ud83d\udd11 Password hash da BD:', user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'NULL');

        // Verificar password
        console.log('\ud83d\udd0d A verificar password...');
        const passwordValid = await verifyPassword(password, user.password_hash);
        console.log('\ud83d\udd11 Password válida?', passwordValid);

        if (!passwordValid) {
            console.log('\u274c Password inválida para user:', username);
            console.log('  - Password fornecida:', password);
            console.log('  - Hash na BD:', user.password_hash);
            return new Response(JSON.stringify({
                success: false,
                error: 'Credenciais inválidas'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('\u2705 Password válida!');

        // Atualizar ultimo_login
        await env.DB.prepare(`
            UPDATE admin_users
            SET ultimo_login = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(user.id).run();

        // Gerar JWT token
        const jwtSecret = env.JWT_SECRET || 'brooklyn-secret-2025-CHANGE-THIS';
        console.log('\ud83d\udd10 JWT_SECRET configurado:', jwtSecret ? 'SIM' : 'NÃO (usando default)');
        
        const token = await generateJWT({
            id: user.id,
            username: user.username,
            role: user.role,
            barbeiro_id: user.barbeiro_id
        }, jwtSecret, 86400); // 24 horas

        console.log('\u2705 Login bem-sucedido:', username, 'Role:', user.role);
        console.log('=== FIM LOGIN API ===\n');

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
        console.error('\u274c Erro no login:', error);
        console.error('Stack:', error.stack);
        return new Response(JSON.stringify({
            success: false,
            error: 'Erro interno do servidor',
            debug: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
