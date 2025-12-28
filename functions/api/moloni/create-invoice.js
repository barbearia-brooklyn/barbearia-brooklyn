/**
 * API Moloni - Create Invoice
 * Creates invoice in Moloni for a reservation
 */

import { verifyAdminToken } from '../admin/auth';
import { MoloniClient } from '../../utils/moloni-client';

export async function onRequestPost({ request, env }) {
    try {
        // Verify admin authentication
        const authResult = await verifyAdminToken(request, env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await request.json();

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
        const moloni = new MoloniClient(env);
        await moloni.authenticate();

        // 1. Get client data from database
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(data.cliente_id).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Get service data
        const servico = await env.DB.prepare(
            'SELECT * FROM servicos WHERE id = ?'
        ).bind(data.servico_id).first();

        if (!servico) {
            return new Response(JSON.stringify({ error: 'Serviço não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Get reservation data
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(data.reserva_id).first();

        if (!reserva) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 4. Update client NIF if requested and provided
        if (data.save_nif_to_profile && data.nif) {
            await env.DB.prepare(
                'UPDATE clientes SET nif = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(data.nif, data.cliente_id).run();
            cliente.nif = data.nif;
        }

        // Use provided NIF or client's saved NIF
        const nifToUse = data.nif || cliente.nif;

        // 5. Find or create customer in Moloni
        let moloniCustomer = null;
        
        if (nifToUse) {
            moloniCustomer = await moloni.findCustomerByVat(nifToUse);
        }

        if (!moloniCustomer) {
            const customerData = {
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone,
                nif: nifToUse || ''
            };
            
            const createResponse = await moloni.createCustomer(customerData);
            moloniCustomer = { customer_id: createResponse.customer_id };
        }

        // 6. Find or create product in Moloni
        let moloniProduct = await moloni.findProductByName(servico.nome);
        
        if (!moloniProduct) {
            const productData = {
                nome: servico.nome,
                descricao: servico.descricao || `Serviço de barbearia - ${servico.nome}`,
                preco: servico.preco
            };
            
            const createResponse = await moloni.createProduct(productData);
            moloniProduct = { product_id: createResponse.product_id };
        }

        // 7. Calculate total with VAT (23%)
        const subtotal = parseFloat(servico.preco);
        const vat = subtotal * 0.23;
        const total = subtotal + vat;

        // 8. Create invoice in Moloni
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

        const invoice = await moloni.createInvoice(invoiceData);

        // 9. Update reservation with invoice data
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

        // 10. Get PDF link (optional)
        let pdfUrl = null;
        try {
            pdfUrl = await moloni.getInvoicePDF(invoice.document_id);
        } catch (error) {
            console.error('Error getting PDF:', error);
            // Continue even if PDF fetch fails
        }

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
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating invoice:', error);
        
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