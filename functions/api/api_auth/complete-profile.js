export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { nome, email, telefone, password } = await request.json();

        // Buscar cliente com password placeholder
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE (email = ? OR telefone = ?) AND password_hash = ?'
        ).bind(email, telefone, 'cliente_nunca_iniciou_sessão').first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404 });
        }

        // Atualizar dados e password
        const passwordHash = await hashPassword(password);
        const tokenVerificacao = generateToken();

        await env.DB.prepare(
            `UPDATE clientes 
             SET nome = ?, email = ?, telefone = ?, password_hash = ?, token_verificacao = ?
             WHERE id = ?`
        ).bind(nome, email, telefone, passwordHash, tokenVerificacao, cliente.id).run();

        // Enviar email de verificação
        await enviarEmailVerificacao(email, nome, tokenVerificacao, env);

        return new Response(JSON.stringify({
            success: true,
            message: 'Perfil completado! Verifique o seu email.'
        }), { status: 200 });

    } catch (error) {
        console.error('Erro ao completar perfil:', error);
        return new Response(JSON.stringify({ error: 'Erro ao completar perfil' }), { status: 500 });
    }
}
