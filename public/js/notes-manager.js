/**
 * Brooklyn Barbearia - Notes Manager
 * Sistema unificado de gestão de notas públicas e privadas
 */

class NotesManager {
    constructor() {
        this.container = null;
        this.user = null;
        this.publicNotes = [];
        this.privateNote = '';
    }

    /**
     * Inicializar sistema de notas para barbeiros/admin
     * @param {string} containerSelector - Seletor CSS do container
     * @param {object} user - Objeto com {nome, role}
     * @param {string} existingPublicNotes - Notas públicas existentes
     * @param {string} existingPrivateNote - Nota privada existente
     */
    initBarbeiroNotes(containerSelector, user, existingPublicNotes = '', existingPrivateNote = '') {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Container não encontrado:', containerSelector);
            return;
        }

        this.user = user;
        this.parseExistingNotes(existingPublicNotes);
        this.privateNote = existingPrivateNote;

        this.renderBarbeiroUI();
    }

    /**
     * Inicializar sistema de notas para clientes
     * @param {string} containerSelector - Seletor CSS do container
     * @param {object} user - Objeto com {nome}
     * @param {string} existingPublicNotes - Notas públicas existentes
     */
    initClientNotes(containerSelector, user, existingPublicNotes = '') {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Container não encontrado:', containerSelector);
            return;
        }

        this.user = user;
        this.parseExistingNotes(existingPublicNotes);

        this.renderClientUI();
    }

    /**
     * Parse notas existentes do formato "Nome: texto\n..."
     */
    parseExistingNotes(notesText) {
        if (!notesText || notesText.trim() === '') {
            this.publicNotes = [];
            return;
        }

        const lines = notesText.split('\n').filter(line => line.trim() !== '');
        this.publicNotes = lines.map(line => {
            const match = line.match(/^(.+?):\s*(.+)$/);
            if (match) {
                return {
                    author: match[1].trim(),
                    text: match[2].trim()
                };
            }
            return {
                author: 'Desconhecido',
                text: line.trim()
            };
        });
    }

    /**
     * Renderizar UI para barbeiros/admin
     */
    renderBarbeiroUI() {
        let html = `
            <div class="notes-section">
                <div class="notes-header">
                    <label>Notas Públicas</label>
                    <button type="button" class="btn-add-note" onclick="window.notesManager.addNote()">
                        <i class="fas fa-plus"></i> Adicionar Nota
                    </button>
                </div>
                <div class="notes-list" id="notes-list">
        `;

        if (this.publicNotes.length === 0) {
            html += '<p class="notes-empty">Sem notas</p>';
        } else {
            this.publicNotes.forEach((note, index) => {
                html += `
                    <div class="note-item">
                        <div class="note-content">
                            <strong>${this.escapeHtml(note.author)}:</strong>
                            ${this.escapeHtml(note.text)}
                        </div>
                        <button type="button" class="btn-remove-note" onclick="window.notesManager.removeNote(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
        }

        html += `
                </div>
                
                <div class="notes-header" style="margin-top: 20px;">
                    <label>Nota Privada (apenas admin/barbeiros)</label>
                </div>
                <textarea id="private-note-input" class="form-control" rows="2" 
                          placeholder="Nota privada visível apenas para staff...">${this.escapeHtml(this.privateNote)}</textarea>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Renderizar UI para clientes
     */
    renderClientUI() {
        let html = `
            <div class="notes-section">
                <div class="notes-header">
                    <label>Comentários</label>
                    <button type="button" class="btn-add-note" onclick="window.notesManager.addNote()">
                        <i class="fas fa-plus"></i> Adicionar Comentário
                    </button>
                </div>
                <div class="notes-list" id="notes-list">
        `;

        if (this.publicNotes.length === 0) {
            html += '<p class="notes-empty">Sem comentários</p>';
        } else {
            this.publicNotes.forEach((note, index) => {
                html += `
                    <div class="note-item">
                        <div class="note-content">
                            <strong>${this.escapeHtml(note.author)}:</strong>
                            ${this.escapeHtml(note.text)}
                        </div>
                        <button type="button" class="btn-remove-note" onclick="window.notesManager.removeNote(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Adicionar nova nota
     */
    addNote() {
        const text = prompt('Digite a nota:');
        if (!text || text.trim() === '') return;

        const author = this.user?.role === 'admin' || this.user?.role === 'barbeiro' 
            ? 'Barbearia Brooklyn' 
            : this.user?.nome || 'Cliente';

        this.publicNotes.push({
            author: author,
            text: text.trim()
        });

        this.refresh();
    }

    /**
     * Remover nota pelo índice
     */
    removeNote(index) {
        if (confirm('Remover esta nota?')) {
            this.publicNotes.splice(index, 1);
            this.refresh();
        }
    }

    /**
     * Refresh UI
     */
    refresh() {
        if (this.user?.role === 'admin' || this.user?.role === 'barbeiro') {
            this.renderBarbeiroUI();
        } else {
            this.renderClientUI();
        }
    }

    /**
     * Obter notas públicas formatadas
     * @returns {string} Notas no formato "Nome: texto\n..."
     */
    getPublicNotes() {
        if (this.publicNotes.length === 0) return '';
        return this.publicNotes.map(note => `${note.author}: ${note.text}`).join('\n');
    }

    /**
     * Obter nota privada
     * @returns {string}
     */
    getPrivateNote() {
        const input = document.getElementById('private-note-input');
        return input ? input.value.trim() : this.privateNote;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar instância global
window.notesManager = new NotesManager();

console.log('✅ Notes Manager loaded');
