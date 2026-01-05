/**
 * Brooklyn Barbearia - Notes Manager
 * Sistema conversacional de gestão de notas para reservas
 * Suporta notas públicas (visíveis para clientes) e notas privadas (apenas barbeiros/admin)
 */

class NotesManager {
    constructor() {
        this.currentContainer = null;
        this.currentUser = null;
        this.isCompactMode = false;
    }

    /**
     * Inicializa o sistema de notas para barbeiros/admin
     * @param {string} containerSelector - Seletor CSS do container (#notes-container-new, etc.)
     * @param {object} user - Objeto do utilizador logado {nome, role}
     * @param {string} existingComments - Comentários públicos existentes (JSON ou string)
     * @param {string} existingPrivateNote - Nota privada existente
     * @param {boolean} compactMode - Se true, modo visualização apenas (sem edição)
     */
    initBarbeiroNotes(containerSelector, user, existingComments = '', existingPrivateNote = '', compactMode = false) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`Container ${containerSelector} não encontrado`);
            return;
        }

        this.currentContainer = container;
        this.currentUser = user;
        this.isCompactMode = compactMode;

        // Parse existing comments
        let comments = [];
        if (existingComments) {
            try {
                const parsed = JSON.parse(existingComments);
                comments = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                // Não é JSON, é string simples
                if (existingComments.trim()) {
                    comments = [{ author: 'Cliente', text: existingComments, timestamp: new Date().toISOString() }];
                }
            }
        }

        if (compactMode) {
            this.renderCompactView(container, comments, existingPrivateNote);
        } else {
            this.renderFullEditor(container, comments, existingPrivateNote);
        }
    }

    /**
     * Renderiza vista compacta (só visualização) para modal de detalhes
     */
    renderCompactView(container, comments, privateNote) {
        let html = '';

        // Notas públicas
        if (comments.length > 0) {
            html += `
                <div class="notes-section-compact">
                    <div class="notes-header-compact">
                        <i class="fas fa-comments"></i>
                        <strong>Comentários</strong>
                    </div>
                    <div class="notes-list-compact">
            `;
            
            comments.forEach(comment => {
                const avatar = this.getAvatar(comment.author || 'Cliente');
                const time = comment.timestamp ? this.formatTime(comment.timestamp) : '';
                html += `
                    <div class="note-item-compact">
                        <div class="note-avatar">${avatar}</div>
                        <div class="note-content">
                            <div class="note-author">${comment.author || 'Cliente'} ${time ? `<span class="note-time">${time}</span>` : ''}</div>
                            <div class="note-text">${this.escapeHtml(comment.text)}</div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        // Nota privada
        if (privateNote && privateNote.trim()) {
            html += `
                <div class="notes-section-compact notes-private">
                    <div class="notes-header-compact">
                        <i class="fas fa-lock"></i>
                        <strong>Nota Privada</strong>
                        <span class="note-badge">Só Barbeiros</span>
                    </div>
                    <div class="note-private-content">
                        ${this.escapeHtml(privateNote)}
                    </div>
                </div>
            `;
        }

        // Se não há notas nenhumas
        if (comments.length === 0 && (!privateNote || !privateNote.trim())) {
            html = `
                <div class="notes-empty-compact">
                    <i class="fas fa-comment-slash"></i>
                    <span>Sem comentários ou notas</span>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Renderiza editor completo (para nova reserva / edição)
     */
    renderFullEditor(container, comments, privateNote) {
        let html = `
            <div class="notes-editor-full">
                <!-- Comentários Públicos -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-comments"></i> Comentários Públicos
                        <span class="note-badge note-badge-public">Visível para Cliente</span>
                    </label>
                    <div id="publicCommentsDisplay" class="notes-display">
        `;

        if (comments.length > 0) {
            comments.forEach((comment, index) => {
                const avatar = this.getAvatar(comment.author || 'Cliente');
                const time = comment.timestamp ? this.formatTime(comment.timestamp) : '';
                html += `
                    <div class="note-item">
                        <div class="note-avatar">${avatar}</div>
                        <div class="note-content">
                            <div class="note-author">${comment.author || 'Cliente'} ${time ? `<span class="note-time">${time}</span>` : ''}</div>
                            <div class="note-text">${this.escapeHtml(comment.text)}</div>
                        </div>
                        <button type="button" class="note-remove" onclick="window.notesManager.removeComment(${index})" title="Remover">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
        } else {
            html += '<div class="notes-empty">Sem comentários</div>';
        }

        html += `
                    </div>
                    <div class="notes-input-group">
                        <textarea id="newPublicComment" 
                                  class="form-control" 
                                  rows="2" 
                                  placeholder="Adicionar comentário público (visível para o cliente)..."></textarea>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="window.notesManager.addComment()">
                            <i class="fas fa-plus"></i> Adicionar
                        </button>
                    </div>
                </div>

                <!-- Nota Privada -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-lock"></i> Nota Privada
                        <span class="note-badge note-badge-private">Só Barbeiros/Admin</span>
                    </label>
                    <textarea id="privateNoteInput" 
                              class="form-control" 
                              rows="3" 
                              placeholder="Nota privada (visível apenas para barbeiros e admin)...">${privateNote || ''}</textarea>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
        // Guardar comentários atuais
        container.dataset.comments = JSON.stringify(comments);
    }

    /**
     * Adiciona novo comentário público
     */
    addComment() {
        const input = document.getElementById('newPublicComment');
        const text = input?.value?.trim();
        
        if (!text) {
            alert('Por favor, escreva um comentário');
            return;
        }

        // Parse comentários atuais
        let comments = [];
        try {
            comments = JSON.parse(this.currentContainer.dataset.comments || '[]');
        } catch (e) {
            comments = [];
        }

        // Adicionar novo comentário
        comments.push({
            author: this.currentUser?.nome || 'Admin',
            text: text,
            timestamp: new Date().toISOString()
        });

        // Atualizar dataset
        this.currentContainer.dataset.comments = JSON.stringify(comments);

        // Re-renderizar
        const privateNote = document.getElementById('privateNoteInput')?.value || '';
        this.renderFullEditor(this.currentContainer, comments, privateNote);
    }

    /**
     * Remove comentário por índice
     */
    removeComment(index) {
        let comments = [];
        try {
            comments = JSON.parse(this.currentContainer.dataset.comments || '[]');
        } catch (e) {
            comments = [];
        }

        comments.splice(index, 1);
        this.currentContainer.dataset.comments = JSON.stringify(comments);

        const privateNote = document.getElementById('privateNoteInput')?.value || '';
        this.renderFullEditor(this.currentContainer, comments, privateNote);
    }

    /**
     * Obtém notas públicas em formato JSON
     * @returns {string} JSON string ou string vazia
     */
    getPublicNotes() {
        if (!this.currentContainer) return '';

        let comments = [];
        try {
            comments = JSON.parse(this.currentContainer.dataset.comments || '[]');
        } catch (e) {
            comments = [];
        }

        // ✨ Bug #2 FIX: Retornar string vazia se não houver comentários
        if (comments.length === 0) {
            return '';
        }

        return JSON.stringify(comments);
    }

    /**
     * Obtém nota privada
     * @returns {string} Nota privada ou string vazia
     */
    getPrivateNote() {
        const input = document.getElementById('privateNoteInput');
        const value = input?.value?.trim() || '';
        
        // ✨ Bug #4 FIX: Retornar null se vazio (para não guardar string vazia na BD)
        return value || '';
    }

    /**
     * Formata timestamp para exibição
     */
    formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'agora';
            if (diffMins < 60) return `há ${diffMins}min`;
            if (diffHours < 24) return `há ${diffHours}h`;
            if (diffDays < 7) return `há ${diffDays}d`;
            
            return date.toLocaleDateString('pt-PT');
        } catch (e) {
            return '';
        }
    }

    /**
     * Obtém avatar com base no nome
     */
    getAvatar(name) {
        if (!name) return '👤';
        
        const firstChar = name.charAt(0).toUpperCase();
        const colors = [
            '#0f7e44', '#2d4a3e', '#1a5f3a', '#26734d', '#0d6b3d',
            '#3d8b5f', '#2a6547', '#1e5438', '#34775a', '#0a5e35'
        ];
        
        const colorIndex = firstChar.charCodeAt(0) % colors.length;
        const color = colors[colorIndex];
        
        return `<div class="avatar-circle" style="background: ${color};">${firstChar}</div>`;
    }

    /**
     * Escape HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
}

// Inicializar instância global
window.notesManager = new NotesManager();

console.log('✅ Notes Manager loaded');
