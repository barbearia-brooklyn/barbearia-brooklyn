/**
 * API Moloni - Create Invoice
 * Creates invoice in Moloni for a reservation
 * Supports multiple services - prices already include VAT
 */

import { MoloniClient } from './moloni-client';

export async function onRequestPost({ request, env }) {
    console.log('=== MOLONI CREATE INVOICE START ===');
    
    try {
        const data = await request.json();
        console.log('1. Request data:', JSON.stringify(data));

        // Validate required fields
        if (!data.reserva_id || !data.cliente_id) {
            return new Response(JSON.stringify({ 
                error: 'Campos obrigatórios em falta',
                required: ['reserva_id', 'cliente_id', 'servico_ids']
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Support both single service (servico_id) and multiple (servico_ids)
        let servicoIds = [];
        if (data.servico_ids && Array.isArray(data.servico_ids)) {
            servicoIds = data.servico_ids;
        } else if (data.servico_id) {
            servicoIds = [data.servico_id];
        }

        if (servicoIds.length === 0) {
            return new Response(JSON.stringify({ 
                error: 'Nenhum serviço especificado'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('2. Services to invoice:', servicoIds);

        // Initialize Moloni client
        console.log('3. Initializing Moloni client...');
        const moloni = new MoloniClient(env);
        
        console.log('4. Authenticating with Moloni...');
        await moloni.authenticate();
        console.log('4. ✅ Authenticated');

        // Get cliente from database
        console.log('5. Fetching cliente from DB...');
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(data.cliente_id).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('5. ✅ Cliente:', cliente.nome);

        // Get all services from database
        console.log('6. Fetching servicos from DB...');
        const servicosQuery = servicoIds.map(() => '?').join(',');
        const servicos = await env.DB.prepare(
            `SELECT * FROM servicos WHERE id IN (${servicosQuery})`
        ).bind(...servicoIds).all();

        if (!servicos.results || servicos.results.length === 0) {
            return new Response(JSON.stringify({ error: 'Serviços não encontrados' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('6. ✅ Servicos:', servicos.results.map(s => `${s.nome} (€${s.preco})`).join(', '));

        // Get reserva from database
        console.log('7. Fetching reserva from DB...');
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(data.reserva_id).first();

        if (!reserva) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('7. ✅ Reserva:', reserva.id);

        // Update cliente NIF if requested
        if (data.save_nif_to_profile && data.nif) {
            console.log('8. Updating cliente NIF in DB:', data.nif);
            await env.DB.prepare(
                'UPDATE clientes SET nif = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(data.nif, data.cliente_id).run();
            cliente.nif = data.nif;
            console.log('8. ✅ NIF updated');
        } else {
            console.log('8. Skipping NIF update');
        }

        const nifToUse = data.nif || cliente.nif || null;
        console.log('9. NIF to use:', nifToUse || '(consumidor final)');

        // Find or create customer in Moloni
        console.log('10. Finding/creating customer in Moloni...');
        let moloniCustomer = null;
        
        if (nifToUse) {
            console.log('10a. Searching customer by VAT:', nifToUse);
            moloniCustomer = await moloni.findCustomerByVat(nifToUse);
            
            if (moloniCustomer) {
                console.log('10a. ✅ Customer found:', moloniCustomer.customer_id);
            } else {
                console.log('10a. Customer not found, creating...');
            }
        }

        if (!moloniCustomer) {
            console.log('10b. Creating new customer...');
            const customerData = {
                numero: String(cliente.id),
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone,
                nif: nifToUse || ''
            };
            
            const createResponse = await moloni.createCustomer(customerData);
            moloniCustomer = { customer_id: createResponse.customer_id };
            console.log('10b. ✅ Customer created:', moloniCustomer.customer_id);
        }

        // Find all products in Moloni
        console.log('11. Finding products in Moloni...');
        const moloniProducts = [];
        const notFoundProducts = [];

        for (const servico of servicos.results) {
            const productReference = `SERV-${servico.id}`;
            console.log(`11a. Searching product: ${servico.nome} (${productReference})`);
            
            const moloniProduct = await moloni.findProductByReference(productReference);

            if (!moloniProduct) {
                console.error(`11a. ❌ Product not found: ${productReference}`);
                notFoundProducts.push({
                    id: servico.id,
                    nome: servico.nome,
                    referencia: productReference
                });
            } else {
                console.log(`11a. ✅ Product found: ${moloniProduct.product_id} - ${moloniProduct.name}`);
                moloniProducts.push({
                    product_id: moloniProduct.product_id,
                    name: servico.nome,
                    preco_com_iva: parseFloat(servico.preco),
                    servico_id: servico.id
                });
            }
        }

        // Return error if any product not found
        if (notFoundProducts.length > 0) {
            return new Response(JSON.stringify({ 
                error: 'Produtos não encontrados na Moloni',
                details: `Os seguintes serviços não existem na Moloni. Por favor, crie-os manualmente primeiro.`,
                produtos: notFoundProducts
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate totals
        const totalWithVat = moloniProducts.reduce((sum, p) => sum + p.preco_com_iva, 0);
        const totalWithoutVat = totalWithVat / 1.23;
        const vatAmount = totalWithVat - totalWithoutVat;
        
        console.log('12. Pricing:');
        console.log('12.   - Base (sem IVA):', totalWithoutVat.toFixed(2), '€');
        console.log('12.   - IVA (23%):', vatAmount.toFixed(2), '€');
        console.log('12.   - Total (com IVA):', totalWithVat.toFixed(2), '€');

        // Create invoice in Moloni
        console.log('13. Creating invoice in Moloni...');
        const invoiceData = {
            customer_id: moloniCustomer.customer_id,
            products: moloniProducts.map(p => ({
                product_id: p.product_id,
                name: p.name,
                summary: `Reserva #${reserva.id}`,
                qty: 1,
                price: p.preco_com_iva / 1.23, // Remove IVA (Moloni adds it back)
                discount: 0
            })),
            total: totalWithVat,
            notes: `Reserva #${reserva.id} - ${new Date(reserva.data_hora).toLocaleString('pt-PT')}`
        };

        let invoice;
        try {
            invoice = await moloni.createInvoice(invoiceData);
            console.log('13. ✅ Invoice created:', invoice.document_id, invoice.document_number);
        } catch (error) {
            console.error('13. ❌ Error creating invoice:', error.message);
            
            // Check for AT connection error
            if (error.message.includes('document_set_id') || error.message.includes('document_set_wsat_id')) {
                return new Response(JSON.stringify({
                    error: '️ A faturação está inativa. Por favor, conecte a Moloni com a Autoridade Tributária',
                    details: '⚠️ A faturação está inativa. Por favor, conecte a Moloni com a Autoridade Tributária nas definições da Moloni (Séries de Documentos).'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            throw new Error('Erro ao criar fatura na Moloni: ' + error.message);
        }

        // Update reserva with invoice data
        console.log('14. Updating reserva with invoice data...');
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
            console.log('14. ✅ Reserva updated');
        } catch (error) {
            console.error('14. ⚠️ Warning: Could not update reserva:', error.message);
        }

        // Get PDF link
        console.log('15. Getting PDF link...');
        let pdfUrl = null;
        try {
            pdfUrl = await moloni.getInvoicePDF(invoice.document_id);
            console.log('15. ✅ PDF URL:', pdfUrl);
        } catch (error) {
            console.error('15. ⚠️ Warning: Could not get PDF:', error.message);
        }

        console.log('=== MOLONI CREATE INVOICE SUCCESS ===');
        return new Response(JSON.stringify({
            success: true,
            document_id: invoice.document_id,
            document_number: invoice.document_number || `FT ${invoice.document_id}`,
            document_url: pdfUrl,
            pricing: {
                subtotal: totalWithoutVat.toFixed(2),
                vat: vatAmount.toFixed(2),
                total: totalWithVat.toFixed(2)
            },
            services_count: moloniProducts.length,
            message: `Fatura criada com ${moloniProducts.length} serviço(s)!`
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