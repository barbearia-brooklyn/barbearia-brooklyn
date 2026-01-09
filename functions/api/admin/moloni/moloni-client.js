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
        this.companyId = null;
        this.documentSetId = null;
        this.defaultCategoryId = null;
    }

    /**
     * Get company ID from Moloni by VAT number
     * https://www.moloni.pt/dev/entities/companies/getall/
     */
    async getCompanyId() {
        if (this.companyId) {
            return this.companyId;
        }

        try {
            console.log('[Moloni] Getting company ID...');

            const response = await fetch(
                `${MOLONI_API_BASE}/v1/companies/getAll/?access_token=${this.accessToken}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
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

            // Procura pela empresa com VAT 514875917 (Jovialdreams)
            const targetVat = '514875917';
            const company = companies.find(c => c.vat === targetVat);

            if (!company) {
                console.error('[Moloni] Available companies:', companies.map(c => ({
                    id: c.company_id,
                    name: c.name,
                    vat: c.vat
                })));
                throw new Error(`Company with VAT ${targetVat} not found. Available: ${companies.map(c => c.name).join(', ')}`);
            }

            this.companyId = company.company_id;

            console.log('[Moloni] ✅ Company selected:');
            console.log('[Moloni]   - ID:', this.companyId);
            console.log('[Moloni]   - Name:', company.name);
            console.log('[Moloni]   - VAT:', company.vat);

            // Cache no KV
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('company_id', String(this.companyId), {
                    expirationTtl: 86400 // 24 horas
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
     * https://www.moloni.pt/dev/documents/document-sets/getall/
     */
    async getDocumentSetId() {
        if (this.documentSetId) {
            return this.documentSetId;
        }

        try {
            console.log('[Moloni] Getting document set ID...');

            const response = await this.request('documentSets/getAll', {});

            if (!response || response.length === 0) {
                throw new Error('No document sets found');
            }

            // Procura por série de faturas (FT)
            const invoiceSet = response.find(ds =>
                ds.name.toLowerCase().includes('fatura') ||
                ds.name.toLowerCase().includes('ft') ||
                ds.document_type_id === 1
            );

            if (!invoiceSet) {
                this.documentSetId = response[0].document_set_id;
                console.log('[Moloni] Using first available document set:', response[0].name);
            } else {
                this.documentSetId = invoiceSet.document_set_id;
                console.log('[Moloni] Using document set:', invoiceSet.name);
            }

            console.log('[Moloni] Document Set ID:', this.documentSetId);
            return this.documentSetId;

        } catch (error) {
            console.error('[Moloni] Error getting document set:', error);
            throw new Error('Falha ao obter document_set_id: ' + error.message);
        }
    }

    /**
     * Get or create default product category
     * https://www.moloni.pt/dev/products/product-categories/getall/
     * https://www.moloni.pt/dev/products/product-categories/insert/
     */
    async getOrCreateProductCategory() {
        if (this.defaultCategoryId) {
            return this.defaultCategoryId;
        }

        try {
            console.log('[Moloni] Getting product categories...');

            const categories = await this.request('productCategories/getAll', {});

            if (categories && categories.length > 0) {
                const serviceCat = categories.find(c =>
                    c.name.toLowerCase().includes('serviço') ||
                    c.name.toLowerCase().includes('servico')
                );

                this.defaultCategoryId = serviceCat
                    ? serviceCat.category_id
                    : categories[0].category_id;

                console.log('[Moloni] Using category:', serviceCat?.name || categories[0].name);
                console.log('[Moloni] Category ID:', this.defaultCategoryId);
                return this.defaultCategoryId;
            }

            console.log('[Moloni] No categories found, creating default category...');
            const newCategory = await this.request('productCategories/insert', {
                name: 'Serviços de Barbearia',
                description: 'Serviços prestados pela barbearia',
                parent_id: 0 // 0 = categoria raiz (obrigatório)
            });

            this.defaultCategoryId = newCategory.category_id;
            console.log('[Moloni] Created category:', this.defaultCategoryId);

            // Cache no KV
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('category_id', String(this.defaultCategoryId), {
                    expirationTtl: 86400 // 24 horas
                });
            }

            return this.defaultCategoryId;

        } catch (error) {
            console.error('[Moloni] Error getting/creating category:', error);
            throw new Error('Falha ao obter/criar categoria de produtos: ' + error.message);
        }
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
                const cachedCompanyId = await this.env.MOLONI_TOKENS.get('company_id');

                if (cached && cached.expires_at > Date.now()) {
                    console.log('[Moloni] Using cached token');
                    this.accessToken = cached.access_token;
                    this.refreshToken = cached.refresh_token;
                    this.tokenExpiresAt = cached.expires_at;

                    if (cachedCompanyId) {
                        this.companyId = parseInt(cachedCompanyId);
                        console.log('[Moloni] Using cached company_id:', this.companyId);
                    } else {
                        await this.getCompanyId();
                    }

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

            // Cache token in KV
            if (this.env.MOLONI_TOKENS) {
                await this.env.MOLONI_TOKENS.put('access_token', JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    expires_at: this.tokenExpiresAt
                }), {
                    expirationTtl: data.expires_in
                });
            }

            // Após autenticação, obtém o company_id correto
            await this.getCompanyId();

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

        if (!this.companyId) {
            await this.getCompanyId();
        }

        // Check if token is about to expire
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
            console.log(`[Moloni] Company ID:`, this.companyId);
            console.log(`[Moloni] Body:`, JSON.stringify(bodyData));

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

            const result = JSON.parse(responseText);

            // Verifica se a resposta é um array de erros
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
     * Uses database ID as customer number
     * https://www.moloni.pt/dev/entities/customers/insert/
     */
    async createCustomer(customerData) {
        // Usa o número fornecido (ID da BD) ou gera um baseado no timestamp
        const customerNumber = customerData.numero || `CLI${Date.now().toString().slice(-8)}`;

        return await this.request('customers/insert', {
            vat: customerData.nif || '',
            number: customerNumber, // ID da BD
            name: customerData.nome,
            language_id: 1, // Portuguese
            address: customerData.morada || '',
            zip_code: customerData.codigo_postal || '',
            city: customerData.cidade || '',
            country_id: 1, // Portugal
            email: customerData.email || '',
            phone: customerData.telefone || '',
            notes: customerData.notas || '',
            // Campos obrigatórios
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
     * Search for product by reference (database ID)
     * https://www.moloni.pt/dev/products/products/getall/
     */
    async findProductByReference(reference) {
        try {
            const response = await this.request('products/getAll', {
                reference: reference
            });
            return response && response.length > 0 ? response[0] : null;
        } catch (error) {
            console.error('[Moloni] Error finding product by reference:', error);
            return null;
        }
    }

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
     * Uses database ID as product reference
     * https://www.moloni.pt/dev/products/products/insert/
     */
    async createProduct(productData) {
        const categoryId = await this.getOrCreateProductCategory();

        // Usa o ID do serviço da BD como referência (ex: SERV-3)
        const reference = productData.id
            ? `SERV-${productData.id}`
            : productData.nome
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]/g, '-')
                .toUpperCase()
                .substring(0, 20);

        return await this.request('products/insert', {
            category_id: categoryId,
            type: 2, // Service
            name: productData.nome,
            reference: reference, // ID da BD: SERV-3
            summary: productData.descricao || '',
            unit_id: 1, // Units
            has_stock: 0,
            price: parseFloat(productData.preco),
            exemption_reason: 'M16', // Isento Artigo 16.º do CIVA
            taxes: [
                {
                    tax_id: 3726522, // IVA 23%
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
        const documentSetId = await this.getDocumentSetId();

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
                price: parseFloat(p.price),
                discount: p.discount || 0,
                exemption_reason: 'M16',
                taxes: p.taxes || [
                    {
                        tax_id: 3726522,
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
