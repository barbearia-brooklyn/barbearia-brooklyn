/**
 * API Moloni - Create Invoice
 * Creates invoice in Moloni for a reservation
 * 
 * NOTE: Auth temporarily removed for testing integration
 */

import { MoloniClient } from './moloni-client';

export async function onRequestPost({ request, env }) {
    console.log('=== MOLONI CREATE INVOICE START ===');
    
    try {
        const data = await request.json();
        console.log('1. Request data:', JSON.stringify(data));

        // Validate required fields
        if (!data.reserva_id || !data.cliente_id || !data.servico_id) {
            console.error('Missing required fields:', { reserva_id: data.reserva_id, cliente_id: data.cliente_id, servico_id: data.servico_id });
            return new Response(JSON.stringify({ 
                error: 'Campos obrigatórios em falta',
                required: ['reserva_id', 'cliente_id', 'servico_id']
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Initialize Moloni client
        console.log('2. Initializing Moloni client...');
        const moloni = new MoloniClient(env);
        
        console.log('3. Authenticating with Moloni...');
        await moloni.authenticate();
        console.log('3. ✅ Authenticated successfully');

        // 1. Get client data from database
        console.log('4. Fetching cliente from DB...');
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(data.cliente_id).first();

        if (!cliente) {
            console.error('Cliente not found:', data.cliente_id);
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('4. ✅ Cliente found:', cliente.nome);

        // 2. Get service data
        console.log('5. Fetching servico from DB...');
        const servico = await env.DB.prepare(
            'SELECT * FROM servicos WHERE id = ?'
        ).bind(data.servico_id).first();

        if (!servico) {
            console.error('Servico not found:', data.servico_id);
            return new Response(JSON.stringify({ error: 'Serviço não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('5. ✅ Servico found:', servico.nome, 'preço:', servico.preco);

        // 3. Get reservation data
        console.log('6. Fetching reserva from DB...');
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(data.reserva_id).first();

        if (!reserva) {
            console.error('Reserva not found:', data.reserva_id);
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('6. ✅ Reserva found:', reserva.id);

        // 4. Update client NIF if requested and provided
        if (data.save_nif_to_profile && data.nif) {
            console.log('7. Updating cliente NIF in DB:', data.nif);
            await env.DB.prepare(
                'UPDATE clientes SET nif = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(data.nif, data.cliente_id).run();
            cliente.nif = data.nif;
            console.log('7. ✅ NIF updated');
        } else {
            console.log('7. Skipping NIF update');
        }

        // Use provided NIF or client's saved NIF
        const nifToUse = data.nif || cliente.nif || null;
        console.log('8. NIF to use:', nifToUse || '(none - consumidor final)');

        // 5. Find or create customer in Moloni
        console.log('9. Finding/creating customer in Moloni...');
        let moloniCustomer = null;
        
        if (nifToUse) {
            console.log('9a. Searching customer by VAT:', nifToUse);
            try {
                moloniCustomer = await moloni.findCustomerByVat(nifToUse);
                if (moloniCustomer) {
                    console.log('9a. ✅ Customer found:', moloniCustomer.customer_id);
                } else {
                    console.log('9a. Customer not found, will create new one');
                }
            } catch (error) {
                console.error('9a. Error searching customer:', error.message);
                // Continue to create customer
            }
        }

        if (!moloniCustomer) {
            console.log('9b. Creating new customer in Moloni...');
            const customerData = {
                numero: String(cliente.id),
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone,
                nif: nifToUse || ''
            };
            console.log('9b. Customer data:', JSON.stringify(customerData));
            
            try {
                const createResponse = await moloni.createCustomer(customerData);
                console.log('9b. Create customer response:', JSON.stringify(createResponse));
                moloniCustomer = { customer_id: createResponse.customer_id };
                console.log('9b. ✅ Customer created:', moloniCustomer.customer_id);
            } catch (error) {
                console.error('9b. ❌ Error creating customer:', error.message);
                throw new Error('Erro ao criar cliente na Moloni: ' + error.message);
            }
        }

        // 6. Find or create product in Moloni
        console.log('10. Finding/creating product in Moloni...');
        let moloniProduct = null;
        
        try {
            console.log('10a. Searching product by name:', servico.nome);
            moloniProduct = await moloni.findProductByName(servico.nome);
            if (moloniProduct) {
                console.log('10a. ✅ Product found:', moloniProduct.product_id);
            } else {
                console.log('10a. Product not found, will create new one');
            }
        } catch (error) {
            console.error('10a. Error searching product:', error.message);
            // Continue to create product
        }
        
        if (!moloniProduct) {
            console.log('10b. Creating new product in Moloni...');
            const productData = {
                nome: servico.nome,
                descricao: servico.descricao || `Serviço de barbearia - ${servico.nome}`,
                preco: servico.preco
            };
            console.log('10b. Product data:', JSON.stringify(productData));
            
            try {
                const createResponse = await moloni.createProduct(productData);
                console.log('10b. Create product response:', JSON.stringify(createResponse));
                moloniProduct = { product_id: createResponse.product_id };
                console.log('10b. ✅ Product created:', moloniProduct.product_id);
            } catch (error) {
                console.error('10b. ❌ Error creating product:', error.message);
                throw new Error('Erro ao criar produto na Moloni: ' + error.message);
            }
        }

        // 7. Calculate total with VAT (23%)
        const subtotal = parseFloat(servico.preco);
        const vat = subtotal * 0.23;
        const total = subtotal + vat;
        console.log('11. Pricing:', { subtotal, vat, total });

        // 8. Create invoice in Moloni
        console.log('12. Creating invoice in Moloni...');
        const invoiceData = {
            customer_id: moloniCustomer.customer_id,
            products: [
                {
                    product_id: moloniProduct.product_id,
                    name: servico.nome,
                    summary: `Reserva #${reserva.id}`,
                    qty: 1,
                    price: subtotal,
                    discount: 0,
                    taxes: [
                        {
                            tax_id: 1,
                            value: 23,
                            order: 0
                        }
                    ]
                }
            ],
            total: total,
            notes: `Reserva #${reserva.id} - ${new Date(reserva.data_hora).toLocaleString('pt-PT')}`
        };
        console.log('12. Invoice data:', JSON.stringify(invoiceData));

        let invoice;
        try {
            invoice = await moloni.createInvoice(invoiceData);
            console.log('12. ✅ Invoice created:', JSON.stringify(invoice));
        } catch (error) {
            console.error('12. ❌ Error creating invoice:', error.message);
            throw new Error('Erro ao criar fatura na Moloni: ' + error.message);
        }

        // 9. Update reservation with invoice data
        console.log('13. Updating reserva with invoice data...');
        try {
            await env.DB.prepare(
                `UPDATE reservas 
                 SET moloni_document_id = ?, 
                     moloni_document_number = ?,
                     atualizado_em = CURRENT_TIMESTAMP
                 WHERE id = ?`
            ).bind(
                invoice.document_id,
                invoice.document_number || `FT ${invoice.document_id}`,
                data.reserva_id
            ).run();
            console.log('13. ✅ Reserva updated');
        } catch (error) {
            console.error('13. Warning: Could not update reserva:', error.message);
            // Don't fail if DB update fails
        }

        // 10. Get PDF link (optional)
        console.log('14. Getting PDF link...');
        let pdfUrl = null;
        try {
            pdfUrl = await moloni.getInvoicePDF(invoice.document_id);
            console.log('14. ✅ PDF URL:', pdfUrl);
        } catch (error) {
            console.error('14. Warning: Could not get PDF:', error.message);
            // Continue even if PDF fetch fails
        }

        console.log('=== MOLONI CREATE INVOICE SUCCESS ===');
        return new Response(JSON.stringify({
            success: true,
            document_id: invoice.document_id,
            document_number: invoice.document_number || `FT ${invoice.document_id}`,
            document_url: pdfUrl,
            total: total.toFixed(2),
            subtotal: subtotal.toFixed(2),
            vat: vat.toFixed(2),
            message: 'Fatura criada com sucesso!'
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('=== MOLONI CREATE INVOICE ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        
        return new Response(JSON.stringify({
            error: 'Erro ao criar fatura',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}