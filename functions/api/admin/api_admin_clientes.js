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
        
        // Se limit não for especificado, buscar TODOS (sem limite)
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : null;
        const offset = parseInt(url.searchParams.get('offset') || '0');

        console.log('Parâmetros:', { search, limit, offset });

        let query = `
            SELECT 
                c.id,
                c.nome,
                c.email,
                c.telefone,
                c.nif,
                c.criado_em as data_cadastro,
                c.atualizado_em,
                COUNT(r.id) as total_reservas
            FROM clientes c
            LEFT JOIN reservas r ON c.id = r.cliente_id
            WHERE 1=1
        `;

        const params = [];

        // Filtro de busca (nome, email ou telefone)
        if (search) {
            query += ` AND (c.nome LIKE ? OR c.email LIKE ? OR c.telefone LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ` GROUP BY c.id ORDER BY c.nome ASC`;
        
        // Só adiciona LIMIT se foi especificado
        if (limit !== null) {
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);
        }

        console.log('Query:', query);
        console.log('Params:', params);
        
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
            limit: limit,
            offset: offset
        };

        console.log('✅ Resposta OK');

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
            `INSERT INTO clientes (nome, email, telefone, password_hash)
             VALUES (?, ?, ?, ?)`
        ).bind(
            data.nome,
            data.email || `${data.telefone}@temp.local`,
            data.telefone,
            'temp'  // Cliente criado pelo admin não tem password ainda
        ).run();

        if (!result.success) {
            throw new Error('Falha ao criar cliente');
        }

        console.log('✅ Cliente criado com ID:', result.meta.last_row_id);

        // Buscar cliente criado
        const newCliente = await env.DB.prepare(
            'SELECT id, nome, email, telefone, nif FROM clientes WHERE id = ?'
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
