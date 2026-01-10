/**
 * API Moloni - Create Invoice
 * Creates invoice in Moloni for a reservation
 * Uses existing products only - prices already include VAT
 */

import { MoloniClient } from './moloni-client';

export async function onRequestPost({ request, env }) {
    console.log('=== MOLONI CREATE INVOICE START ===');
    
    try {
        const data = await request.json();
        console.log('1. Request data:', JSON.stringify(data));

        // Validate required fields
        if (!data.reserva_id || !data.cliente_id || !data.servico_id) {
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
        console.log('3. ✅ Authenticated');

        // Get cliente from database
        console.log('4. Fetching cliente from DB...');
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(data.cliente_id).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('4. ✅ Cliente:', cliente.nome);

        // Get servico from database
        console.log('5. Fetching servico from DB...');
        const servico = await env.DB.prepare(
            'SELECT * FROM servicos WHERE id = ?'
        ).bind(data.servico_id).first();

        if (!servico) {
            return new Response(JSON.stringify({ error: 'Serviço não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('5. ✅ Servico:', servico.nome, '- Preço:', servico.preco, '€ (IVA incluído)');

        // Get reserva from database
        console.log('6. Fetching reserva from DB...');
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(data.reserva_id).first();

        if (!reserva) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('6. ✅ Reserva:', reserva.id);

        // Update cliente NIF if requested
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

        const nifToUse = data.nif || cliente.nif || null;
        console.log('8. NIF to use:', nifToUse || '(consumidor final)');

        // Find or create customer in Moloni
        console.log('9. Finding/creating customer in Moloni...');
        let moloniCustomer = null;
        
        if (nifToUse) {
            console.log('9a. Searching customer by VAT:', nifToUse);
            moloniCustomer = await moloni.findCustomerByVat(nifToUse);
            
            if (moloniCustomer) {
                console.log('9a. ✅ Customer found:', moloniCustomer.customer_id);
            } else {
                console.log('9a. Customer not found, creating...');
            }
        }

        if (!moloniCustomer) {
            console.log('9b. Creating new customer...');
            const customerData = {
                numero: String(cliente.id), // Usa ID da BD
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone,
                nif: nifToUse || ''
            };
            
            const createResponse = await moloni.createCustomer(customerData);
            moloniCustomer = { customer_id: createResponse.customer_id };
            console.log('9b. ✅ Customer created:', moloniCustomer.customer_id);
        }

        // Find product in Moloni (must exist!)
        console.log('10. Finding product in Moloni...');
        const productReference = `SERV-${servico.id}`;
        console.log('10a. Searching by reference:', productReference);
        
        const moloniProduct = await moloni.findProductByReference(productReference);

        if (!moloniProduct) {
            console.error('10a. ❌ Product not found in Moloni!');
            return new Response(JSON.stringify({ 
                error: 'Produto não encontrado na Moloni',
                details: `O serviço "${servico.nome}" (${productReference}) não existe na Moloni. Por favor, crie-o manualmente primeiro.`,
                servico: {
                    id: servico.id,
                    nome: servico.nome,
                    referencia_esperada: productReference
                }
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('10a. ✅ Product found:', moloniProduct.product_id, '-', moloniProduct.name);

        // Calculate pricing (price already includes VAT)
        const priceWithVAT = parseFloat(servico.preco);
        const priceWithoutVAT = priceWithVAT / 1.23; // Remove IVA para calcular base
        const vatAmount = priceWithVAT - priceWithoutVAT;
        
        console.log('11. Pricing:');
        console.log('11.   - Preço base (sem IVA):', priceWithoutVAT.toFixed(2), '€');
        console.log('11.   - IVA (23%):', vatAmount.toFixed(2), '€');
        console.log('11.   - Total (com IVA):', priceWithVAT.toFixed(2), '€');

        // Create invoice in Moloni
        console.log('12. Creating invoice in Moloni...');
        const invoiceData = {
            customer_id: moloniCustomer.customer_id,
            products: [{
                product_id: moloniProduct.product_id,
                name: servico.nome,
                summary: `Reserva #${reserva.id}`,
                qty: 1,
                price: priceWithoutVAT, // Preço sem IVA (Moloni adiciona automaticamente)
                discount: 0
            }],
            total: priceWithVAT,
            notes: `Reserva #${reserva.id} - ${new Date(reserva.data_hora).toLocaleString('pt-PT')}`
        };

        let invoice;
        try {
            invoice = await moloni.createInvoice(invoiceData);
            console.log('12. ✅ Invoice created:', invoice.document_id, invoice.document_number);
        } catch (error) {
            console.error('12. ❌ Error creating invoice:', error.message);
            throw new Error('Erro ao criar fatura na Moloni: ' + error.message);
        }

        // Update reserva with invoice data
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
            console.error('13. ⚠️ Warning: Could not update reserva:', error.message);
        }

        // Get PDF link
        console.log('14. Getting PDF link...');
        let pdfUrl = null;
        try {
            pdfUrl = await moloni.getInvoicePDF(invoice.document_id);
            console.log('14. ✅ PDF URL:', pdfUrl);
        } catch (error) {
            console.error('14. ⚠️ Warning: Could not get PDF:', error.message);
        }

        console.log('=== MOLONI CREATE INVOICE SUCCESS ===');
        return new Response(JSON.stringify({
            success: true,
            document_id: invoice.document_id,
            document_number: invoice.document_number || `FT ${invoice.document_id}`,
            document_url: pdfUrl,
            pricing: {
                subtotal: priceWithoutVAT.toFixed(2),
                vat: vatAmount.toFixed(2),
                total: priceWithVAT.toFixed(2)
            },
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