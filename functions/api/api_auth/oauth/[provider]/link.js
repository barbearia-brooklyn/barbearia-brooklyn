import { getOAuthConfig, generateState } from '../../../../utils/oauth-config.js';
import { verifyJWT } from '../../../../utils/jwt.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        const provider = params.provider;
        
        console.log('Link OAuth iniciado para:', provider);
        
        // Verificar se está autenticado
        const cookies = request.headers.get('Cookie') || '';
        const authToken = cookies.split(';')
            .find(c => c.trim().startsWith('auth_token='))
            ?.split('=')[1];

        console.log('Auth token encontrado:', !!authToken);

        if (!authToken) {
            return new Response(JSON.stringify({
                error: 'Não autenticado'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar JWT e extrair userId
        let userId;
        try {
            const payload = await verifyJWT(authToken, env.JWT_SECRET);
            userId = payload.id;
            console.log('User ID extraído do JWT:', userId);
        } catch (error) {
            console.error('Erro ao verificar JWT:', error);
            return new Response(JSON.stringify({
                error: 'Token inválido'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Obter configuração OAuth
        const config = getOAuthConfig(provider, env);
        const state = generateState();
        
        console.log('State gerado:', state);
        
        // Armazenar state com action=link E userId
        const stateKey = `oauth_state_${state}`;
        await env.KV_OAUTH.put(stateKey, JSON.stringify({
            provider,
            action: 'link',
            userId: userId, // GUARDAR userId no state!
            timestamp: Date.now()
        }), { expirationTtl: 600 }); // 10 minutos

        console.log('State guardado no KV');

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

        console.log('AuthUrl criado:', authUrl.toString());

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
        console.error('Stack:', error.stack);
        return new Response(JSON.stringify({
            error: 'Erro ao iniciar linking',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}