async function validateTurnstile(token, ip, secretKey) {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    return result.success;
}

export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const email = url.searchParams.get('email');
        const turnstileToken = url.searchParams.get('turnstileToken');

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email não fornecido' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Validar token do Turnstile
        if (!turnstileToken) {
            return new Response(JSON.stringify({ error: 'Token de verificação ausente' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Obter IP do cliente
        const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

        // Validar token
        const isValidToken = await validateTurnstile(turnstileToken, clientIP, env.TURNSTILE_SECRET_KEY);

        if (!isValidToken) {
            return new Response(JSON.stringify({ error: 'Verificação de segurança falhou. Por favor, tente novamente.' }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Consultar reservas
        const { results } = await env.DB.prepare(
            `SELECT r.*, b.nome as barbeiro_nome, s.nome as servico_nome
             FROM reservas r
             JOIN barbeiros b ON r.barbeiro_id = b.id
             JOIN servicos s ON r.servico_id = s.id
             WHERE r.email = ?
             ORDER BY r.data_hora DESC`
        ).bind(email).all();

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}