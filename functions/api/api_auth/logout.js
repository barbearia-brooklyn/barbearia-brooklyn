// Endpoint de logout
export async function onRequestPost(context) {
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
            'Content-Type': 'application/json'
        }
    });
}