/**
 * Validação de Serviços - Brooklyn Barbearia (Frontend)
 * 
 * REGRAS DE NEGÓCIO:
 * - Cortes Estudante (IDs 3 e 4) NÃO podem ser reservados às Sextas e Sábados
 * - Razão: Maximizar receita em dias de maior procura
 * 
 * SINCRONIZADO COM: src/utils/servicos-validation.ts
 */

const ServicosValidation = {
    SERVICOS_ESTUDANTE_IDS: [3, 4],
    DIAS_BLOQUEIO_ESTUDANTE: [5, 6], // Sexta e Sábado

    /**
     * Verifica se um serviço estudante está disponível numa determinada data
     * @param {number} servicoId - ID do serviço
     * @param {string|Date} data - Data da reserva
     * @returns {boolean} True se disponível
     */
    isServicoDisponivel(servicoId, data) {
        // Se não é serviço estudante, sempre disponível
        if (!this.SERVICOS_ESTUDANTE_IDS.includes(servicoId)) {
            return true;
        }

        const dataReserva = typeof data === 'string' ? new Date(data) : data;
        const diaSemana = dataReserva.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado

        // Se é sexta (5) ou sábado (6), bloquear
        if (this.DIAS_BLOQUEIO_ESTUDANTE.includes(diaSemana)) {
            return false;
        }

        return true;
    },

    /**
     * Obtém mensagem de bloqueio para o utilizador
     * @param {number} servicoId - ID do serviço
     * @param {string|Date} data - Data da reserva
     * @returns {string} Mensagem de erro ou string vazia
     */
    getMotivoBloqueio(servicoId, data) {
        if (this.isServicoDisponivel(servicoId, data)) {
            return '';
        }

        if (this.SERVICOS_ESTUDANTE_IDS.includes(servicoId)) {
            return 'Cortes estudante não disponíveis às sextas e sábados. Por favor, escolha outro dia.';
        }

        return 'Serviço não disponível para esta data';
    },

    /**
     * Filtra horários disponíveis removendo dias bloqueados
     * @param {number} servicoId - ID do serviço
     * @param {Array} horariosDisponiveis - Array de strings ISO ou Date
     * @returns {Array} Horários filtrados
     */
    filtrarHorarios(servicoId, horariosDisponiveis) {
        // Se não é serviço estudante, retornar todos
        if (!this.SERVICOS_ESTUDANTE_IDS.includes(servicoId)) {
            return horariosDisponiveis;
        }

        // Filtrar removendo sextas e sábados
        return horariosDisponiveis.filter(horario => {
            const data = typeof horario === 'string' ? new Date(horario) : horario;
            const diaSemana = data.getDay();
            return !this.DIAS_BLOQUEIO_ESTUDANTE.includes(diaSemana);
        });
    },

    /**
     * Verifica se uma data é fim de semana (sexta ou sábado)
     * @param {string|Date} data - Data a verificar
     * @returns {boolean} True se é sexta ou sábado
     */
    isFimDeSemana(data) {
        const dataCheck = typeof data === 'string' ? new Date(data) : data;
        const diaSemana = dataCheck.getDay();
        return this.DIAS_BLOQUEIO_ESTUDANTE.includes(diaSemana);
    },

    /**
     * Obtém nome do dia da semana
     * @param {number} diaSemana - Número do dia (0-6)
     * @returns {string} Nome do dia
     */
    getNomeDiaSemana(diaSemana) {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return dias[diaSemana] || '';
    },

    /**
     * Validação completa com mensagem de alerta
     * @param {number} servicoId - ID do serviço
     * @param {string|Date} dataHora - Data e hora da reserva
     * @returns {boolean} True se válido
     */
    validarComAlerta(servicoId, dataHora) {
        if (!this.isServicoDisponivel(servicoId, dataHora)) {
            const motivo = this.getMotivoBloqueio(servicoId, dataHora);
            alert('❌ ' + motivo);
            return false;
        }
        return true;
    },

    /**
     * Adiciona badge visual em dias bloqueados no calendário
     * @param {number} servicoId - ID do serviço
     * @param {HTMLElement} elementoDia - Elemento do dia no calendário
     * @param {Date} data - Data do dia
     */
    marcarDiaBloqueado(servicoId, elementoDia, data) {
        if (!this.isServicoDisponivel(servicoId, data)) {
            elementoDia.classList.add('dia-bloqueado-estudante');
            elementoDia.title = 'Cortes estudante não disponíveis neste dia';
            
            // Adicionar badge visual
            const badge = document.createElement('span');
            badge.className = 'badge-bloqueado';
            badge.innerHTML = '🚫';
            badge.style.cssText = 'position: absolute; top: 2px; right: 2px; font-size: 0.7rem;';
            elementoDia.style.position = 'relative';
            elementoDia.appendChild(badge);
        }
    }
};

// Disponibilizar globalmente
window.ServicosValidation = ServicosValidation;

console.log('✅ Servicos Validation (Frontend) loaded - Bloqueio Estudante: Sexta + Sábado');
