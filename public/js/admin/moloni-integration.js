/**
 * Brooklyn Barbearia - Moloni Integration
 * Handles invoice generation with Moloni API
 */

class MoloniIntegration {
    constructor() {
        this.apiEndpoint = '/api/admin/moloni/create-invoice';
        this.currentModal = null;
        this.currentData = null;
        this.availableServices = [];
    }

    /**
     * Load available services from database
     */
    async loadServices() {
        try {
            const response = await fetch('/api/api_servicos');
            
            if (response.ok) {
                const data = await response.json();
                // api_servicos returns array directly
                this.availableServices = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    /**
     * Show invoice modal with client and service data
     */
    async showInvoiceModal(reserva, cliente, servico) {
        // Load services if not loaded
        if (this.availableServices.length === 0) {
            await this.loadServices();
        }

        this.currentData = { reserva, cliente, servico };
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'moloniInvoiceModal';

        // Safe NIF check
        const nifValue = cliente.nif ? String(cliente.nif).trim() : '';
        const hasNif = nifValue !== '';

        modal.innerHTML = `
            <div class="modal-content modal-invoice" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>📋 Criar Fatura Moloni</h3>
                    <button class="modal-close" onclick="window.moloniIntegration.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="invoice-section">
                        <div class="detail-row" style="margin-bottom: 15px;">
                            <strong>Cliente:</strong> ${this.escapeHtml(cliente.nome)}
                        </div>
                        
                        <div class="form-group">
                            <label for="invoiceNif">
                                <strong>NIF ${hasNif ? '' : '(opcional)'}</strong>
                            </label>
                            <input 
                                type="text" 
                                id="invoiceNif" 
                                class="form-control" 
                                value="${nifValue}" 
                                placeholder="999999999"
                                maxlength="9"
                                pattern="[0-9]{9}"
                            >
                            <small style="color: #666; display: block; margin-top: 5px;">
                                💡 Deixe vazio para fatura sem NIF (consumidor final)
                            </small>
                        </div>

                        ${!hasNif ? `
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="saveNifCheckbox" checked>
                                <span>Guardar NIF no perfil do cliente</span>
                            </label>
                        </div>
                        ` : ''}
                    </div>

                    <div class="invoice-section">
                        <h4>Serviços</h4>
                        <small style="color: #666; display: block; margin-bottom: 10px;">
                            💡 Selecione um ou mais serviços para faturar
                        </small>
                        
                        <div id="servicesList" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                            ${this.availableServices.map(s => `
                                <label style="display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" 
                                       onmouseover="this.style.background='#f8f9fa'" 
                                       onmouseout="this.style.background='transparent'">
                                    <input 
                                        type="checkbox" 
                                        class="service-checkbox" 
                                        value="${s.id}" 
                                        data-price="${s.preco}"
                                        ${s.id === servico.id ? 'checked' : ''}
                                        onchange="window.moloniIntegration.updateTotals()"
                                    >
                                    <span style="flex: 1;">${this.escapeHtml(s.nome)}</span>
                                    <strong style="color: #28a745;">€${parseFloat(s.preco).toFixed(2)}</strong>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #ddd;">
                            <div class="detail-row" style="color: #666; margin-bottom: 8px;">
                                <strong>Subtotal (sem IVA):</strong> 
                                <span id="invoiceSubtotal">€0.00</span>
                            </div>
                            <div class="detail-row" style="color: #666; margin-bottom: 12px;">
                                <strong>IVA (23%):</strong> 
                                <span id="invoiceVat">€0.00</span>
                            </div>
                            <div class="detail-row" style="font-size: 1.3em; padding-top: 12px; border-top: 1px solid #ddd;">
                                <strong>Total:</strong> 
                                <span id="invoiceTotal" style="color: #28a745;">€0.00</span>
                            </div>
                            <small style="color: #999; display: block; margin-top: 10px; font-style: italic;">
                                💡 Preços já incluem IVA
                            </small>
                        </div>
                    </div>

                    <div id="invoiceResult" style="display: none;"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.moloniIntegration.closeModal()">
                        Cancelar
                    </button>
                    <button class="btn btn-primary" id="generateInvoiceBtn" onclick="window.moloniIntegration.createInvoice()">
                        📧 Gerar Fatura
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // Calculate initial totals
        this.updateTotals();

        // Focus NIF field if empty
        if (!hasNif) {
            setTimeout(() => {
                document.getElementById('invoiceNif')?.focus();
            }, 100);
        }
    }

    /**
     * Update totals based on selected services
     */
    updateTotals() {
        const checkboxes = document.querySelectorAll('.service-checkbox:checked');
        
        let totalWithVat = 0;
        checkboxes.forEach(checkbox => {
            totalWithVat += parseFloat(checkbox.dataset.price);
        });

        const totalWithoutVat = totalWithVat / 1.23;
        const vatAmount = totalWithVat - totalWithoutVat;

        const subtotalEl = document.getElementById('invoiceSubtotal');
        const vatEl = document.getElementById('invoiceVat');
        const totalEl = document.getElementById('invoiceTotal');

        if (subtotalEl) subtotalEl.textContent = `€${totalWithoutVat.toFixed(2)}`;
        if (vatEl) vatEl.textContent = `€${vatAmount.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `€${totalWithVat.toFixed(2)}`;
    }

    /**
     * Get selected service IDs
     */
    getSelectedServiceIds() {
        const checkboxes = document.querySelectorAll('.service-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    /**
     * Parse Moloni error and return user-friendly message
     */
    parseMoloniError(errorMessage) {
        // Check for AT connection error
        if (errorMessage.includes('document_set_id') || errorMessage.includes('document_set_wsat_id')) {
            return '⚠️ A faturação está inativa. Por favor, conecte a Moloni com a Autoridade Tributária nas definições da Moloni (Séries de Documentos).';
        }
        
        // Check for product not found
        if (errorMessage.includes('Produto não encontrado') || errorMessage.includes('product_id')) {
            return '⚠️ Um ou mais serviços não estão configurados na Moloni. Por favor, crie os produtos manualmente primeiro.';
        }
        
        // Return original message if no specific pattern found
        return errorMessage;
    }

    /**
     * Validate NIF (Portuguese VAT number)
     */
    validateNif(nif) {
        if (!nif || nif.trim() === '') {
            return true; // Empty is valid (consumidor final)
        }

        nif = nif.trim();
        
        // Must be exactly 9 digits
        if (!/^[0-9]{9}$/.test(nif)) {
            return false;
        }

        // Check if starts with valid prefix
        const validPrefixes = ['1', '2', '3', '5', '6', '8', '9'];
        if (!validPrefixes.includes(nif[0])) {
            return false;
        }

        // Calculate check digit
        const checkDigit = parseInt(nif[8]);
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            sum += parseInt(nif[i]) * (9 - i);
        }
        const mod = sum % 11;
        const calculatedCheck = mod < 2 ? 0 : 11 - mod;

        return checkDigit === calculatedCheck;
    }

    /**
     * Create invoice via API
     */
    async createInvoice() {
        const btn = document.getElementById('generateInvoiceBtn');
        const nifInput = document.getElementById('invoiceNif');
        const saveNifCheckbox = document.getElementById('saveNifCheckbox');
        const resultDiv = document.getElementById('invoiceResult');

        const nif = nifInput?.value?.trim();
        const servicoIds = this.getSelectedServiceIds();

        // Validate at least one service selected
        if (servicoIds.length === 0) {
            alert('❌ Por favor, selecione pelo menos um serviço para faturar.');
            return;
        }

        // Validate NIF if provided
        if (nif && !this.validateNif(nif)) {
            alert('❌ NIF inválido. O NIF deve ter 9 dígitos e ser válido.');
            nifInput?.focus();
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A gerar fatura...';

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({
                    reserva_id: this.currentData.reserva.id,
                    cliente_id: this.currentData.cliente.id,
                    servico_ids: servicoIds,
                    nif: nif || null,
                    save_nif_to_profile: saveNifCheckbox?.checked || false
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error || data.details || 'Erro ao criar fatura';
                throw new Error(errorMsg);
            }

            // Show success message
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="alert-success" style="margin-top: 20px; padding: 15px; background: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #155724;">
                        ✅ Fatura criada com sucesso!
                    </h4>
                    <div style="color: #155724;">
                        <strong>Número:</strong> ${data.document_number}<br>
                        <strong>Serviços:</strong> ${servicoIds.length}<br>
                        <strong>Total:</strong> €${data.pricing.total}
                        ${data.document_url ? `<br><br>
                        <a href="${data.document_url}" target="_blank" class="btn btn-primary" style="display: inline-block; margin-top: 10px;">
                            📎 Ver Fatura PDF
                        </a>` : ''}
                    </div>
                </div>
            `;

            // Update button
            btn.innerHTML = '✅ Fatura Criada';
            btn.disabled = true;

            // Show close button
            setTimeout(() => {
                const footer = this.currentModal.querySelector('.modal-footer');
                footer.innerHTML = `
                    <button class="btn btn-primary" onclick="window.moloniIntegration.closeModal()">
                        Fechar
                    </button>
                `;
            }, 2000);

        } catch (error) {
            console.error('Error creating invoice:', error);
            
            const userFriendlyError = this.parseMoloniError(error.message);
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="alert-danger" style="margin-top: 20px; padding: 15px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #721c24;">
                        ❌ Erro ao criar fatura
                    </h4>
                    <p style="margin: 0; color: #721c24;">
                        ${this.escapeHtml(userFriendlyError)}
                    </p>
                </div>
            `;

            btn.disabled = false;
            btn.innerHTML = '📧 Tentar Novamente';
        }
    }

    closeModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            this.currentData = null;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize global instance
window.moloniIntegration = new MoloniIntegration();

console.log('✅ Moloni Integration loaded');