// Função para enviar email de verificação
export async function enviarEmailVerificacao(email, nome, token, env) {
    // URL CORRIGIDA: /api/api_auth_verify (estrutura de pastas Cloudflare)
    const verifyUrl = `https://brooklynbarbearia.pt/api/api_auth_verify?token=${token}`;
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Brooklyn Barbearia <noreply@brooklynbarbearia.pt>',
                to: email,
                subject: 'Verifique o seu email - Brooklyn Barbearia',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #f4f4f4;
                            }
                            .container {
                                background: white;
                                padding: 40px;
                                border-radius: 10px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            }
                            h2 {
                                color: #2d4a3e;
                                margin-top: 0;
                            }
                            .button {
                                display: inline-block;
                                padding: 14px 28px;
                                background-color: #c8a97e;
                                color: white !important;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                margin: 20px 0;
                            }
                            .button:hover {
                                background-color: #b89968;
                            }
                            .link {
                                color: #c8a97e;
                                word-break: break-all;
                            }
                            .footer {
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                font-size: 14px;
                                color: #666;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Olá ${nome},</h2>
                            <p>Bem-vindo à Brooklyn Barbearia!</p>
                            <p>Por favor, clique no botão abaixo para verificar o seu email e ativar a sua conta:</p>
                            <a href="${verifyUrl}" class="button">Verificar Email</a>
                            <p>Ou copie e cole este link no seu navegador:</p>
                            <p class="link">${verifyUrl}</p>
                            <div class="footer">
                                <p><strong>Este link expira em 24 horas.</strong></p>
                                <p>Se não criou esta conta, ignore este email.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Erro ao enviar email:', error);
            throw new Error('Falha ao enviar email de verificação');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        throw error;
    }
}

// Função para enviar email de reset de password
export async function enviarEmailResetPassword(email, nome, token, env) {
    // URL para reset de password
    const resetUrl = `https://brooklynbarbearia.pt/api/api_auth_reset/${token}`;
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Brooklyn Barbearia <noreply@brooklynbarbearia.pt>',
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
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #f4f4f4;
                            }
                            .container {
                                background: white;
                                padding: 40px;
                                border-radius: 10px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            }
                            h2 {
                                color: #2d4a3e;
                                margin-top: 0;
                            }
                            .button {
                                display: inline-block;
                                padding: 14px 28px;
                                background-color: #c8a97e;
                                color: white !important;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                margin: 20px 0;
                            }
                            .button:hover {
                                background-color: #b89968;
                            }
                            .link {
                                color: #c8a97e;
                                word-break: break-all;
                            }
                            .footer {
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                font-size: 14px;
                                color: #666;
                            }
                            .warning {
                                background: #fff3cd;
                                border-left: 4px solid #ffc107;
                                padding: 12px;
                                margin: 20px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>💈 Brooklyn Barbearia</h1>
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
                                    <p>• Se não solicitou esta recuperação, ignore, descarte este email e não forneça o link acima a ninguém.</p>
                                    <p>• A sua password atual permanecerá válida até que defina uma nova.</p>
                                </div>
                                
                                <p style="color: #888; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                                <p style="word-break: break-all; color: #2d4a3e; font-size: 12px;">${resetUrl}</p>
                            </div>
                            
                            <div class="footer">
                                <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
                                <p>&copy; ${new Date().getFullYear()} Brooklyn Barbearia - Todos os direitos reservados. Feito com 🤍 por <a href="https://www.tiagoanoliveira.pt">Tiago Oliveira</a>.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Erro ao enviar email:', error);
            throw new Error('Falha ao enviar email de recuperação');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar email de reset:', error);
        throw error;
    }
}