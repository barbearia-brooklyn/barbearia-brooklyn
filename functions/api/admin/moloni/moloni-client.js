/**
 * Moloni API Client
 * Handles authentication and API calls to Moloni
 */

const MOLONI_API_BASE = 'https://api.moloni.pt/v1';

class MoloniClient {
    constructor(env) {
        this.env = env;
        this.accessToken = null;
        this.refreshToken = null;
    }

    /**
     * Authenticate with Moloni using password grant
     */
    async authenticate() {
        try {
            // Try to get cached token from KV
            if (this.env.MOLONI_TOKENS) {
                const cached = await this.env.MOLONI_TOKENS.get('access_token', { type: 'json' });
                if (cached && cached.expires_at > Date.now()) {
                    this.accessToken = cached.access_token;
                    this.refreshToken = cached.refresh_token;
                    return;
                }
            }

            // Get new token
            const response = await fetch(`${MOLONI_API_BASE}/grant/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'password',
                    client_id: this.env.MOLONI_CLIENT_ID,
                    client_secret: this.env.MOLONI_CLIENT_SECRET,
                    username: this.env.MOLONI_USERNAME,
                    password: this.env.MOLONI_PASSWORD
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Moloni auth failed: ${error}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;

            // Cache token in KV (expires in 1 hour, refresh 5 min before)
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: Date.now() + (data.expires_in - 300) * 1000
                }), {
                    expirationTtl: data.expires_in
                });
            }

        } catch (error) {
            console.error('Moloni authentication error:', error);
            throw new Error('Falha na autenticação com Moloni: ' + error.message);
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        try {
            const response = await fetch(`${MOLONI_API_BASE}/grant/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    client_id: this.env.MOLONI_CLIENT_ID,
                    client_secret: this.env.MOLONI_CLIENT_SECRET,
                    refresh_token: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;

            // Update cache
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: Date.now() + (data.expires_in - 300) * 1000
                }), {
                    expirationTtl: data.expires_in
                });
            }

        } catch (error) {
            console.error('Token refresh error:', error);
            // If refresh fails, re-authenticate
            await this.authenticate();
        }
    }

    /**
     * Make API request to Moloni
     */
    async request(endpoint, data = {}) {
        if (!this.accessToken) {
            await this.authenticate();
        }

        try {
            const response = await fetch(`${MOLONI_API_BASE}/${endpoint}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: this.accessToken,
                    company_id: this.env.MOLONI_COMPANY_ID,
                    ...data
                })
            });

            if (response.status === 401) {
                // Token expired, refresh and retry
                await this.refreshAccessToken();
                return this.request(endpoint, data);
            }

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Moloni API error: ${error}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`Moloni ${endpoint} error:`, error);
            throw error;
        }
    }

    // ==== CUSTOMER METHODS ====

    /**
     * Search for customer by VAT/NIF
     */
    async findCustomerByVat(vat) {
        const response = await this.request('customers/getAll', {
            vat: vat
        });
        return response && response.length > 0 ? response[0] : null;
    }

    /**
     * Create new customer in Moloni
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
     */
    async findProductByName(name) {
        const response = await this.request('products/getAll', {
            search: name
        });
        return response && response.length > 0 ? response[0] : null;
    }

    /**
     * Create new product/service in Moloni
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
     */
    async getInvoicePDF(documentId) {
        const response = await this.request('invoices/getPDFLink', {
            document_id: documentId
        });
        return response.url;
    }
}

export { MoloniClient };