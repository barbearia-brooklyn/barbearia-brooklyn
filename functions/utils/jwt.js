export async function generateJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    
    const encoder = new TextEncoder();
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) {
        throw new Error('Token inválido');
    }
    
    const payload = JSON.parse(atob(encodedPayload));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expirado');
    }
    
    return payload;
}