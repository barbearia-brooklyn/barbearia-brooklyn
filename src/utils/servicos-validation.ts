/**
 * Validação de Serviços - Brooklyn Barbearia
 * 
 * REGRAS DE NEGÓCIO:
 * - Cortes Estudante (IDs 3 e 4) NÃO podem ser reservados às Sextas e Sábados
 * - Razão: Maximizar receita em dias de maior procura
 */

export const SERVICOS_ESTUDANTE_IDS = [3, 4];

export const DIAS_BLOQUEIO_ESTUDANTE = [5, 6]; // Sexta e Sábado

export interface ServicoValidationResult {
    disponivel: boolean;
    motivo?: string;
}

/**
 * Verifica se um serviço estudante está disponível numa determinada data
 * @param servicoId - ID do serviço
 * @param data - Data da reserva (string ISO ou Date)
 * @returns {ServicoValidationResult} Resultado da validação
 */
export function isServicoEstudanteDisponivel(
    servicoId: number,
    data: string | Date
): ServicoValidationResult {
    // Se não é serviço estudante, sempre disponível
    if (!SERVICOS_ESTUDANTE_IDS.includes(servicoId)) {
        return { disponivel: true };
    }

    const dataReserva = typeof data === 'string' ? new Date(data) : data;
    const diaSemana = dataReserva.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado

    // Se é sexta (5) ou sábado (6), bloquear
    if (DIAS_BLOQUEIO_ESTUDANTE.includes(diaSemana)) {
        return {
            disponivel: false,
            motivo: 'Cortes estudante não disponíveis às sextas e sábados'
        };
    }

    return { disponivel: true };
}

/**
 * Obtém mensagem de erro personalizada para serviços bloqueados
 * @param servicoId - ID do serviço
 * @param data - Data da reserva
 * @returns {string} Mensagem de erro ou string vazia
 */
export function getMotivoBloqueio(servicoId: number, data: string | Date): string {
    const result = isServicoEstudanteDisponivel(servicoId, data);
    return result.motivo || '';
}

/**
 * Filtra horários disponíveis removendo dias bloqueados para serviços estudante
 * @param servicoId - ID do serviço
 * @param horariosDisponiveis - Array de datas disponíveis
 * @returns {Date[]} Horários filtrados
 */
export function filtrarHorariosEstudante(
    servicoId: number,
    horariosDisponiveis: Date[]
): Date[] {
    // Se não é serviço estudante, retornar todos
    if (!SERVICOS_ESTUDANTE_IDS.includes(servicoId)) {
        return horariosDisponiveis;
    }

    // Filtrar removendo sextas e sábados
    return horariosDisponiveis.filter(horario => {
        const diaSemana = horario.getDay();
        return !DIAS_BLOQUEIO_ESTUDANTE.includes(diaSemana);
    });
}

/**
 * Valida se uma reserva pode ser criada com base nas regras de serviços
 * @param servicoId - ID do serviço
 * @param dataHora - Data e hora da reserva
 * @throws {Error} Se a reserva não for permitida
 */
export function validarReservaServico(servicoId: number, dataHora: string | Date): void {
    const result = isServicoEstudanteDisponivel(servicoId, dataHora);
    
    if (!result.disponivel) {
        throw new Error(result.motivo || 'Serviço não disponível para esta data');
    }
}

/**
 * Obtém nome do dia da semana em português
 * @param diaSemana - Número do dia (0-6)
 * @returns {string} Nome do dia
 */
export function getNomeDiaSemana(diaSemana: number): string {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[diaSemana] || '';
}

/**
 * Verifica se uma data é fim de semana (sexta ou sábado para este contexto)
 * @param data - Data a verificar
 * @returns {boolean} True se é sexta ou sábado
 */
export function isFimDeSemana(data: string | Date): boolean {
    const dataCheck = typeof data === 'string' ? new Date(data) : data;
    const diaSemana = dataCheck.getDay();
    return DIAS_BLOQUEIO_ESTUDANTE.includes(diaSemana);
}

console.log('✅ Servicos Validation loaded (Bloqueio Estudante: Sexta + Sábado)');
