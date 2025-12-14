function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const { email } = await request.json();

    const cliente = await env.DB.prepare(
        'SELECT id, nome FROM clientes WHERE email = ?'
    ).bind(email).first();

    if (!cliente) {
        return new Response(JSON.stringify({
            success: true,
            message: 'Se o email existir, receberá instruções para redefinir a password'
        }), { status: 200 });
    }

    const resetToken = generateToken();
    const expira = new Date(Date.now() + 3600000).toISOString();

    await env.DB.prepare(
        'UPDATE clientes SET token_reset_password = ?, token_reset_expira = ? WHERE id = ?'
    ).bind(resetToken, expira, cliente.id).run();

    // Redirecionar para login.html com token para abrir modal
    const resetUrl = `https://brooklyn.tiagoanoliveira.pt/login.html?reset_token=${resetToken}`;
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Brooklyn Barbearia <recover-password-noreply@brooklyn.tiagoanoliveira.pt>',
            to: email,
            subject: 'Recuperação de Password - Brooklyn Barbearia',
            html: `
        <h2>Olá ${cliente.nome},</h2>
        <p>Recebemos um pedido para redefinir a sua password.</p>
        <a href="${resetUrl}">Redefinir Password</a>
        <p>Este link expira em 1 hora.</p>
      `
        })
    });

    return new Response(JSON.stringify({
        success: true,
        message: 'Se o email existir, receberá instruções para redefinir a password'
    }), { status: 200 });
}
