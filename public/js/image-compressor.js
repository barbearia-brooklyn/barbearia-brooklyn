/**
 * Image Compressor
 * Pré-compressão de imagens do lado do cliente antes do upload
 * Para contornar limitação de 10MB da conta gratuita Cloudinary
 */

/**
 * Comprime uma imagem se necessário para ficar abaixo do limite
 * @param {File} file - Ficheiro de imagem original
 * @param {number} maxSizeMB - Tamanho máximo em MB (padrão: 10)
 * @param {number} maxWidthOrHeight - Dimensão máxima (padrão: 2000)
 * @returns {Promise<string>} - Base64 da imagem comprimida
 */
export async function compressImageIfNeeded(file, maxSizeMB = 10, maxWidthOrHeight = 2000) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Se já está abaixo do limite, retornar sem comprimir
    if (file.size <= maxSizeBytes) {
        return await fileToBase64(file);
    }

    console.log(`🗃️ Imagem muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB), comprimindo...`);

    // Carregar imagem
    const img = await loadImage(file);
    
    // Calcular novas dimensões mantendo proporções
    let { width, height } = calculateDimensions(img.width, img.height, maxWidthOrHeight);
    
    // Tentar diferentes níveis de qualidade até ficar abaixo do limite
    const qualityLevels = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
    
    for (const quality of qualityLevels) {
        const compressed = await compressImage(img, width, height, quality);
        const compressedSize = getBase64Size(compressed);
        
        console.log(`🧪 Tentando qualidade ${(quality * 100).toFixed(0)}%: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
        
        if (compressedSize <= maxSizeBytes) {
            console.log(`✅ Compressão bem-sucedida! ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
            return compressed;
        }
        
        // Se ainda não conseguiu com qualidade 0.5, reduzir dimensões também
        if (quality <= 0.5) {
            width = Math.floor(width * 0.9);
            height = Math.floor(height * 0.9);
        }
    }
    
    // Última tentativa: reduzir drasticamente
    console.log('⚠️ Reduzindo dimensões drasticamente...');
    const finalWidth = Math.min(width, 1200);
    const finalHeight = Math.floor(finalWidth * (img.height / img.width));
    const finalCompressed = await compressImage(img, finalWidth, finalHeight, 0.3);
    
    const finalSize = getBase64Size(finalCompressed);
    console.log(`🏁 Tamanho final: ${(finalSize / 1024 / 1024).toFixed(2)}MB`);
    
    return finalCompressed;
}

/**
 * Carrega uma imagem do File para HTMLImageElement
 */
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Calcula novas dimensões mantendo proporções
 */
function calculateDimensions(width, height, maxDimension) {
    if (width <= maxDimension && height <= maxDimension) {
        return { width, height };
    }
    
    const ratio = width / height;
    
    if (width > height) {
        return {
            width: maxDimension,
            height: Math.floor(maxDimension / ratio)
        };
    } else {
        return {
            width: Math.floor(maxDimension * ratio),
            height: maxDimension
        };
    }
}

/**
 * Comprime imagem usando Canvas API
 */
function compressImage(img, width, height, quality) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Melhorar qualidade do redimensionamento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com qualidade especificada
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
    });
}

/**
 * Converte File para base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Calcula tamanho em bytes de uma string base64
 */
function getBase64Size(base64String) {
    // Remove o prefixo data:image/...;base64,
    const base64 = base64String.split(',')[1];
    // Calcula tamanho real (base64 adiciona ~33% de overhead)
    return (base64.length * 3) / 4;
}

/**
 * Valida tipo de imagem
 */
export function isValidImageType(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Formata tamanho em bytes para string legível
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}