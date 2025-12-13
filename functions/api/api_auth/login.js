import { verifyPassword } from '../../utils/crypto.js';

async function generateJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return `${data}.${encodedSignature}`;
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { identifier, password } = await request.json();

        if (!identifier || !password) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400 });
        }

        // Buscar por email OU telefone
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE email = ? OR telefone = ?'
        ).bind(identifier, identifier).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401 });
        }

        // Verificar se nunca iniciou sessão
        if (cliente.password_hash === 'cliente_nunca_iniciou_sessão') {
            return new Response(JSON.stringify({
                needsCompletion: true,
                profile: {
                    nome: cliente.nome,
                    email: cliente.email,
                    telefone: cliente.telefone
                }
            }), { status: 200 });
        }

        // Verificar password
        const passwordMatch = await verifyPassword(password, cliente.password_hash);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401 });
        }

        // Resto do código de login normal...

    } catch (error) {
        console.error('Erro no login:', error);
        return new Response(JSON.stringify({ error: 'Erro ao fazer login' }), { status: 500 });
    }
}

/*
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email e password são obrigatórios' }), { status: 400 });
        }

        // Buscar cliente
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE email = ?'
        ).bind(email).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401 });
        }

        // Verificar password
        const passwordMatch = await verifyPassword(password, cliente.password_hash);

        if (!passwordMatch) {
            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401 });
        }

        // Verificar se email está verificado
        if (!cliente.email_verificado) {
            return new Response(JSON.stringify({
                error: 'Email não verificado',
                needsVerification: true
            }), { status: 403 });
        }

        // Gerar JWT
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
                telefone: cliente.telefone
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
        return new Response(JSON.stringify({ error: 'Erro ao fazer login' }), { status: 500 });
    }
}
*/