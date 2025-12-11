import bcrypt from 'bcryptjs';

function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function enviarEmailVerificacao(email, nome, token, env) {
    const verificationUrl = `https://seu-dominio.com/api/api_auth_verify?token=${token}`;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Brooklyn Barbearia <noreply@seu-dominio.com>',
            to: email,
            subject: 'Confirme o seu email - Brooklyn Barbearia',
            html: `
        <h2>Bem-vindo à Brooklyn Barbearia, ${nome}!</h2>
        <p>Por favor, confirme o seu email clicando no link abaixo:</p>
        <a href="${verificationUrl}">Verificar Email</a>
        <p>Este link expira em 24 horas.</p>
      `
        })
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { nome, email, telefone, password } = await request.json();

        // Validações
        if (!nome || !email || !password) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400 });
        }

        if (password.length < 8) {
            return new Response(JSON.stringify({ error: 'Password deve ter pelo menos 8 caracteres' }), { status: 400 });
        }

        // Verificar se email já existe
        const existingUser = await env.DB.prepare(
            'SELECT id FROM clientes WHERE email = ?'
        ).bind(email).first();

        if (existingUser) {
            return new Response(JSON.stringify({ error: 'Email já registado' }), { status: 409 });
        }

        // Hash da password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Gerar token de verificação
        const tokenVerificacao = generateToken();

        // Criar cliente
        await env.DB.prepare(
            `INSERT INTO clientes (nome, email, telefone, password_hash, token_verificacao)
       VALUES (?, ?, ?, ?, ?)`
        ).bind(nome, email, telefone || null, passwordHash, tokenVerificacao).run();

        // Enviar email de verificação
        await enviarEmailVerificacao(email, nome, tokenVerificacao, env);

        return new Response(JSON.stringify({
            success: true,
            message: 'Conta criada! Verifique o seu email para ativar a conta.'
        }), { status: 201 });

    } catch (error) {
        console.error('Erro no registo:', error);
        return new Response(JSON.stringify({ error: 'Erro ao criar conta' }), { status: 500 });
    }
}
