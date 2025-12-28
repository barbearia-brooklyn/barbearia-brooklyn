/**
 * Brooklyn Barbearia - Moloni Integration
 * Handles invoicing through Moloni API
 */

class MoloniIntegration {
    constructor() {
        this.apiBaseUrl = '/api/moloni';
    }

    /**
     * Show invoice modal for a reservation
     * @param {Object} reserva - Reservation object
     * @param {Object} cliente - Client object with NIF
     * @param {Object} servico - Service object
     */
    async showInvoiceModal(reserva, cliente, servico) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'invoiceModal';

        modal.innerHTML = `
            <div class="modal-content modal-invoice">
                <div class="modal-header">
                    <h3>🧾e Emitir Fatura - Reserva #${reserva.id}</h3>
                    <button class="modal-close" onclick="window.moloniIntegration.closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="invoiceModalBody">
                    ${this.renderInvoiceTypeSelection(cliente, servico)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
        this.currentReserva = reserva;
        this.currentCliente = cliente;
        this.currentServico = servico;
        
        this.setupClickOutsideToClose();
    }

    /**
     * Render invoice type selection (with/without NIF)
     */
    renderInvoiceTypeSelection(cliente, servico) {
        const hasNIF = cliente.nif && cliente.nif.toString().length === 9;
        
        return `
            <div class="invoice-type-selection">
                <div class="invoice-info-box">
                    <p><strong>Cliente:</strong> ${cliente.nome}</p>
                    <p><strong>Serviço:</strong> ${servico.nome}</p>
                    <p><strong>Valor:</strong> €${servico.preco}</p>
                </div>

                <div class="form-group" style="margin-top: 20px;">
                    <label>Tipo de Fatura *</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="invoiceType" value="without_nif" 
                                   onchange="window.moloniIntegration.handleInvoiceTypeChange('without_nif')" checked>
                            <span>📄 Fatura sem Contribuinte</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="invoiceType" value="with_nif" 
                                   onchange="window.moloniIntegration.handleInvoiceTypeChange('with_nif')">
                            <span>📃 Fatura com Contribuinte</span>
                        </label>
                    </div>
                </div>

                <div id="nifSection" style="display: none; margin-top: 20px;">
                    ${hasNIF ? this.renderExistingNIF(cliente.nif) : this.renderNIFInput()}
                </div>

                <div class="modal-footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <button class="btn btn-secondary" onclick="window.moloniIntegration.closeModal()">
                        Cancelar
                    </button>
                    <button id="confirmInvoiceBtn" class="btn btn-primary" onclick="window.moloniIntegration.createInvoice()">
                        <i class="fas fa-file-invoice"></i> Confirmar e Faturar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render existing NIF section
     */
    renderExistingNIF(nif) {
        return `
            <div class="nif-existing">
                <div class="alert-info" style="padding: 15px; background: #e3f2fd; border: 1px solid #2196F3; border-radius: 4px; margin-bottom: 15px;">
                    <p style="margin: 0 0 10px 0;"><strong>ℹ️ NIF Associado ao Cliente:</strong></p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold;">${nif}</p>
                </div>
                
                <div class="form-check" style="margin-top: 15px;">
                    <input type="checkbox" id="changNIF" class="form-check-input" 
                           onchange="window.moloniIntegration.toggleNIFChange(this.checked)">
                    <label for="changeNIF" class="form-check-label">
                        Usar um NIF diferente para esta fatura
                    </label>
                </div>

                <div id="alternativeNIFInput" style="display: none; margin-top: 15px;">
                    ${this.renderNIFInput(true)}
                </div>
            </div>
        `;
    }

    /**
     * Render NIF input field
     */
    renderNIFInput(isAlternative = false) {
        const fieldId = isAlternative ? 'alternativeNIF' : 'newNIF';
        return `
            <div class="form-group">
                <label for="${fieldId}">Número de Contribuinte *</label>
                <input type="text" 
                       id="${fieldId}" 
                       class="form-control" 
                       placeholder="123456789" 
                       maxlength="9" 
                       pattern="[0-9]{9}"
                       required>
                <small style="color: #666; display: block; margin-top: 5px;">
                    ℹ️ Introduza um NIF válido com 9 dígitos
                </small>
            </div>

            ${!isAlternative ? `
            <div class="form-check" style="margin-top: 15px;">
                <input type="checkbox" id="saveNIFToProfile" class="form-check-input" checked>
                <label for="saveNIFToProfile" class="form-check-label">
                    💾 Quer associar este NIF ao perfil do cliente?
                </label>
                <small style="display: block; margin-top: 5px; color: #666;">
                    Se selecionado, este NIF ficará guardado e será usado automaticamente em futuras faturas.
                </small>
            </div>
            ` : ''}
        `;
    }

    /**
     * Handle invoice type change (with/without NIF)
     */
    handleInvoiceTypeChange(type) {
        const nifSection = document.getElementById('nifSection');
        if (type === 'with_nif') {
            nifSection.style.display = 'block';
        } else {
            nifSection.style.display = 'none';
        }
    }

    /**
     * Toggle NIF change option
     */
    toggleNIFChange(show) {
        const alternativeInput = document.getElementById('alternativeNIFInput');
        if (alternativeInput) {
            alternativeInput.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Validate NIF format
     */
    validateNIF(nif) {
        if (!nif || nif.length !== 9) return false;
        if (!/^[0-9]{9}$/.test(nif)) return false;
        
        // Simple checksum validation for Portuguese NIF
        const digits = nif.split('').map(Number);
        const checksum = digits[0] * 9 + digits[1] * 8 + digits[2] * 7 + 
                        digits[3] * 6 + digits[4] * 5 + digits[5] * 4 + 
                        digits[6] * 3 + digits[7] * 2;
        const remainder = checksum % 11;
        const checkDigit = remainder < 2 ? 0 : 11 - remainder;
        
        return checkDigit === digits[8];
    }

    /**
     * Create invoice through Moloni API
     */
    async createInvoice() {
        try {
            const btn = document.getElementById('confirmInvoiceBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar fatura...';

            // Get selected invoice type
            const invoiceType = document.querySelector('input[name="invoiceType"]:checked')?.value;
            
            let nif = null;
            let saveToProfile = false;

            if (invoiceType === 'with_nif') {
                // Check if using existing NIF or new one
                const useAlternative = document.getElementById('changeNIF')?.checked;
                
                if (useAlternative) {
                    nif = document.getElementById('alternativeNIF')?.value;
                } else if (this.currentCliente.nif) {
                    nif = this.currentCliente.nif.toString();
                } else {
                    nif = document.getElementById('newNIF')?.value;
                    saveToProfile = document.getElementById('saveNIFToProfile')?.checked || false;
                }

                // Validate NIF
                if (!nif || !this.validateNIF(nif)) {
                    alert('❌ NIF inválido. Por favor introduza um NIF válido com 9 dígitos.');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-file-invoice"></i> Confirmar e Faturar';
                    return;
                }
            }

            // Prepare invoice data
            const invoiceData = {
                reserva_id: this.currentReserva.id,
                cliente_id: this.currentCliente.id,
                servico_id: this.currentServico.id,
                nif: nif,
                save_nif_to_profile: saveToProfile,
                valor: this.currentServico.preco,
                descricao: this.currentServico.nome,
                data: this.currentReserva.data_hora
            };

            // Call API to create invoice
            const response = await fetch(`${this.apiBaseUrl}/create-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(invoiceData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao criar fatura');
            }

            const result = await response.json();

            this.closeModal();
            
            // Show success message with invoice details
            alert(`✅ Fatura criada com sucesso!\n\nNúmero: ${result.document_number || 'N/A'}\nValor: €${this.currentServico.preco}`);
            
            // Reload calendar if callback exists
            if (window.modalManager && window.modalManager.onSaveCallback) {
                window.modalManager.onSaveCallback();
            }

        } catch (error) {
            console.error('Error creating invoice:', error);
            alert(`❌ Erro ao criar fatura: ${error.message}`);
            
            const btn = document.getElementById('confirmInvoiceBtn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-file-invoice"></i> Confirmar e Faturar';
            }
        }
    }

    /**
     * Setup click outside to close
     */
    setupClickOutsideToClose() {
        if (!this.currentModal) return;

        const handleClick = (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        };

        this.currentModal._clickHandler = handleClick;
        this.currentModal.addEventListener('click', handleClick);
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.currentModal) {
            if (this.currentModal._clickHandler) {
                this.currentModal.removeEventListener('click', this.currentModal._clickHandler);
            }
            this.currentModal.remove();
            this.currentModal = null;
        }
        this.currentReserva = null;
        this.currentCliente = null;
        this.currentServico = null;
    }
}

// Initialize global instance
window.moloniIntegration = new MoloniIntegration();

console.log('✅ Moloni Integration loaded');