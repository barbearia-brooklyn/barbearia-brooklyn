/**
 * Brooklyn Barbearia - Moloni Integration
 * Handles invoice generation with Moloni API
 * 
 * TODO: Implementar integração real com Moloni API
 */

class MoloniIntegration {
    constructor() {
        this.apiEndpoint = '/api/moloni/create-invoice';
        this.isConfigured = false;
    }

    /**
     * Show invoice modal with client and service data
     * Currently displays data only - invoice generation to be implemented
     */
    showInvoiceModal(reserva, cliente, servico) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'moloniInvoiceModal';

        const nifDisplay = cliente.nif 
            ? `<div class="detail-row"><strong>NIF:</strong> ${cliente.nif}</div>`
            : '<div class="detail-row alert-warning">⚠️ Cliente não tem NIF registado</div>';

        modal.innerHTML = `
            <div class="modal-content modal-invoice">
                <div class="modal-header">
                    <h3>📋 Dados para Faturação</h3>
                    <button class="modal-close" onclick="window.moloniIntegration.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="invoice-section">
                        <h4>Cliente</h4>
                        <div class="detail-row">
                            <strong>Nome:</strong> ${this.escapeHtml(cliente.nome)}
                        </div>
                        ${nifDisplay}
                        ${cliente.email ? `<div class="detail-row"><strong>Email:</strong> ${this.escapeHtml(cliente.email)}</div>` : ''}
                        ${cliente.telefone ? `<div class="detail-row"><strong>Telefone:</strong> ${cliente.telefone}</div>` : ''}
                    </div>

                    <div class="invoice-section">
                        <h4>Serviço</h4>
                        <div class="detail-row">
                            <strong>Descrição:</strong> ${this.escapeHtml(servico.nome)}
                        </div>
                        <div class="detail-row">
                            <strong>Valor:</strong> €${parseFloat(servico.preco).toFixed(2)}
                        </div>
                        <div class="detail-row">
                            <strong>IVA (23%):</strong> €${(parseFloat(servico.preco) * 0.23).toFixed(2)}
                        </div>
                        <div class="detail-row" style="font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
                            <strong>Total:</strong> €${(parseFloat(servico.preco) * 1.23).toFixed(2)}
                        </div>
                    </div>

                    <div class="alert-info" style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                        <strong>🚧 Integração Moloni em Desenvolvimento</strong>
                        <p style="margin: 10px 0 0 0; color: #666;">
                            A funcionalidade de geração automática de faturas estará disponível em breve.
                            Por agora, pode copiar estes dados e emitir a fatura manualmente no portal Moloni.
                        </p>
                    </div>

                    ${!cliente.nif ? `
                    <div class="alert-warning" style="margin-top: 10px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <strong>⚠️ Nota:</strong> Cliente sem NIF. Para emitir fatura com NIF, edite os dados do cliente primeiro.
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.moloniIntegration.closeModal()">
                        Fechar
                    </button>
                    <button class="btn btn-primary" onclick="window.moloniIntegration.copyToClipboard(${JSON.stringify({cliente, servico}).replace(/"/g, '&quot;')})">
                        📋 Copiar Dados
                    </button>
                    ${cliente.nif ? `
                    <button class="btn btn-primary" disabled title="Em breve">
                        📧 Gerar Fatura (Em breve)
                    </button>
                    ` : `
                    <button class="btn btn-secondary" onclick="alert('⚠️ Cliente não tem NIF. Adicione o NIF para emitir fatura.')">
                        ⚠️ Adicionar NIF
                    </button>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    /**
     * Copy client and service data to clipboard
     */
    copyToClipboard(data) {
        const text = `
DADOS PARA FATURAÇÃO

Cliente: ${data.cliente.nome}
NIF: ${data.cliente.nif || 'N/D'}
Email: ${data.cliente.email || 'N/D'}
Telefone: ${data.cliente.telefone || 'N/D'}

Serviço: ${data.servico.nome}
Valor: €${parseFloat(data.servico.preco).toFixed(2)}
IVA (23%): €${(parseFloat(data.servico.preco) * 0.23).toFixed(2)}
Total: €${(parseFloat(data.servico.preco) * 1.23).toFixed(2)}
        `.trim();

        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Dados copiados para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            // Fallback: show text in alert for manual copy
            prompt('Copie os dados abaixo:', text);
        });
    }

    /**
     * Generate invoice via Moloni API (to be implemented)
     */
    async generateInvoice(reserva, cliente, servico) {
        // TODO: Implement actual Moloni API integration
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({
                    cliente,
                    servico,
                    reserva_id: reserva.id
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar fatura');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Erro ao gerar fatura:', error);
            throw error;
        }
    }

    closeModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
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

console.log('✅ Moloni Integration stub loaded');
