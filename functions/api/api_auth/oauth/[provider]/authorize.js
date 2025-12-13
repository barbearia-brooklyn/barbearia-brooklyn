import { getOAuthConfig, generateState } from '../../../../utils/oauth-config.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;
    
    try {
        const provider = params.provider;
        
        if (!['google', 'facebook', 'instagram'].includes(provider)) {
            return new Response(JSON.stringify({ 
                error: 'Provedor OAuth inválido' 
            }), { status: 400 });
        }

        const config = getOAuthConfig(provider, env);
        const state = generateState();
        
        // Armazenar state temporariamente
        const stateKey = `oauth_state_${state}`;
        
        // Verificar se é linking (utilizador já autenticado)
        const cookies = request.headers.get('Cookie') || '';
        const authToken = cookies.split(';')
            .find(c => c.trim().startsWith('auth_token='))
            ?.split('=')[1];
        
        if (authToken) {
            // É linking - armazenar info do utilizador
            await env.KV_OAUTH.put(stateKey, JSON.stringify({
                provider,
                action: 'link',
                timestamp: Date.now()
            }), { expirationTtl: 600 }); // 10 minutos
        } else {
            // É login normal
            await env.KV_OAUTH.put(stateKey, JSON.stringify({
                provider,
                action: 'login',
                timestamp: Date.now()
            }), { expirationTtl: 600 });
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
            authUrl: authUrl.toString() 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao iniciar OAuth:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao iniciar autenticação',
            details: error.message
        }), { status: 500 });
    }
}