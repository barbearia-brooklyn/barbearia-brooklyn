export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // URL base para redirects
    const baseUrl = 'https://brooklynbarbearia.pt';

    if (!token) {
        return Response.redirect(`${baseUrl}/login.html?error=token_invalido`, 302);
    }

    try {
        const cliente = await env.DB.prepare(
            'SELECT id, email, token_verificacao_expira FROM clientes WHERE token_verificacao = ?'
        ).bind(token).first();

        if (!cliente) {
            return Response.redirect(`${baseUrl}/login.html?error=token_invalido`, 302);
        }

        // Verificar se token expirou
        if (cliente.token_verificacao_expira) {
            const expiry = new Date(cliente.token_verificacao_expira);
            if (expiry < new Date()) {
                return Response.redirect(`${baseUrl}/login.html?error=token_expirado`, 302);
            }
        }

        // Marcar email como verificado
        await env.DB.prepare(
            'UPDATE clientes SET email_verificado = 1, token_verificacao = NULL, token_verificacao_expira = NULL WHERE id = ?'
        ).bind(cliente.id).run();

        // Redirecionar para página de login com sucesso
        return Response.redirect(`${baseUrl}/login.html?verified=true`, 302);

    } catch (error) {
        console.error('Erro na verificação:', error);
        return Response.redirect(`${baseUrl}/login.html?error=erro_verificacao`, 302);
    }
}