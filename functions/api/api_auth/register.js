import { hashPassword } from '../../utils/crypto.js';

function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function enviarEmailVerificacao(email, nome, token, env) {
    const verificationUrl = `https://brooklyn.tiagoanoliveira.pt/verificar-email?token=${token}`;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Brooklyn Barbearia <noreply@brooklyn.tiagoanoliveira.pt>',
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
        const { nome, email, telefone, password, oauthProvider, oauthData } = await request.json();

        // Validações básicas
        if (!nome || !email) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400 });
        }

        // Se não é OAuth, password é obrigatória
        if (!oauthProvider && !password) {
            return new Response(JSON.stringify({ error: 'Password é obrigatória' }), { status: 400 });
        }

        if (password && password.length < 8) {
            return new Response(JSON.stringify({ error: 'Password deve ter pelo menos 8 caracteres' }), { status: 400 });
        }

        // Verificar se email já existe
        const existingEmail = await env.DB.prepare(
            'SELECT id, password_hash FROM clientes WHERE email = ?'
        ).bind(email).first();

        if (existingEmail) {
            // Se password_hash está vazia, é um cliente que nunca criou conta
            if (existingEmail.password_hash === 'cliente_nunca_iniciou_sessão' || !existingEmail.password_hash) {
                return new Response(JSON.stringify({
                    error: 'Email já registado. Se já usou este email para efetuar reservas na Brooklyn, por favor clique no link abaixo para receber instruções para criar uma password.',
                    showResetLink: true
                }), {
                    status: 409
                });
            }
            
            return new Response(JSON.stringify({
                error: 'Email já registado. Por favor, faça login ou recupere a sua password.'
            }), {
                status: 409
            });
        }

        // Verificar se telefone já existe (se fornecido)
        if (telefone) {
            const existingPhone = await env.DB.prepare(
                'SELECT id FROM clientes WHERE telefone = ?'
            ).bind(telefone).first();

            if (existingPhone) {
                return new Response(JSON.stringify({
                    error: 'Este número de telefone já está registado.'
                }), {
                    status: 409
                });
            }
        }

        // Hash da password (se fornecida)
        let passwordHash = null;
        if (password) {
            passwordHash = await hashPassword(password);
        }

        // Gerar token de verificação
        const tokenVerificacao = generateToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

        // Preparar dados OAuth se aplicável
        let oauthIdField = null;
        let oauthId = null;
        let authMethods = 'email';
        
        if (oauthProvider && oauthData) {
            oauthIdField = `${oauthProvider}_id`;
            oauthId = oauthData.id;
            authMethods = `email,${oauthProvider}`;
        }

        // Criar cliente
        if (oauthProvider && oauthData) {
            await env.DB.prepare(
                `INSERT INTO clientes 
                (nome, email, telefone, password_hash, token_verificacao, token_verificacao_expira, 
                ${oauthIdField}, auth_methods, email_verificado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
            ).bind(nome, email, telefone || null, passwordHash, tokenVerificacao, tokenExpiry, 
                   oauthId, authMethods).run();
        } else {
            await env.DB.prepare(
                `INSERT INTO clientes 
                (nome, email, telefone, password_hash, token_verificacao, token_verificacao_expira, email_verificado)
                VALUES (?, ?, ?, ?, ?, ?, 0)`
            ).bind(nome, email, telefone || null, passwordHash, tokenVerificacao, tokenExpiry).run();
        }

        // Enviar email de verificação
        await enviarEmailVerificacao(email, nome, tokenVerificacao, env);

        return new Response(JSON.stringify({
            success: true,
            message: 'Conta criada! Verifique o seu email para ativar a conta.'
        }), { status: 201 });

    } catch (error) {
        console.error('Erro no registo:', error);
        
        // Verificar se é erro de constraint UNIQUE
        if (error.message && error.message.includes('UNIQUE')) {
            if (error.message.includes('email')) {
                return new Response(JSON.stringify({ error: 'Este email já está registado.' }), { status: 409 });
            }
            if (error.message.includes('telefone')) {
                return new Response(JSON.stringify({ error: 'Este número de telefone já está registado.' }), { status: 409 });
            }
        }
        
        return new Response(JSON.stringify({ error: 'Erro ao criar conta' }), { status: 500 });
    }
}