/**
 * Moloni API Client
 * Handles authentication and API calls to Moloni
 * Based on: https://www.moloni.pt/dev/autenticacao/
 */

const MOLONI_API_BASE = 'https://api.moloni.pt';

class MoloniClient {
    constructor(env) {
        this.env = env;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Authenticate with Moloni using password grant (Aplicações Nativas)
     * https://www.moloni.pt/dev/autenticacao/#aplicacoes-nativas
     */
    async authenticate() {
        try {
            console.log('[Moloni] Starting authentication...');

            // Try to get cached token from KV
            if (this.env.MOLONI_TOKENS) {
                const cached = await this.env.MOLONI_TOKENS.get('access_token', { type: 'json' });
                if (cached && cached.expires_at > Date.now()) {
                    console.log('[Moloni] Using cached token');
                    this.accessToken = cached.access_token;
                    this.refreshToken = cached.refresh_token;
                    this.tokenExpiresAt = cached.expires_at;
                    return;
                }
            }

            // Get new token - Password Grant (Aplicações Nativas)
            const params = new URLSearchParams({
                grant_type: 'password',
                client_id: this.env.MOLONI_CLIENT_ID,
                client_secret: this.env.MOLONI_CLIENT_SECRET,
                username: this.env.MOLONI_USERNAME,
                password: this.env.MOLONI_PASSWORD
            });

            console.log('[Moloni] Requesting token with client_id:', this.env.MOLONI_CLIENT_ID);

            const response = await fetch(`${MOLONI_API_BASE}/v2/grant/?${params.toString()}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const responseText = await response.text();
            console.log('[Moloni] Auth response status:', response.status);
            console.log('[Moloni] Auth response:', responseText);

            if (!response.ok) {
                throw new Error(`Moloni auth failed (${response.status}): ${responseText}`);
            }

            const data = JSON.parse(responseText);
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000; // 5 min before expiry

            console.log('[Moloni] Authentication successful!');

            // Cache token in KV (expires in 1 hour, refresh 5 min before)
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: this.tokenExpiresAt
                }), {
                    expirationTtl: data.expires_in
                });
            }

        } catch (error) {
            console.error('[Moloni] Authentication error:', error);
            throw new Error('Falha na autenticação com Moloni: ' + error.message);
        }
    }

    /**
     * Refresh access token
     * https://www.moloni.pt/dev/autenticacao/#fazer-refresh-ao-access-token
     */
    async refreshAccessToken() {
        try {
            console.log('[Moloni] Refreshing token...');

            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: this.env.MOLONI_CLIENT_ID,
                client_secret: this.env.MOLONI_CLIENT_SECRET,
                refresh_token: this.refreshToken
            });

            const response = await fetch(`${MOLONI_API_BASE}/v2/grant/?${params.toString()}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                console.log('[Moloni] Refresh failed, re-authenticating...');
                await this.authenticate();
                return;
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

            // Update cache
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: this.tokenExpiresAt
                }), {
                    expirationTtl: data.expires_in
                });
            }

            console.log('[Moloni] Token refreshed successfully');

        } catch (error) {
            console.error('[Moloni] Token refresh error:', error);
            await this.authenticate();
        }
    }

    /**
     * Make API request to Moloni
     * https://www.moloni.pt/dev/utilizacao/
     * https://www.moloni.pt/dev/endpoints/
     */
    async request(endpoint, data = {}) {
        if (!this.accessToken) {
            await this.authenticate();
        }

        // Check if token is about to expire
        if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
            await this.refreshAccessToken();
        }

        try {
            // Query string com access_token e json=true
            const queryString = `access_token=${this.accessToken}&json=true&human_errors=true`;
            
            // Body com company_id e dados
            const bodyData = {
                company_id: this.env.MOLONI_COMPANY_ID,
                ...data
            };

            console.log(`[Moloni] Calling v1/${endpoint}`);
            console.log(`[Moloni] Body:`, JSON.stringify(bodyData));

            // API v1 para endpoints normais
            const response = await fetch(`${MOLONI_API_BASE}/v1/${endpoint}/?${queryString}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });

            const responseText = await response.text();
            console.log(`[Moloni] ${endpoint} response:`, responseText);

            if (response.status === 401) {
                console.log('[Moloni] 401 - Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.request(endpoint, data);
            }

            if (!response.ok) {
                throw new Error(`Moloni API error (${response.status}): ${responseText}`);
            }

            return JSON.parse(responseText);

        } catch (error) {
            console.error(`[Moloni] ${endpoint} error:`, error);
            throw error;
        }
    }

    // ==== CUSTOMER METHODS ====

    /**
     * Search for customer by VAT/NIF
     * https://www.moloni.pt/dev/entities/customers/getall/
     */
    async findCustomerByVat(vat) {
        const response = await this.request('customers/getAll', {
            vat: vat
        });
        return response && response.length > 0 ? response[0] : null;
    }

    /**
     * Create new customer in Moloni
     * https://www.moloni.pt/dev/entities/customers/insert/
     */
    async createCustomer(customerData) {
        return await this.request('customers/insert', {
            vat: customerData.nif || '',
            number: customerData.numero || '',
            name: customerData.nome,
            language_id: 1, // Portuguese
            address: customerData.morada || '',
            zip_code: customerData.codigo_postal || '',
            city: customerData.cidade || '',
            country_id: 1, // Portugal
            email: customerData.email || '',
            phone: customerData.telefone || '',
            notes: customerData.notas || ''
        });
    }

    /**
     * Update existing customer
     * https://www.moloni.pt/dev/entities/customers/update/
     */
    async updateCustomer(customerId, customerData) {
        return await this.request('customers/update', {
            customer_id: customerId,
            vat: customerData.nif || '',
            name: customerData.nome,
            email: customerData.email || '',
            phone: customerData.telefone || ''
        });
    }

    // ==== PRODUCT METHODS ====

    /**
     * Search for product by name
     * https://www.moloni.pt/dev/products/products/getbyname/
     */
    async findProductByName(name) {
        const response = await this.request('products/getByName', {
            name: name
        });
        return response && response.length > 0 ? response[0] : null;
    }

    /**
     * Create new product/service in Moloni
     * https://www.moloni.pt/dev/products/products/insert/
     */
    async createProduct(productData) {
        return await this.request('products/insert', {
            category_id: 1, // Default category
            type: 2, // Service
            name: productData.nome,
            summary: productData.descricao || '',
            unit_id: 1, // Units
            has_stock: 0,
            price: parseFloat(productData.preco),
            taxes: [
                {
                    tax_id: 1, // IVA 23%
                    value: 23,
                    order: 0,
                    cumulative: 0
                }
            ]
        });
    }

    // ==== INVOICE METHODS ====

    /**
     * Create invoice in Moloni
     * https://www.moloni.pt/dev/documents/invoices/insert/
     */
    async createInvoice(invoiceData) {
        const today = new Date().toISOString().split('T')[0];

        return await this.request('invoices/insert', {
            date: today,
            expiration_date: today,
            document_set_id: invoiceData.document_set_id || 1,
            customer_id: invoiceData.customer_id,
            products: invoiceData.products.map(p => ({
                product_id: p.product_id,
                name: p.name,
                summary: p.summary || '',
                qty: p.qty || 1,
                price: parseFloat(p.price),
                discount: p.discount || 0,
                exemption_reason: p.exemption_reason || '',
                taxes: p.taxes || [
                    {
                        tax_id: 1,
                        value: 23,
                        order: 0
                    }
                ]
            })),
            payments: invoiceData.payments || [
                {
                    payment_method_id: 1, // Dinheiro
                    date: today,
                    value: invoiceData.total
                }
            ],
            notes: invoiceData.notes || '',
            status: 1 // Closed
        });
    }

    /**
     * Get invoice PDF URL
     * https://www.moloni.pt/dev/documents/invoices/getpdflink/
     */
    async getInvoicePDF(documentId) {
        const response = await this.request('invoices/getPDFLink', {
            document_id: documentId
        });
        return response.url;
    }
}

export { MoloniClient };