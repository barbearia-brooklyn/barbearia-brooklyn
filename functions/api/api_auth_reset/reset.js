import { hashPassword } from '../../utils/crypto.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const { token, newPassword } = await request.json();

    if (newPassword.length < 8) {
        return new Response(JSON.stringify({ error: 'Password deve ter pelo menos 8 caracteres' }), { status: 400 });
    }

    const cliente = await env.DB.prepare(
        'SELECT id FROM clientes WHERE token_reset_password = ? AND token_reset_expira > datetime("now")'
    ).bind(token).first();

    if (!cliente) {
        return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), { status: 404 });
    }

    const passwordHash = await hashPassword(newPassword);

    // Atualizar password e marcar email como verificado
    await env.DB.prepare(
        'UPDATE clientes SET password_hash = ?, token_reset_password = NULL, token_reset_expira = NULL, email_verificado = 1 WHERE id = ?'
    ).bind(passwordHash, cliente.id).run();

    return new Response(JSON.stringify({
        success: true,
        message: 'Password redefinida com sucesso'
    }), { status: 200 });
}
