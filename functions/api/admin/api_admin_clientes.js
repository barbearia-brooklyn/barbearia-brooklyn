/**
 * API Admin - Clientes
 * Gestão completa de clientes (CRUD)
 */

// GET - Listar todos os clientes
export async function onRequestGet({ request, env }) {
    try {
        console.log('✅ GET Clientes - Iniciando...');

        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        console.log('Parâmetros:', { search, limit, offset });

        let query = `
            SELECT 
                id,
                nome,
                email,
                telefone,
                notas,
                criado_em,
                atualizado_em
            FROM clientes
            WHERE 1=1
        `;

        const params = [];

        // Filtro de busca (nome, email ou telefone)
        if (search) {
            query += ` AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ` ORDER BY nome ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        console.log('Executando query...');
        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();
        console.log(`✅ Clientes encontrados: ${results ? results.length : 0}`);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM clientes WHERE 1=1';
        const countParams = [];
        
        if (search) {
            countQuery += ` AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)`;
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern);
        }

        const countStmt = env.DB.prepare(countQuery);
        const countResult = await countStmt.bind(...countParams).first();

        const response = {
            clientes: results || [],
            total: countResult ? countResult.total : 0,
            limit,
            offset
        };

        console.log('✅ Resposta:', response);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar clientes',
            details: error.message,
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

// POST - Criar novo cliente
export async function onRequestPost({ request, env }) {
    try {
        console.log('✅ POST Cliente - Iniciando...');

        const data = await request.json();
        console.log('Dados recebidos:', data);

        // Validações
        if (!data.nome || !data.telefone) {
            return new Response(JSON.stringify({
                error: 'Nome e telefone são obrigatórios'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se já existe cliente com esse telefone
        const existing = await env.DB.prepare(
            'SELECT id FROM clientes WHERE telefone = ?'
        ).bind(data.telefone).first();

        if (existing) {
            console.log('Cliente já existe:', existing.id);
            return new Response(JSON.stringify({
                error: 'Já existe um cliente com este telefone',
                cliente_id: existing.id
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Criar cliente
        console.log('Criando cliente...');
        const result = await env.DB.prepare(
            `INSERT INTO clientes (nome, email, telefone, notas)
             VALUES (?, ?, ?, ?)`
        ).bind(
            data.nome,
            data.email || null,
            data.telefone,
            data.notas || null
        ).run();

        if (!result.success) {
            throw new Error('Falha ao criar cliente');
        }

        console.log('✅ Cliente criado com ID:', result.meta.last_row_id);

        // Buscar cliente criado
        const newCliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(result.meta.last_row_id).first();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
            cliente: newCliente,
            message: 'Cliente criado com sucesso'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao criar cliente:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao criar cliente',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
