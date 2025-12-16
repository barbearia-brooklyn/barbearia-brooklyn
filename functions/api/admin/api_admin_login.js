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

        // VALIDAR TURNSTILE
        if (!turnstileToken) {
            return new Response(JSON.stringify({ 
                error: 'Validação de segurança necessária' 
            }), { 
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Verificar token Turnstile com Cloudflare
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

        if (!turnstileResult.success) {
            console.error('Falha na validação Turnstile:', turnstileResult);
            return new Response(JSON.stringify({ 
                error: 'Falha na validação de segurança. Por favor, recarregue a página.' 
            }), { 
                status: 403,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Buscar credenciais das environment variables
        const adminUsername = env.ADMIN_USERNAME || 'admin';
        const adminPassword = env.ADMIN_PASSWORD;

        console.log('Tentativa de login:', username); // Para debug
        console.log('Admin username esperado:', adminUsername); // Para debug

        // Verificar credenciais
        if (username === adminUsername && password === adminPassword) {
            // Gerar um token simples (em produção, usa JWT)
            const token = btoa(`${username}:${password}:${Date.now()}`);

            return new Response(JSON.stringify({ 
                success: true, 
                token 
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        return new Response(JSON.stringify({ 
            error: 'Credenciais inválidas' 
        }), { 
            status: 401,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}