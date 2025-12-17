import { getOAuthConfig, generateState } from '../../../../utils/oauth-config.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        const provider = params.provider;
        
        // Verificar se está autenticado
        const cookies = request.headers.get('Cookie') || '';
        const authToken = cookies.split(';')
            .find(c => c.trim().startsWith('auth_token='))
            ?.split('=')[1];

        if (!authToken) {
            return new Response(JSON.stringify({
                error: 'Não autenticado'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Obter configuração OAuth
        const config = getOAuthConfig(provider, env);
        const state = generateState();
        
        // Armazenar state com action=link
        const stateKey = `oauth_state_${state}`;
        await env.KV_OAUTH.put(stateKey, JSON.stringify({
            provider,
            action: 'link',
            timestamp: Date.now()
        }), { expirationTtl: 600 }); // 10 minutos

        // Construir URL de autorização do provider
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
        console.error('Erro ao iniciar linking:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao iniciar linking',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}