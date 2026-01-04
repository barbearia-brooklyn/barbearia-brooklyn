/**
 * Notes Manager - Sistema conversacional de notas para reservas
 * Formato: Array JSON de mensagens [{author, text, timestamp}]
 */

class NotesManager {
    constructor() {
        this.currentUser = null;
        this.notes = [];
        this.isClient = false;
    }

    /**
     * Inicializar sistema de notas para clientes
     * @param {string} containerSelector - Seletor do container
     * @param {object} user - Objeto do utilizador {nome}
     * @param {string} existingComments - Comentários existentes (JSON ou formato antigo)
     */
    initClientNotes(containerSelector, user, existingComments = '') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Container não encontrado:', containerSelector);
            return;
        }

        // FIX: Usar user.nome em vez do objeto completo
        this.currentUser = typeof user === 'string' ? user : (user?.nome || 'Cliente');
        this.isClient = true;
        this.notes = this.parseNotes(existingComments);

        this.renderClientUI(container);
        this.setupClientEvents();
    }

    /**
     * Inicializar sistema de notas para barbeiros/admin
     * @param {string} containerSelector - Seletor do container
     * @param {object} user - Objeto do utilizador {nome, role}
     * @param {string} existingComments - Comentários existentes
     * @param {string} existingPrivateNote - Nota privada existente
     */
    initBarbeiroNotes(containerSelector, user, existingComments = '', existingPrivateNote = '') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Container não encontrado:', containerSelector);
            return;
        }

        // FIX: Usar user.nome corretamente
        this.currentUser = user?.role === 'admin' ? 'Barbearia Brooklyn' : (user?.nome || 'Barbeiro');
        this.isClient = false;
        this.notes = this.parseNotes(existingComments);
        this.privateNote = existingPrivateNote || '';

        this.renderBarbeiroUI(container);
        this.setupBarbeiroEvents();
    }

    /**
     * Parse notas - retrocompatível com formato antigo
     * @param {string} notesData - JSON array ou formato antigo "Nome: 'texto';"
     * @returns {Array} Array de notas [{author, text, timestamp}]
     */
    parseNotes(notesData) {
        if (!notesData) return [];

        try {
            // Tentar parse JSON primeiro
            const parsed = JSON.parse(notesData);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // Não é JSON, tentar formato antigo
            const notes = [];
            const pattern = /([^:]+):\s*'([^']+)';?/g;
            let match;

            while ((match = pattern.exec(notesData)) !== null) {
                notes.push({
                    author: match[1].trim(),
                    text: match[2].trim(),
                    timestamp: new Date().toISOString()
                });
            }

            if (notes.length > 0) return notes;

            // Se não conseguiu parse, retornar como nota única
            if (notesData.trim()) {
                return [{
                    author: 'Sistema',
                    text: notesData.trim(),
                    timestamp: new Date().toISOString()
                }];
            }
        }

        return [];
    }

    /**
     * Renderizar UI para clientes
     */
    renderClientUI(container) {
        const hasNotes = this.notes.length > 0;

        const html = `
            <div class="notes-section">
                <div class="notes-header">
                    <label>💬 Conversa com a Barbearia</label>
                    <button type="button" class="btn-small btn-add-note" id="addClientNote" title="Adicionar mensagem">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
                <div class="notes-container" id="clientNotesContainer" style="display: ${hasNotes ? 'block' : 'none'};">
                    <div class="notes-conversation" id="clientNotesList">
                        ${this.renderConversation()}
                    </div>
                </div>
                <div class="note-input-wrapper" id="clientNoteInput" style="display: none;">
                    <textarea class="form-control" id="newClientNoteText" rows="2" placeholder="Escreva a sua mensagem..."></textarea>
                    <input type="hidden" id="editingNoteIndex" value="-1">
                    <div class="note-actions">
                        <button type="button" class="btn-small btn-primary" id="saveClientNote">
                            <i class="fas fa-check"></i> <span id="saveClientNoteLabel">Guardar</span>
                        </button>
                        <button type="button" class="btn-small btn-secondary" id="cancelClientNote">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.updateHiddenField();
    }

    /**
     * Renderizar UI para barbeiros
     */
    renderBarbeiroUI(container) {
        const hasNotes = this.notes.length > 0;
        const hasPrivateNote = this.privateNote.trim() !== '';

        const html = `
            <div class="notes-section">
                <div class="notes-header">
                    <label>💬 Notas da Reserva</label>
                    <button type="button" class="btn-small btn-add-note" id="addBarbeiroNote" title="Adicionar nota">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
                
                <!-- Menu tipo de nota -->
                <div class="note-type-menu" id="noteTypeMenu" style="display: none;">
                    <button type="button" class="note-type-option" data-type="public">
                        <i class="fas fa-comment"></i> Nota para o Cliente
                    </button>
                    <button type="button" class="note-type-option" data-type="private">
                        <i class="fas fa-lock"></i> Nota Privada
                    </button>
                </div>

                <!-- Notas públicas -->
                <div id="publicNotesSection" style="display: ${hasNotes ? 'block' : 'none'};">
                    <h5 class="notes-subsection-title"><i class="fas fa-comment"></i> Conversa com o Cliente</h5>
                    <div class="notes-conversation" id="barbeiroNotesList">
                        ${this.renderConversation()}
                    </div>
                </div>

                <!-- Nota privada -->
                <div id="privateNoteSection" style="display: ${hasPrivateNote ? 'block' : 'none'};">
                    <h5 class="notes-subsection-title"><i class="fas fa-lock"></i> Nota Privada</h5>
                    <div class="note-private-box">
                        <p id="privateNoteDisplay">${this.escapeHtml(this.privateNote)}</p>
                        <button type="button" class="btn-small" id="editPrivateNoteBtn">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </div>
                </div>

                <!-- Input -->
                <div class="note-input-wrapper" id="barbeiroNoteInput" style="display: none;">
                    <textarea class="form-control" id="newBarbeiroNoteText" rows="2" placeholder="Escreva a nota..."></textarea>
                    <input type="hidden" id="currentNoteType" value="">
                    <input type="hidden" id="editingNoteIndex" value="-1">
                    <div class="note-actions">
                        <button type="button" class="btn-small btn-primary" id="saveBarbeiroNote">
                            <i class="fas fa-check"></i> <span id="saveBarbeiroNoteLabel">Guardar</span>
                        </button>
                        <button type="button" class="btn-small btn-secondary" id="cancelBarbeiroNote">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.updateHiddenFields();
    }

    /**
     * Renderizar conversa (estilo chat)
     */
    renderConversation() {
        if (this.notes.length === 0) return '<p class="no-notes">Sem mensagens</p>';

        return this.notes.map((note, index) => {
            const isOwnNote = note.author === this.currentUser;
            const canEdit = this.isClient ? isOwnNote : true; // Barbeiros podem editar todas

            const timestamp = new Date(note.timestamp);
            const timeStr = timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
            const dateStr = timestamp.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });

            return `
                <div class="note-message ${isOwnNote ? 'own-message' : 'other-message'}" data-index="${index}">
                    <div class="note-message-header">
                        <span class="note-author">${this.escapeHtml(note.author)}</span>
                        <span class="note-timestamp">${dateStr} ${timeStr}</span>
                    </div>
                    <div class="note-message-body">
                        <p>${this.escapeHtml(note.text)}</p>
                        ${canEdit ? `
                            <div class="note-message-actions">
                                <button type="button" class="btn-icon edit-note-btn" data-index="${index}" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn-icon delete-note-btn" data-index="${index}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Setup eventos do cliente
     */
    setupClientEvents() {
        document.getElementById('addClientNote')?.addEventListener('click', () => {
            document.getElementById('clientNotesContainer').style.display = 'block';
            document.getElementById('clientNoteInput').style.display = 'block';
            document.getElementById('newClientNoteText').focus();
        });

        document.getElementById('saveClientNote')?.addEventListener('click', () => {
            const text = document.getElementById('newClientNoteText').value.trim();
            const editIndex = parseInt(document.getElementById('editingNoteIndex').value);
            
            if (text) {
                if (editIndex >= 0) {
                    this.editNote(editIndex, text);
                } else {
                    this.addNote(text);
                }
                this.cancelInput('client');
                this.refreshConversation('client');
            }
        });

        document.getElementById('cancelClientNote')?.addEventListener('click', () => {
            this.cancelInput('client');
        });

        // Delegação para botões de editar/eliminar
        document.getElementById('clientNotesList')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-note-btn');
            const deleteBtn = e.target.closest('.delete-note-btn');

            if (editBtn) {
                const index = parseInt(editBtn.dataset.index);
                this.startEditNote(index, 'client');
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                if (confirm('Eliminar esta mensagem?')) {
                    this.deleteNote(index);
                    this.refreshConversation('client');
                }
            }
        });
    }

    /**
     * Setup eventos do barbeiro
     */
    setupBarbeiroEvents() {
        document.getElementById('addBarbeiroNote')?.addEventListener('click', () => {
            const menu = document.getElementById('noteTypeMenu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        document.querySelectorAll('.note-type-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                document.getElementById('noteTypeMenu').style.display = 'none';
                document.getElementById('barbeiroNoteInput').style.display = 'block';
                document.getElementById('currentNoteType').value = type;
                document.getElementById('newBarbeiroNoteText').placeholder = 
                    type === 'public' ? 'Mensagem para o cliente...' : 'Nota privada (apenas barbeiros)...';
                document.getElementById('newBarbeiroNoteText').focus();
            });
        });

        document.getElementById('saveBarbeiroNote')?.addEventListener('click', () => {
            const text = document.getElementById('newBarbeiroNoteText').value.trim();
            const type = document.getElementById('currentNoteType').value;
            const editIndex = parseInt(document.getElementById('editingNoteIndex').value);

            if (!text) return;

            if (type === 'private') {
                this.privateNote = text;
                document.getElementById('privateNoteDisplay').textContent = text;
                document.getElementById('privateNoteSection').style.display = 'block';
                this.updateHiddenFields();
            } else {
                if (editIndex >= 0) {
                    this.editNote(editIndex, text);
                } else {
                    this.addNote(text);
                }
                this.refreshConversation('barbeiro');
            }

            this.cancelInput('barbeiro');
        });

        document.getElementById('cancelBarbeiroNote')?.addEventListener('click', () => {
            this.cancelInput('barbeiro');
        });

        document.getElementById('editPrivateNoteBtn')?.addEventListener('click', () => {
            document.getElementById('barbeiroNoteInput').style.display = 'block';
            document.getElementById('currentNoteType').value = 'private';
            document.getElementById('newBarbeiroNoteText').value = this.privateNote;
            document.getElementById('newBarbeiroNoteText').focus();
        });

        // Delegação para editar/eliminar
        document.getElementById('barbeiroNotesList')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-note-btn');
            const deleteBtn = e.target.closest('.delete-note-btn');

            if (editBtn) {
                const index = parseInt(editBtn.dataset.index);
                this.startEditNote(index, 'barbeiro');
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                if (confirm('Eliminar esta mensagem?')) {
                    this.deleteNote(index);
                    this.refreshConversation('barbeiro');
                }
            }
        });
    }

    /**
     * Adicionar nova nota
     */
    addNote(text) {
        this.notes.push({
            author: this.currentUser,
            text: text,
            timestamp: new Date().toISOString()
        });
        this.updateHiddenField();
        this.updateHiddenFields();
    }

    /**
     * Editar nota existente
     */
    editNote(index, newText) {
        if (this.notes[index]) {
            this.notes[index].text = newText;
            this.notes[index].timestamp = new Date().toISOString();
            this.updateHiddenField();
            this.updateHiddenFields();
        }
    }

    /**
     * Eliminar nota
     */
    deleteNote(index) {
        this.notes.splice(index, 1);
        this.updateHiddenField();
        this.updateHiddenFields();
    }

    /**
     * Iniciar edição de nota
     */
    startEditNote(index, context) {
        const note = this.notes[index];
        if (!note) return;

        const inputId = context === 'client' ? 'clientNoteInput' : 'barbeiroNoteInput';
        const textId = context === 'client' ? 'newClientNoteText' : 'newBarbeiroNoteText';
        const labelId = context === 'client' ? 'saveClientNoteLabel' : 'saveBarbeiroNoteLabel';

        document.getElementById(inputId).style.display = 'block';
        document.getElementById(textId).value = note.text;
        document.getElementById('editingNoteIndex').value = index;
        document.getElementById(labelId).textContent = 'Atualizar';
        document.getElementById(textId).focus();

        if (context === 'barbeiro') {
            document.getElementById('currentNoteType').value = 'public';
        }
    }

    /**
     * Cancelar input
     */
    cancelInput(context) {
        const inputId = context === 'client' ? 'clientNoteInput' : 'barbeiroNoteInput';
        const textId = context === 'client' ? 'newClientNoteText' : 'newBarbeiroNoteText';
        const labelId = context === 'client' ? 'saveClientNoteLabel' : 'saveBarbeiroNoteLabel';

        document.getElementById(inputId).style.display = 'none';
        document.getElementById(textId).value = '';
        document.getElementById('editingNoteIndex').value = '-1';
        document.getElementById(labelId).textContent = 'Guardar';

        if (context === 'barbeiro') {
            document.getElementById('currentNoteType').value = '';
        }

        // Esconder container se vazio
        if (this.notes.length === 0) {
            const containerId = context === 'client' ? 'clientNotesContainer' : 'publicNotesSection';
            document.getElementById(containerId).style.display = 'none';
        }
    }

    /**
     * Refresh conversa
     */
    refreshConversation(context) {
        const listId = context === 'client' ? 'clientNotesList' : 'barbeiroNotesList';
        const sectionId = context === 'client' ? 'clientNotesContainer' : 'publicNotesSection';
        
        const list = document.getElementById(listId);
        if (list) {
            list.innerHTML = this.renderConversation();
        }

        if (this.notes.length > 0) {
            document.getElementById(sectionId).style.display = 'block';
        }
    }

    /**
     * Atualizar campo hidden (formato novo: JSON array)
     */
    updateHiddenField() {
        const field = document.getElementById('booking-comments') || 
                      document.getElementById('edit-booking-comments');
        if (field) {
            field.value = JSON.stringify(this.notes);
        }
    }

    /**
     * Atualizar campos hidden (barbeiro)
     */
    updateHiddenFields() {
        // Campo público
        const publicField = document.getElementById('booking-comments') || 
                           document.getElementById('edit-booking-comments');
        if (publicField) {
            publicField.value = JSON.stringify(this.notes);
        }

        // Campo privado
        const privateField = document.getElementById('booking-private-note') ||
                            document.getElementById('edit-booking-private-note');
        if (privateField) {
            privateField.value = this.privateNote;
        }
    }

    /**
     * Obter notas públicas (formato JSON)
     */
    getPublicNotes() {
        return JSON.stringify(this.notes);
    }

    /**
     * Obter nota privada
     */
    getPrivateNote() {
        return this.privateNote || '';
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

// Exportar instância global
window.notesManager = new NotesManager();
console.log('✅ Notes Manager v2 loaded (Conversational System)');
