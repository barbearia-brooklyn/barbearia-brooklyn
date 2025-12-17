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

        // Redirecionar para authorize com action=link
        const authorizeUrl = `/api/api_auth/oauth/${provider}/authorize?mode=link`;
        
        return new Response(JSON.stringify({
            authUrl: new URL(authorizeUrl, new URL(request.url).origin).href
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao iniciar linking:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao iniciar linking'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}