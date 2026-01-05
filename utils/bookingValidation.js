/**
 * Booking Validation Utils
 * Regras de negócio para validação de reservas
 * Brooklyn Barbearia
 */

/**
 * IDs de serviços de corte estudante
 * NOTA: Atualizar se IDs mudarem na base de dados
 */
const STUDENT_CUT_IDS = [3, 4];

/**
 * Valida se uma reserva pode ser criada com base nas regras de negócio
 * @param {Object} bookingData - Dados da reserva {servico_id, data_hora, ...}
 * @returns {Object} {valid: boolean, error?: string}
 */
function validateBooking(bookingData) {
    // REGRA 1: Cortes Estudante bloqueados às sextas e sábados
    if (isStudentCut(bookingData.servico_id)) {
        const bookingDate = new Date(bookingData.data_hora);
        
        if (isWeekendDay(bookingDate)) {
            return {
                valid: false,
                error: 'Cortes Estudante não estão disponíveis às sextas-feiras e sábados. Por favor, escolha outro dia da semana ou selecione um corte regular.'
            };
        }
    }

    // REGRA 2: Adicionar futuras regras aqui
    // Exemplo: Horários especiais, feriados, etc.

    return { valid: true };
}

/**
 * Verifica se um serviço é corte estudante
 * @param {number} servicoId - ID do serviço
 * @returns {boolean}
 */
function isStudentCut(servicoId) {
    return STUDENT_CUT_IDS.includes(parseInt(servicoId));
}

/**
 * Verifica se uma data cai numa sexta ou sábado
 * @param {Date} date - Data a verificar
 * @returns {boolean}
 */
function isWeekendDay(date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // 5 = Sexta, 6 = Sábado
}

/**
 * Filtra horários disponíveis removendo slots inválidos
 * @param {Array} availableSlots - Array de slots disponíveis
 * @param {number} servicoId - ID do serviço
 * @returns {Array} Slots filtrados
 */
function filterAvailableSlots(availableSlots, servicoId) {
    if (!isStudentCut(servicoId)) {
        return availableSlots; // Não é corte estudante, retornar todos os slots
    }

    // Filtrar slots de sexta e sábado para cortes estudante
    return availableSlots.filter(slot => {
        const slotDate = new Date(slot.data_hora || slot);
        return !isWeekendDay(slotDate);
    });
}

/**
 * Obtém dias bloqueados para um serviço específico
 * @param {number} servicoId - ID do serviço
 * @returns {Array} Array de números de dias da semana bloqueados (0-6)
 */
function getBlockedDaysForService(servicoId) {
    if (isStudentCut(servicoId)) {
        return [5, 6]; // Sexta e sábado bloqueados
    }
    return [];
}

module.exports = {
    validateBooking,
    isStudentCut,
    isWeekendDay,
    filterAvailableSlots,
    getBlockedDaysForService,
    STUDENT_CUT_IDS
};
