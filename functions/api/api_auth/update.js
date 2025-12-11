import { hashPassword, verifyPassword } from '../../utils/crypto.js';

async function verifyJWT(token, secret) {
    try {
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
        const data = `${encodedHeader}.${encodedPayload}`;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

        if (!valid) return null;

        const payload = JSON.parse(atob(encodedPayload));
        if (payload.exp && payload.exp < Date.now() / 1000) return null;

        return payload;
    } catch {
        return null;
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;

    try {
        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), { status: 401 });
        }

        const { nome, telefone, currentPassword, newPassword } = await request.json();

        // Validações básicas
        if (!nome) {
            return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), { status: 400 });
        }

        // Se está a alterar password, verificar a atual
        if (currentPassword && newPassword) {
            const cliente = await env.DB.prepare(
                'SELECT password_hash FROM clientes WHERE id = ?'
            ).bind(userPayload.id).first();

            const passwordMatch = await verifyPassword(currentPassword, cliente.password_hash);

            if (!passwordMatch) {
                return new Response(JSON.stringify({ error: 'Password atual incorreta' }), { status: 401 });
            }

            // Atualizar com nova password
            const newPasswordHash = await hashPassword(newPassword);

            await env.DB.prepare(
                'UPDATE clientes SET nome = ?, telefone = ?, password_hash = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(nome, telefone || null, newPasswordHash, userPayload.id).run();
        } else {
            // Atualizar sem alterar password
            await env.DB.prepare(
                'UPDATE clientes SET nome = ?, telefone = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(nome, telefone || null, userPayload.id).run();
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil' }), { status: 500 });
    }
}
