/**
 * Valida o token Turnstile com a API do Cloudflare
 * @param {string} token - Token gerado pelo widget Turnstile
 * @param {string} secret - Secret key do Turnstile (da variável de ambiente)
 * @param {string|null} remoteip - IP do cliente (opcional mas recomendado)
 * @returns {Promise<{success: boolean, error?: string, errorCodes?: string[]}>}
 */
export async function verifyTurnstileToken(token, secret, remoteip = null) {
    try {
        if (!token) {
            return {
                success: false,
                error: 'Token Turnstile não fornecido'
            };
        }

        if (!secret) {
            console.error('TURNSTILE_SECRET_KEY não configurado');
            return {
                success: false,
                error: 'Configuração do servidor inválida'
            };
        }

        const formData = new FormData();
        formData.append('secret', secret);
        formData.append('response', token);
        
        if (remoteip) {
            formData.append('remoteip', remoteip);
        }

        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            console.error('Erro na resposta do Turnstile:', response.status);
            return {
                success: false,
                error: 'Erro ao validar Turnstile'
            };
        }

        const result = await response.json();

        if (!result.success) {
            const errorMessages = {
                'missing-input-secret': 'Configuração do servidor inválida',
                'invalid-input-secret': 'Configuração do servidor inválida',
                'missing-input-response': 'Validação de segurança não realizada',
                'invalid-input-response': 'Validação de segurança inválida ou expirada',
                'bad-request': 'Pedido inválido',
                'timeout-or-duplicate': 'Validação expirada ou duplicada. Por favor, tente novamente',
                'internal-error': 'Erro interno. Por favor, tente novamente'
            };

            const errorCode = result['error-codes']?.[0] || 'unknown';
            const errorMessage = errorMessages[errorCode] || 'Falha na validação de segurança';

            console.warn('Turnstile validation failed:', errorCode, result['error-codes']);

            return {
                success: false,
                error: errorMessage,
                errorCodes: result['error-codes']
            };
        }

        return {
            success: true
        };

    } catch (error) {
        console.error('Erro ao validar Turnstile:', error);
        return {
            success: false,
            error: 'Erro ao validar segurança. Por favor, tente novamente'
        };
    }
}
