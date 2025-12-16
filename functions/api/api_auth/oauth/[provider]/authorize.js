import { getOAuthConfig, generateState } from '../../../../utils/oauth-config.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;
    
    try {
        const url = new URL(request.url);
        const provider = params.provider;
        const mode = url.searchParams.get('mode'); // 'register' ou null
        
        if (!['google', 'facebook', 'instagram'].includes(provider)) {
            return new Response(JSON.stringify({ 
                error: 'Provedor OAuth inválido',
                message: `O provedor "${provider}" não é suportado. Por favor, contacte o suporte.`
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se KV_OAUTH está disponível
        if (!env.KV_OAUTH) {
            console.error('KV_OAUTH não está configurado');
            return new Response(JSON.stringify({ 
                error: 'Configuração do servidor inválida',
                message: 'Sistema de autenticação não configurado corretamente. Por favor, contacte o suporte.'
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Tentar obter configuração OAuth
        let config;
        try {
            config = getOAuthConfig(provider, env);
        } catch (error) {
            console.error(`Erro ao obter config OAuth para ${provider}:`, error.message);
            
            if (error.message.includes('incompleta')) {
                return new Response(JSON.stringify({ 
                    error: `Configuração ${provider} incompleta`,
                    message: `A autenticação via ${provider} não está disponível neste momento. Por favor, tente usar email e password ou contacte o suporte.`
                }), { 
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            return new Response(JSON.stringify({ 
                error: 'Erro ao configurar autenticação',
                message: error.message
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const state = generateState();
        
        // Armazenar state temporariamente
        const stateKey = `oauth_state_${state}`;
        
        // Verificar se é linking (utilizador já autenticado)
        const cookies = request.headers.get('Cookie') || '';
        const authToken = cookies.split(';')
            .find(c => c.trim().startsWith('auth_token='))
            ?.split('=')[1];
        
        let action = 'login'; // padrão
        
        if (authToken) {
            // É linking - utilizador já autenticado quer associar conta
            action = 'link';
        } else if (mode === 'register') {
            // É registo - utilizador quer criar conta com OAuth
            action = 'register';
        }
        
        try {
            await env.KV_OAUTH.put(stateKey, JSON.stringify({
                provider,
                action,
                timestamp: Date.now()
            }), { expirationTtl: 600 }); // 10 minutos
        } catch (error) {
            console.error('Erro ao guardar state no KV:', error);
            return new Response(JSON.stringify({ 
                error: 'Erro ao iniciar autenticação',
                message: 'Não foi possível iniciar o processo de autenticação. Por favor, tente novamente.'
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Construir URL de autorização
        const authUrl = new URL(config.authUrl);
        authUrl.searchParams.set('client_id', config.clientId);
        authUrl.searchParams.set('redirect_uri', config.redirectUri);
        authUrl.searchParams.set('response_type', config.responseType);
        authUrl.searchParams.set('scope', config.scope);
        authUrl.searchParams.set('state', state);
        
        if (provider === 'facebook') {
            authUrl.searchParams.set('display', 'popup');
        }

        return new Response(JSON.stringify({ 
            success: true,
            authUrl: authUrl.toString(),
            provider: provider
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao iniciar OAuth:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao iniciar autenticação',
            message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou use autenticação por email.',
            details: error.message
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
