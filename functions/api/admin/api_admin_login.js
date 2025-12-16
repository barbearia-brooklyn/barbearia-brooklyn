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
                error: 'Por favor, complete a verificação de segurança antes de continuar.',
                errorType: 'turnstile_missing'
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
            
            // Mensagens específicas baseadas nos códigos de erro do Turnstile
            let errorMessage = 'Falha na verificação de segurança.';
            
            if (turnstileResult['error-codes'] && turnstileResult['error-codes'].length > 0) {
                const errorCode = turnstileResult['error-codes'][0];
                
                switch (errorCode) {
                    case 'timeout-or-duplicate':
                        errorMessage = 'A verificação de segurança expirou. Por favor, recarregue a página e tente novamente.';
                        break;
                    case 'invalid-input-response':
                        errorMessage = 'Verificação de segurança inválida. Por favor, recarregue a página.';
                        break;
                    case 'bad-request':
                        errorMessage = 'Erro na verificação de segurança. Por favor, tente novamente.';
                        break;
                    case 'internal-error':
                        errorMessage = 'Erro interno do sistema de segurança. Por favor, tente novamente em alguns instantes.';
                        break;
                    default:
                        errorMessage = 'Falha na verificação de segurança. Por favor, recarregue a página e tente novamente.';
                }
            }
            
            return new Response(JSON.stringify({ 
                error: errorMessage,
                errorType: 'turnstile_failed',
                errorDetails: turnstileResult['error-codes']
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
            error: 'Credenciais inválidas',
            errorType: 'invalid_credentials'
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
            error: 'Erro ao processar login. Por favor, tente novamente.',
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