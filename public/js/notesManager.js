/**
 * Notes Manager - Sistema de gestão de notas para reservas
 * Suporta notas de cliente e notas privadas de barbeiro
 */

class NotesManager {
    constructor() {
        this.currentUser = null;
    }

    /**
     * Inicializar sistema de notas para clientes
     * @param {string} containerSelector - Seletor do container onde adicionar o sistema
     * @param {string} userName - Nome do utilizador
     * @param {string} existingComments - Comentários existentes
     */
    initClientNotes(containerSelector, userName, existingComments = '') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Container não encontrado:', containerSelector);
            return;
        }

        const html = `
            <div class="notes-section">
                <div class="notes-header">
                    <label>Notas</label>
                    <button type="button" class="btn-small btn-add-note" id="addClientNote" title="Adicionar nota">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="notes-container" id="clientNotesContainer" style="display: ${existingComments ? 'block' : 'none'};">
                    <div class="notes-list" id="clientNotesList">${this.renderNotes(existingComments, false)}</div>
                    <div class="note-input-wrapper" id="clientNoteInput" style="display: none;">
                        <textarea class="form-control" id="newClientNoteText" rows="2" placeholder="Escreva a sua nota..."></textarea>
                        <div class="note-actions">
                            <button type="button" class="btn-small btn-primary" id="saveClientNote">
                                <i class="fas fa-check"></i> Guardar
                            </button>
                            <button type="button" class="btn-small btn-secondary" id="cancelClientNote">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        document.getElementById('addClientNote').addEventListener('click', () => {
            document.getElementById('clientNotesContainer').style.display = 'block';
            document.getElementById('clientNoteInput').style.display = 'block';
            document.getElementById('newClientNoteText').focus();
        });

        document.getElementById('saveClientNote').addEventListener('click', () => {
            const text = document.getElementById('newClientNoteText').value.trim();
            if (text) {
                this.addNote(userName, text, 'client');
            }
        });

        document.getElementById('cancelClientNote').addEventListener('click', () => {
            document.getElementById('clientNoteInput').style.display = 'none';
            document.getElementById('newClientNoteText').value = '';
            // Esconder container se não houver notas
            const notesList = document.getElementById('clientNotesList');
            if (!notesList.children.length) {
                document.getElementById('clientNotesContainer').style.display = 'none';
            }
        });
    }

    /**
     * Inicializar sistema de notas para barbeiros/admin
     * @param {string} containerSelector - Seletor do container
     * @param {object} user - Objeto do utilizador {nome, role}
     * @param {string} existingComments - Comentários públicos existentes
     * @param {string} existingPrivateNote - Nota privada existente
     */
    initBarbeiroNotes(containerSelector, user, existingComments = '', existingPrivateNote = '') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Container não encontrado:', containerSelector);
            return;
        }

        this.currentUser = user;
        const displayName = user.role === 'admin' ? 'Barbearia Brooklyn' : user.nome;

        const html = `
            <div class="notes-section">
                <div class="notes-header">
                    <label>Notas</label>
                    <div class="notes-header-actions">
                        <button type="button" class="btn-small btn-add-note" id="addBarbeiroNote" title="Adicionar nota">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Menu de tipo de nota -->
                <div class="note-type-menu" id="noteTypeMenu" style="display: none;">
                    <button type="button" class="note-type-option" data-type="client">
                        <i class="fas fa-comment"></i> Nota para o Cliente
                    </button>
                    <button type="button" class="note-type-option" data-type="private">
                        <i class="fas fa-lock"></i> Nota Privada
                    </button>
                </div>

                <div class="notes-container" id="barbeiroNotesContainer" style="display: ${existingComments || existingPrivateNote ? 'block' : 'none'};">
                    <!-- Notas públicas -->
                    <div class="public-notes-section" id="publicNotesSection" style="display: ${existingComments ? 'block' : 'none'};">
                        <h5 class="notes-subsection-title"><i class="fas fa-comment"></i> Notas para o Cliente</h5>
                        <div class="notes-list" id="barbeiroNotesList">${this.renderNotes(existingComments, false)}</div>
                    </div>

                    <!-- Nota privada -->
                    <div class="private-note-section" id="privateNoteSection" style="display: ${existingPrivateNote ? 'block' : 'none'};">
                        <h5 class="notes-subsection-title"><i class="fas fa-lock"></i> Nota Privada (apenas barbeiros)</h5>
                        <div class="note-private-display" id="privateNoteDisplay">
                            <p>${existingPrivateNote || ''}</p>
                            <button type="button" class="btn-small" id="editPrivateNote">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>

                    <!-- Input de nova nota -->
                    <div class="note-input-wrapper" id="barbeiroNoteInput" style="display: none;">
                        <textarea class="form-control" id="newBarbeiroNoteText" rows="2" placeholder="Escreva a nota..."></textarea>
                        <input type="hidden" id="currentNoteType" value="">
                        <div class="note-actions">
                            <button type="button" class="btn-small btn-primary" id="saveBarbeiroNote">
                                <i class="fas fa-check"></i> Guardar
                            </button>
                            <button type="button" class="btn-small btn-secondary" id="cancelBarbeiroNote">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event Listeners
        document.getElementById('addBarbeiroNote').addEventListener('click', () => {
            const menu = document.getElementById('noteTypeMenu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        document.querySelectorAll('.note-type-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                document.getElementById('noteTypeMenu').style.display = 'none';
                document.getElementById('barbeiroNotesContainer').style.display = 'block';
                document.getElementById('barbeiroNoteInput').style.display = 'block';
                document.getElementById('currentNoteType').value = type;
                document.getElementById('newBarbeiroNoteText').placeholder = 
                    type === 'client' ? 'Nota visível para o cliente...' : 'Nota privada (apenas barbeiros)...';
                document.getElementById('newBarbeiroNoteText').focus();
            });
        });

        document.getElementById('saveBarbeiroNote')?.addEventListener('click', () => {
            const text = document.getElementById('newBarbeiroNoteText').value.trim();
            const type = document.getElementById('currentNoteType').value;
            if (text) {
                this.addNote(displayName, text, type);
            }
        });

        document.getElementById('cancelBarbeiroNote')?.addEventListener('click', () => {
            this.cancelNoteInput('barbeiro');
        });

        document.getElementById('editPrivateNote')?.addEventListener('click', () => {
            const currentText = document.querySelector('#privateNoteDisplay p').textContent;
            document.getElementById('barbeiroNoteInput').style.display = 'block';
            document.getElementById('currentNoteType').value = 'private';
            document.getElementById('newBarbeiroNoteText').value = currentText;
            document.getElementById('newBarbeiroNoteText').focus();
        });
    }

    /**
     * Renderizar notas existentes
     * @param {string} notesText - Texto com notas formatadas
     * @param {boolean} editable - Se as notas são editáveis
     */
    renderNotes(notesText, editable = false) {
        if (!notesText) return '';

        // Parse notas no formato "Nome: 'texto';"
        const notePattern = /([^:]+):\s*'([^']+)';?/g;
        const notes = [];
        let match;

        while ((match = notePattern.exec(notesText)) !== null) {
            notes.push({
                author: match[1].trim(),
                text: match[2].trim()
            });
        }

        if (notes.length === 0) {
            // Se não está no formato estruturado, mostrar como texto simples
            return `<div class="note-item">
                <p>${this.escapeHtml(notesText)}</p>
            </div>`;
        }

        return notes.map((note, index) => `
            <div class="note-item" data-index="${index}">
                <div class="note-author">${this.escapeHtml(note.author)}</div>
                <div class="note-text">${this.escapeHtml(note.text)}</div>
                ${editable ? `<button type="button" class="btn-small note-edit" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>` : ''}
            </div>
        `).join('');
    }

    /**
     * Adicionar nova nota
     * @param {string} author - Nome do autor
     * @param {string} text - Texto da nota
     * @param {string} type - Tipo: 'client' (pública) ou 'private'
     */
    addNote(author, text, type) {
        if (type === 'private') {
            // Nota privada - substituir nota existente
            const display = document.querySelector('#privateNoteDisplay p');
            display.textContent = text;
            document.getElementById('privateNoteSection').style.display = 'block';
            
            // Atualizar campo hidden para submissão
            const hiddenField = document.getElementById('booking-private-note') || this.createHiddenField('booking-private-note');
            hiddenField.value = text;
        } else {
            // Nota pública - adicionar à lista
            const formattedNote = `${author}: '${text}';`;
            const container = document.getElementById('clientNotesList') || document.getElementById('barbeiroNotesList');
            
            // Pegar notas existentes
            const hiddenField = document.getElementById('booking-comments') || this.createHiddenField('booking-comments');
            const existingNotes = hiddenField.value || '';
            
            // Adicionar nova nota
            hiddenField.value = existingNotes ? `${existingNotes} ${formattedNote}` : formattedNote;
            
            // Re-renderizar
            container.innerHTML = this.renderNotes(hiddenField.value, false);
            
            // Mostrar seção pública se estava oculta
            if (document.getElementById('publicNotesSection')) {
                document.getElementById('publicNotesSection').style.display = 'block';
            }
        }

        // Limpar input
        this.cancelNoteInput(type === 'client' ? 'client' : 'barbeiro');
    }

    /**
     * Cancelar input de nota
     */
    cancelNoteInput(context) {
        const inputId = context === 'client' ? 'clientNoteInput' : 'barbeiroNoteInput';
        const textId = context === 'client' ? 'newClientNoteText' : 'newBarbeiroNoteText';
        
        document.getElementById(inputId).style.display = 'none';
        document.getElementById(textId).value = '';
        
        if (context === 'barbeiro') {
            document.getElementById('currentNoteType').value = '';
        }
    }

    /**
     * Criar campo hidden se não existir
     */
    createHiddenField(id) {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.id = id;
        document.querySelector('form').appendChild(field);
        return field;
    }

    /**
     * Obter valor das notas públicas
     */
    getPublicNotes() {
        const field = document.getElementById('booking-comments');
        return field ? field.value : '';
    }

    /**
     * Obter valor da nota privada
     */
    getPrivateNote() {
        const field = document.getElementById('booking-private-note');
        return field ? field.value : '';
    }

    /**
     * Escape HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Exportar instância global
window.notesManager = new NotesManager();
console.log('✅ Notes Manager loaded');
