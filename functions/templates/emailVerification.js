// Função para enviar email de verificação
export async function enviarEmailVerificacao(email, nome, token, env) {
    const verifyUrl = `${env.BASE_URL}/verificar-email.html?token=${token}`;
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Brooklyn Barbearia <noreply@brooklyn.tiagoanoliveira.pt>',
                to: email,
                subject: 'Verifique o seu email - Brooklyn Barbearia',
                html: `
                    <h2>Olá ${nome},</h2>
                    <p>Bem-vindo à Brooklyn Barbearia!</p>
                    <p>Por favor, clique no link abaixo para verificar o seu email:</p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #c8a97e; color: white; text-decoration: none; border-radius: 4px;">Verificar Email</a>
                    <p>Ou copie e cole este link no seu navegador:</p>
                    <p>${verifyUrl}</p>
                    <p>Este link expira em 24 horas.</p>
                    <br>
                    <p>Se não criou esta conta, ignore este email.</p>
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
    const resetUrl = `${env.BASE_URL}/reset-password.html?token=${token}`;
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
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
                    <h2>Olá ${nome},</h2>
                    <p>Recebemos um pedido para redefinir a sua password.</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #c8a97e; color: white; text-decoration: none; border-radius: 4px;">Redefinir Password</a>
                    <p>Ou copie e cole este link no seu navegador:</p>
                    <p>${resetUrl}</p>
                    <p>Este link expira em 1 hora.</p>
                    <br>
                    <p>Se não solicitou esta recuperação, ignore este email.</p>
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