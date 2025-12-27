export async function onRequest(context) {
    try {
        const { env } = context;
        
        const { results } = await env.DB.prepare(
            'SELECT id, nome, preco, duracao, svg, abreviacao, color FROM servicos'
        ).all();

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack 
        }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
