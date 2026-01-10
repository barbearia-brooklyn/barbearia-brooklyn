/**
 * Cloudinary Helper
 * Gestão de upload e deleção de imagens no Cloudinary
 */

/**
 * Faz upload de uma imagem base64 para o Cloudinary
 * @param {string} base64Image - Imagem em formato base64 (data:image/...)
 * @param {string} publicId - Public ID desejado para a imagem
 * @param {object} env - Variáveis de ambiente (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * @returns {Promise<{success: boolean, public_id?: string, error?: string}>}
 */
export async function uploadToCloudinary(base64Image, publicId, env) {
    try {
        // Validar variáveis de ambiente
        if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary credentials not configured');
        }

        // Gerar timestamp para assinatura
        const timestamp = Math.floor(Date.now() / 1000);

        // Parâmetros do upload (sem transformações complexas)
        const uploadParams = {
            timestamp: timestamp,
            public_id: publicId,
            overwrite: true,
            // Transformações básicas aceites pela API
            quality_analysis: true,
            // Eager transformações (executadas após upload)
            eager: 'c_limit,h_500,w_500/q_auto:good/f_auto',
            eager_async: false
        };

        // Criar string para assinatura (ordem alfabética dos parâmetros)
        const signatureParams = Object.keys(uploadParams)
            .sort()
            .map(key => `${key}=${uploadParams[key]}`)
            .join('&');

        // Gerar assinatura SHA-1 (Cloudinary usa SHA-1, não SHA-256)
        const signature = await generateSignature(
            signatureParams + env.CLOUDINARY_API_SECRET
        );

        // Criar FormData para o upload
        const formData = new FormData();
        formData.append('file', base64Image);
        formData.append('api_key', env.CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('public_id', publicId);
        formData.append('overwrite', 'true');
        formData.append('quality_analysis', 'true');
        formData.append('eager', 'c_limit,h_500,w_500/q_auto:good/f_auto');
        formData.append('eager_async', 'false');

        // Fazer upload
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const result = await response.json();

        return {
            success: true,
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        };

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Deleta uma imagem do Cloudinary
 * @param {string} publicId - Public ID da imagem a deletar
 * @param {object} env - Variáveis de ambiente
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromCloudinary(publicId, env) {
    try {
        if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary credentials not configured');
        }

        const timestamp = Math.floor(Date.now() / 1000);

        // String para assinatura
        const signatureString = `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
        const signature = await generateSignature(signatureString);

        // Criar FormData
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', env.CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        // Fazer deleção
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Delete failed');
        }

        const result = await response.json();

        return {
            success: result.result === 'ok',
            result: result.result
        };

    } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Não lançar erro, apenas logar (a foto pode já não existir)
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Gera assinatura SHA-1 para autenticação Cloudinary
 * @param {string} stringToSign - String para assinar
 * @returns {Promise<string>} - Hash SHA-1 em hexadecimal
 */
async function generateSignature(stringToSign) {
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    // Cloudinary usa SHA-1 para assinaturas
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}