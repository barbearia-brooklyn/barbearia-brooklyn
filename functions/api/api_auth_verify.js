export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return new Response('Token inválido', { status: 400 });
    }

    try {
        const cliente = await env.DB.prepare(
            'SELECT id, email FROM clientes WHERE token_verificacao = ?'
        ).bind(token).first();

        if (!cliente) {
            return new Response('Token inválido ou expirado', { status: 404 });
        }

        // Marcar email como verificado
        await env.DB.prepare(
            'UPDATE clientes SET email_verificado = 1, token_verificacao = NULL WHERE id = ?'
        ).bind(cliente.id).run();

        // Redirecionar para página de sucesso
        return Response.redirect('/?verified=true', 302);

    } catch (error) {
        console.error('Erro na verificação:', error);
        return new Response('Erro ao verificar email', { status: 500 });
    }
}
