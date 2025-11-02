export async function onRequest({ request, next, env }) {
    const url = new URL(request.url);
    if (url.pathname.includes('/api/admin/api_admin_login')) {
        return next();
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verificar token (implementar JWT ou session)
    // Por simplicidade, este exemplo aceita qualquer token
    // Em produção, use JWT ou sessions adequadas
    
    return next();
}
