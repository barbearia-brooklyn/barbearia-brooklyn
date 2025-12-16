import { verifyPassword } from '../../utils/crypto.js';
import { generateJWT } from '../../utils/jwt.js';
import { verifyTurnstileToken } from '../../utils/turnstile.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { identifier, password, turnstileToken } = await request.json();

        if (!identifier || !password) {
            return new Response(JSON.stringify({ 
                error: 'Dados incompletos' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validar Turnstile
        if (!turnstileToken) {
            return new Response(JSON.stringify({ 
                error: 'Validação de segurança não realizada. Por favor, recarregue a página e tente novamente.' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0];
        const turnstileResult = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY, clientIP);

        if (!turnstileResult.success) {
            return new Response(JSON.stringify({ 
                error: turnstileResult.error || 'Falha na validação de segurança. Por favor, tente novamente.' 
            }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar por email OU telefone
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE email = ? OR telefone = ?'
        ).bind(identifier, identifier).first();

        if (!cliente) {
            return new Response(JSON.stringify({ 
                error: 'Credenciais inválidas' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se nunca iniciou sessão
        if (cliente.password_hash === 'cliente_nunca_iniciou_sessão') {
            return new Response(JSON.stringify({
                error: 'Esta conta ainda não foi ativada. Por favor, clique no link abaixo para criar uma password.',
                showResetLink: true
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar password
        const passwordMatch = await verifyPassword(password, cliente.password_hash);

        if (!passwordMatch) {
            return new Response(JSON.stringify({ 
                error: 'Credenciais inválidas' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se email está verificado
        if (!cliente.email_verificado) {
            return new Response(JSON.stringify({
                error: 'Email não verificado. Por favor, verifique o seu email antes de fazer login.',
                needsVerification: true
            }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Gerar JWT usando função compartilhada
        const token = await generateJWT({
            id: cliente.id,
            email: cliente.email,
            nome: cliente.nome,
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        }, env.JWT_SECRET);

        return new Response(JSON.stringify({
            success: true,
            user: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone,
                nif: cliente.nif
            }
        }), {
            status: 200,
            headers: {
                'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao fazer login. Por favor, tente novamente.',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
