/**
 * Brooklyn Barbearia - Moloni Integration
 * Handles invoice generation with Moloni API
 */

class MoloniIntegration {
    constructor() {
        this.apiEndpoint = '/api/admin/moloni/create-invoice';
        this.currentModal = null;
        this.currentData = null;
    }

    /**
     * Show invoice modal with client and service data
     */
    showInvoiceModal(reserva, cliente, servico) {
        this.currentData = { reserva, cliente, servico };
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'moloniInvoiceModal';

        const subtotal = parseFloat(servico.preco);
        const vat = subtotal * 0.23;
        const total = subtotal + vat;

        // Safe NIF check
        const nifValue = cliente.nif ? String(cliente.nif).trim() : '';
        const hasNif = nifValue !== '';

        modal.innerHTML = `
            <div class="modal-content modal-invoice">
                <div class="modal-header">
                    <h3>📋 Criar Fatura Moloni</h3>
                    <button class="modal-close" onclick="window.moloniIntegration.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="invoice-section">
                        <h4>Cliente</h4>
                        <div class="detail-row">
                            <strong>Nome:</strong> ${this.escapeHtml(cliente.nome)}
                        </div>
                        ${cliente.email ? `<div class="detail-row"><strong>Email:</strong> ${this.escapeHtml(cliente.email)}</div>` : ''}
                        ${cliente.telefone ? `<div class="detail-row"><strong>Telefone:</strong> ${cliente.telefone}</div>` : ''}
                        
                        <div class="form-group" style="margin-top: 15px;">
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
                        <h4>Serviço</h4>
                        <div class="detail-row">
                            <strong>Descrição:</strong> ${this.escapeHtml(servico.nome)}
                        </div>
                        <div class="detail-row">
                            <strong>Subtotal:</strong> €${subtotal.toFixed(2)}
                        </div>
                        <div class="detail-row">
                            <strong>IVA (23%):</strong> €${vat.toFixed(2)}
                        </div>
                        <div class="detail-row" style="font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
                            <strong>Total com IVA:</strong> €${total.toFixed(2)}
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

        // Focus NIF field if empty
        if (!hasNif) {
            setTimeout(() => {
                document.getElementById('invoiceNif')?.focus();
            }, 100);
        }
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
                    servico_id: this.currentData.servico.id,
                    nif: nif || null,
                    save_nif_to_profile: saveNifCheckbox?.checked || false
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Erro ao criar fatura');
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
                        <strong>Total:</strong> €${data.total}
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
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="alert-danger" style="margin-top: 20px; padding: 15px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #721c24;">
                        ❌ Erro ao criar fatura
                    </h4>
                    <p style="margin: 0; color: #721c24;">
                        ${this.escapeHtml(error.message)}
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
