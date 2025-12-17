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

    // CORRETO: Usar login.html com reset_token (não verificar-email)
    const resetUrl = `https://brooklynbarbearia.pt/login.html?reset_token=${resetToken}`;
    
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Brooklyn Barbearia <recover-password-noreply@brooklynbarbearia.pt>',
            to: email,
            subject: 'Recuperação de Password - Brooklyn Barbearia',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #2d4a3e;
        }
        .header h1 {
            color: #2d4a3e;
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px 0;
        }
        .content h2 {
            color: #2d4a3e;
            font-size: 20px;
        }
        .content p {
            margin: 15px 0;
            color: #555;
        }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background-color: #2d4a3e;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #1f3329;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            margin: 5px 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #888;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Brooklyn Barbearia</h1>
        </div>
        
        <div class="content">
            <h2>Olá ${cliente.nome},</h2>
            
            <p>Recebemos um pedido para redefinir a password da sua conta.</p>
            
            <p>Se foi você que fez este pedido, clique no botão abaixo para criar uma nova password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Password</a>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Importante:</strong></p>
                <p>• Este link expira em <strong>1 hora</strong></p>
                <p>• Se não solicitou esta recuperação, ignore este email</p>
                <p>• A sua password atual permanecerá válida até que defina uma nova</p>
            </div>
            
            <p style="color: #888; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #2d4a3e; font-size: 12px;">${resetUrl}</p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Brooklyn Barbearia - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
            `
        })
    });

    return new Response(JSON.stringify({
        success: true,
        message: 'Se o email existir, receberá instruções para redefinir a password'
    }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}