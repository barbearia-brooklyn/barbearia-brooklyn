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

export async function onRequestGet(context) {
    const { request, env } = context;

    // Obter token do cookie
    const cookies = request.headers.get('Cookie') || '';
    const tokenMatch = cookies.match(/auth_token=([^;]+)/);

    if (!tokenMatch) {
        return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }

    const token = tokenMatch[1];
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (!payload) {
        return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
    }

    // Buscar dados atualizados do cliente
    const cliente = await env.DB.prepare(
        'SELECT id, nome, email, telefone FROM clientes WHERE id = ?'
    ).bind(payload.id).first();

    if (!cliente) {
        return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404 });
    }

    return new Response(JSON.stringify({ user: cliente }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}