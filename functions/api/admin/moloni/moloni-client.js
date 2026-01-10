/**
 * Moloni API Client
 * Simplified version - Uses existing products/categories only
 * Prices in database already include VAT
 */

const MOLONI_API_BASE = 'https://api.moloni.pt';

class MoloniClient {
    constructor(env) {
        this.env = env;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = null;
        this.companyId = null;
        this.documentSetId = null;
        this.taxId23 = null; // Cache para IVA 23%
    }

    /**
     * Get company ID from Moloni by VAT number
     */
    async getCompanyId() {
        if (this.companyId) {
            return this.companyId;
        }

        try {
            console.log('[Moloni] Getting company ID...');

            const response = await fetch(
                `${MOLONI_API_BASE}/v1/companies/getAll/?access_token=${this.accessToken}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );

            const responseText = await response.text();
            console.log('[Moloni] Companies response:', responseText);

            if (!response.ok) {
                throw new Error(`Failed to get companies (${response.status}): ${responseText}`);
            }

            const companies = JSON.parse(responseText);
            
            if (!companies || companies.length === 0) {
                throw new Error('No companies found for this account');
            }

            const targetVat = '514875917';
            const company = companies.find(c => c.vat === targetVat);
            
            if (!company) {
                throw new Error(`Company with VAT ${targetVat} not found`);
            }

            this.companyId = company.company_id;
            
            console.log('[Moloni] ✅ Company:', company.name, '(ID:', this.companyId, ')');

            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('company_id', String(this.companyId), {
                    expirationTtl: 86400
                });
            }

            return this.companyId;

        } catch (error) {
            console.error('[Moloni] Error getting company ID:', error);
            throw new Error('Falha ao obter company_id: ' + error.message);
        }
    }

    /**
     * Get valid document set ID for invoices
     * Must be configured for AT communication
     */
    async getDocumentSetId() {
        if (this.documentSetId) {
            return this.documentSetId;
        }

        try {
            console.log('[Moloni] Getting document sets...');

            const response = await this.request('documentSets/getAll', {});
            
            if (!response || response.length === 0) {
                throw new Error('Nenhuma série de documentos encontrada. Configure no Moloni primeiro.');
            }

            console.log('[Moloni] Available document sets:', response.map(ds => ({
                id: ds.document_set_id,
                name: ds.name,
                active: ds.active_by_default
            })));

            // Procura por série ativa por padrão
            let invoiceSet = response.find(ds => ds.active_by_default === 1);

            // Se não encontrar, usa a primeira
            if (!invoiceSet) {
                invoiceSet = response[0];
                console.log('[Moloni] ⚠️ No default series found, using first:', invoiceSet.name);
            } else {
                console.log('[Moloni] ✅ Using default series:', invoiceSet.name);
            }

            this.documentSetId = invoiceSet.document_set_id;
            
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('document_set_id', String(this.documentSetId), {
                    expirationTtl: 86400
                });
            }
            
            return this.documentSetId;

        } catch (error) {
            console.error('[Moloni] Error getting document set:', error);
            throw new Error('Falha ao obter série de documentos. Verifique a configuração no Moloni.');
        }
    }

    /**
     * Get valid tax ID for IVA 23%
     */
    async getTaxId23() {
        if (this.taxId23) {
            return this.taxId23;
        }

        try {
            console.log('[Moloni] Getting tax IDs...');
            
            const taxes = await this.request('taxes/getAll', {});
            
            if (!taxes || taxes.length === 0) {
                throw new Error('No taxes found');
            }

            // Procura IVA 23%
            const iva23 = taxes.find(t => 
                t.name.includes('23') || 
                t.value === 23 ||
                t.name.toLowerCase().includes('iva cont')
            );

            if (!iva23) {
                console.error('[Moloni] Available taxes:', taxes.map(t => ({
                    id: t.tax_id,
                    name: t.name,
                    value: t.value
                })));
                throw new Error('IVA 23% não encontrado');
            }

            this.taxId23 = iva23.tax_id;
            console.log('[Moloni] ✅ Tax IVA 23%:', this.taxId23, `(${iva23.name})`);

            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('tax_id_23', String(this.taxId23), {
                    expirationTtl: 86400
                });
            }

            return this.taxId23;

        } catch (error) {
            console.error('[Moloni] Error getting tax ID:', error);
            throw new Error('Falha ao obter tax_id: ' + error.message);
        }
    }

    /**
     * Authenticate with Moloni
     */
    async authenticate() {
        try {
            console.log('[Moloni] Starting authentication...');

            // Try cached token
            if (this.env.MOLONI_TOKENS) {
                const cached = await this.env.MOLONI_TOKENS.get('access_token', { type: 'json' });
                const cachedCompanyId = await this.env.MOLONI_TOKENS.get('company_id');
                const cachedTaxId = await this.env.MOLONI_TOKENS.get('tax_id_23');
                
                if (cached && cached.expires_at > Date.now()) {
                    console.log('[Moloni] Using cached token');
                    this.accessToken = cached.access_token;
                    this.refreshToken = cached.refresh_token;
                    this.tokenExpiresAt = cached.expires_at;
                    
                    if (cachedCompanyId) {
                        this.companyId = parseInt(cachedCompanyId);
                    }
                    if (cachedTaxId) {
                        this.taxId23 = parseInt(cachedTaxId);
                    }
                    
                    if (!this.companyId) {
                        await this.getCompanyId();
                    }
                    
                    return;
                }
            }

            // Get new token
            const params = new URLSearchParams({
                grant_type: 'password',
                client_id: this.env.MOLONI_CLIENT_ID,
                client_secret: this.env.MOLONI_CLIENT_SECRET,
                username: this.env.MOLONI_USERNAME,
                password: this.env.MOLONI_PASSWORD
            });

            const response = await fetch(`${MOLONI_API_BASE}/v2/grant/?${params.toString()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`Moloni auth failed (${response.status}): ${responseText}`);
            }

            const data = JSON.parse(responseText);
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

            console.log('[Moloni] ✅ Authentication successful');

            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: this.tokenExpiresAt
                }), {
                    expirationTtl: data.expires_in
                });
            }

            await this.getCompanyId();

        } catch (error) {
            console.error('[Moloni] Authentication error:', error);
            throw new Error('Falha na autenticação com Moloni: ' + error.message);
        }
    }

    /**
     * Refresh access token
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
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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

            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: this.tokenExpiresAt
                }), {
                    expirationTtl: data.expires_in
                });
            }

            console.log('[Moloni] Token refreshed');

        } catch (error) {
            console.error('[Moloni] Token refresh error:', error);
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

        if (!this.companyId) {
            await this.getCompanyId();
        }

        if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
            await this.refreshAccessToken();
        }

        try {
            const queryString = `access_token=${this.accessToken}&json=true&human_errors=true`;
            
            const bodyData = {
                company_id: this.companyId,
                ...data
            };

            console.log(`[Moloni] Calling v1/${endpoint}`);
            console.log(`[Moloni] Body:`, JSON.stringify(bodyData));

            const response = await fetch(`${MOLONI_API_BASE}/v1/${endpoint}/?${queryString}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

            const result = JSON.parse(responseText);
            
            if (Array.isArray(result) && result.length > 0 && result[0].code) {
                const errors = result.map(e => e.description).join('; ');
                throw new Error(`Moloni API validation error: ${errors}`);
            }

            return result;

        } catch (error) {
            console.error(`[Moloni] ${endpoint} error:`, error);
            throw error;
        }
    }

    // ==== CUSTOMER METHODS ====

    async findCustomerByVat(vat) {
        const response = await this.request('customers/getAll', { vat: vat });
        return response && response.length > 0 ? response[0] : null;
    }

    async createCustomer(customerData) {
        const customerNumber = customerData.numero || `CLI${Date.now().toString().slice(-8)}`;
        
        return await this.request('customers/insert', {
            vat: customerData.nif || '',
            number: customerNumber,
            name: customerData.nome,
            language_id: 1,
            address: customerData.morada || '',
            zip_code: customerData.codigo_postal || '',
            city: customerData.cidade || '',
            country_id: 1,
            email: customerData.email || '',
            phone: customerData.telefone || '',
            notes: customerData.notas || '',
            salesman_id: 0,
            maturity_date_id: 0,
            payment_day: 0,
            discount: 0,
            credit_limit: 0,
            payment_method_id: 0,
            delivery_method_id: 0,
            qty_copies_document: 1
        });
    }

    // ==== PRODUCT METHODS ====

    /**
     * Find existing product by reference (SERV-{id})
     * Returns null if not found - does NOT create
     */
    async findProductByReference(reference) {
        try {
            console.log('[Moloni] Searching product by reference:', reference);
            const response = await this.request('products/getAll', { reference: reference });
            
            if (response && response.length > 0) {
                console.log('[Moloni] ✅ Product found:', response[0].product_id, response[0].name);
                return response[0];
            }
            
            console.log('[Moloni] ❌ Product not found with reference:', reference);
            return null;
        } catch (error) {
            console.error('[Moloni] Error finding product:', error);
            return null;
        }
    }

    // ==== INVOICE METHODS ====

    /**
     * Create invoice in Moloni
     * Prices already include VAT - no additional calculation
     */
    async createInvoice(invoiceData) {
        const today = new Date().toISOString().split('T')[0];
        const documentSetId = await this.getDocumentSetId();
        const taxId23 = await this.getTaxId23();

        // Validate products have product_id
        const invalidProducts = invoiceData.products.filter(p => !p.product_id);
        if (invalidProducts.length > 0) {
            throw new Error(`Produtos sem product_id: ${invalidProducts.map(p => p.name).join(', ')}`);
        }

        return await this.request('invoices/insert', {
            date: today,
            expiration_date: today,
            document_set_id: documentSetId,
            customer_id: invoiceData.customer_id,
            products: invoiceData.products.map(p => ({
                product_id: p.product_id,
                name: p.name,
                summary: p.summary || '',
                qty: p.qty || 1,
                price: parseFloat(p.price), // Preço já inclui IVA
                discount: p.discount || 0,
                exemption_reason: 'M16',
                taxes: [{
                    tax_id: taxId23,
                    value: 23,
                    order: 0
                }]
            })),
            payments: invoiceData.payments || [{
                payment_method_id: 1,
                date: today,
                value: invoiceData.total
            }],
            notes: invoiceData.notes || '',
            status: 1
        });
    }

    async getInvoicePDF(documentId) {
        const response = await this.request('invoices/getPDFLink', {
            document_id: documentId
        });
        return response.url;
    }X
}

export { MoloniClient };