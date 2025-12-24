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

        // Detectar se estamos em ambiente de preview/desenvolvimento
        const url = new URL(request.url);
        const isPreview = url.hostname.includes('.pages.dev') || url.hostname === 'localhost';
        const isDevelopment = env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'preview';

        console.log('Ambiente detectado:', {
            hostname: url.hostname,
            isPreview,
            isDevelopment,
            environment: env.ENVIRONMENT
        });

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

        // Em ambientes de preview, permitir bypass do Turnstile se a secret key não estiver configurada
        let turnstileValid = false;
        
        if (!env.TURNSTILE_SECRET_KEY && isPreview) {
            console.warn('⚠️ AVISO: Turnstile bypass ativado em ambiente de preview (TURNSTILE_SECRET_KEY não configurada)');
            turnstileValid = true; // Bypass em preview sem secret key
        } else if (env.TURNSTILE_SECRET_KEY) {
            // Verificar token Turnstile com Cloudflare
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
                console.log('Resultado Turnstile:', turnstileResult);

                if (!turnstileResult.success) {
                    console.error('Falha na validação Turnstile:', turnstileResult);
                    
                    // Mensagens específicas baseadas nos códigos de erro do Turnstile
                    let errorMessage = 'Falha na verificação de segurança.';
                    
                    if (turnstileResult['error-codes'] && turnstileResult['error-codes'].length > 0) {
                        const errorCode = turnstileResult['error-codes'][0];
                        
                        switch (errorCode) {
                            case 'timeout-or-duplicate':
                                errorMessage = 'A verificação de segurança expirou ou já foi utilizada. Por favor, recarregue a página e tente novamente.';
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
                            case 'missing-input-secret':
                            case 'invalid-input-secret':
                                if (isPreview || isDevelopment) {
                                    console.warn('⚠️ Secret key inválida/ausente em ambiente de preview - permitindo acesso');
                                    turnstileValid = true;
                                } else {
                                    errorMessage = 'Configuração de segurança inválida. Contacte o administrador.';
                                }
                                break;
                            default:
                                errorMessage = 'Falha na verificação de segurança. Por favor, recarregue a página e tente novamente.';
                        }
                    }
                    
                    if (!turnstileValid) {
                        return new Response(JSON.stringify({ 
                            error: errorMessage,
                            errorType: 'turnstile_failed',
                            errorDetails: turnstileResult['error-codes'],
                            debug: isPreview ? { 
                                hostname: url.hostname,
                                hasSecretKey: !!env.TURNSTILE_SECRET_KEY 
                            } : undefined
                        }), { 
                            status: 403,
                            headers: { 
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        });
                    }
                } else {
                    turnstileValid = true;
                }
            } catch (turnstileError) {
                console.error('Erro ao validar Turnstile:', turnstileError);
                
                // Em preview, permitir bypass em caso de erro
                if (isPreview || isDevelopment) {
                    console.warn('⚠️ Erro na validação Turnstile em preview - permitindo acesso');
                    turnstileValid = true;
                } else {
                    return new Response(JSON.stringify({ 
                        error: 'Erro ao validar verificação de segurança. Tente novamente.',
                        errorType: 'turnstile_error'
                    }), { 
                        status: 500,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
            }
        } else {
            // Sem secret key em produção - erro
            return new Response(JSON.stringify({ 
                error: 'Configuração de segurança ausente. Contacte o administrador.',
                errorType: 'config_error'
            }), { 
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (!turnstileValid) {
            return new Response(JSON.stringify({ 
                error: 'Falha na verificação de segurança.',
                errorType: 'turnstile_invalid'
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

        console.log('Tentativa de login:', username);
        console.log('Admin username esperado:', adminUsername);

        // Verificar credenciais
        if (username === adminUsername && password === adminPassword) {
            // Gerar um token simples (em produção, usa JWT)
            const token = btoa(`${username}:${password}:${Date.now()}`);

            return new Response(JSON.stringify({ 
                success: true, 
                token,
                debug: isPreview ? {
                    message: 'Login em ambiente de preview',
                    turnstileBypassed: !env.TURNSTILE_SECRET_KEY
                } : undefined
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