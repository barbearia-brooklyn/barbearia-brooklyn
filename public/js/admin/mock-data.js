// Mock Data para Admin Dashboard
// Enquanto backend endpoints não estão implementados

const mockData = {
  barbeiros: [
    { id: 1, nome: 'Gui', email: 'gui@brooklyn.pt', phone: '912345678', ativo: true },
    { id: 2, nome: 'Bruno', email: 'bruno@brooklyn.pt', phone: '987654321', ativo: true },
    { id: 3, nome: 'João', email: 'joao@brooklyn.pt', phone: '965432109', ativo: true }
  ],

  servicos: [
    { id: 1, nome: 'Corte de Cabelo', duracao: 30, preco: 15 },
    { id: 2, nome: 'Barba', duracao: 20, preco: 10 },
    { id: 3, nome: 'Corte + Barba', duracao: 45, preco: 25 },
    { id: 4, nome: 'Design de Barba', duracao: 30, preco: 20 }
  ],

  reservations: [
    {
      id: 1,
      cliente: 'José Silva',
      barbeiro_id: 1,
      servico_id: 3,
      data: '2025-12-24',
      hora: '10:00',
      duracao: 45,
      preco: 25,
      status: 'confirmada',
      telefone: '912345678',
      email: 'jose@gmail.com',
      notificacao_email: true,
      notificacao_lembrete: true
    },
    {
      id: 2,
      cliente: 'Carlos Santos',
      barbeiro_id: 2,
      servico_id: 2,
      data: '2025-12-24',
      hora: '10:30',
      duracao: 20,
      preco: 10,
      status: 'pendente',
      telefone: '987654321',
      email: 'carlos@gmail.com',
      notificacao_email: true,
      notificacao_lembrete: false
    },
    {
      id: 3,
      cliente: 'Maria Oliveira',
      barbeiro_id: 3,
      servico_id: 1,
      data: '2025-12-24',
      hora: '11:00',
      duracao: 30,
      preco: 15,
      status: 'confirmada',
      telefone: '965432109',
      email: 'maria@gmail.com',
      notificacao_email: true,
      notificacao_lembrete: true
    },
    {
      id: 4,
      cliente: 'André Martins',
      barbeiro_id: 1,
      servico_id: 4,
      data: '2025-12-24',
      hora: '11:45',
      duracao: 30,
      preco: 20,
      status: 'confirmada',
      telefone: '934567890',
      email: 'andre@gmail.com',
      notificacao_email: false,
      notificacao_lembrete: true
    },
    {
      id: 5,
      cliente: 'Roberto Costa',
      barbeiro_id: 2,
      servico_id: 3,
      data: '2025-12-25',
      hora: '10:00',
      duracao: 45,
      preco: 25,
      status: 'pendente',
      telefone: '956789012',
      email: 'roberto@gmail.com',
      notificacao_email: true,
      notificacao_lembrete: true
    },
    {
      id: 6,
      cliente: 'Tiago Neves',
      barbeiro_id: 3,
      servico_id: 2,
      data: '2025-12-25',
      hora: '14:00',
      duracao: 20,
      preco: 10,
      status: 'confirmada',
      telefone: '945678901',
      email: 'tiago@gmail.com',
      notificacao_email: true,
      notificacao_lembrete: false
    }
  ],

  unavailableTimes: [
    {
      id: 1,
      barbeiro_id: 1,
      data: '2025-12-24',
      hora_inicio: '12:00',
      hora_fim: '13:00',
      motivo: 'Almoço',
      duracao: 60
    },
    {
      id: 2,
      barbeiro_id: 2,
      data: '2025-12-24',
      hora_inicio: '12:30',
      hora_fim: '13:30',
      motivo: 'Reunião',
      duracao: 60
    },
    {
      id: 3,
      barbeiro_id: 1,
      data: '2025-12-25',
      hora_inicio: '12:00',
      hora_fim: '14:00',
      motivo: 'Folga',
      duracao: 120
    }
  ],

  clientes: [
    {
      id: 1,
      nome: 'José Silva',
      telefone: '912345678',
      email: 'jose@gmail.com',
      data_criacao: '2025-10-01',
      total_reservas: 5,
      ultima_reserva: '2025-12-24'
    },
    {
      id: 2,
      nome: 'Carlos Santos',
      telefone: '987654321',
      email: 'carlos@gmail.com',
      data_criacao: '2025-09-15',
      total_reservas: 3,
      ultima_reserva: '2025-12-24'
    },
    {
      id: 3,
      nome: 'Maria Oliveira',
      telefone: '965432109',
      email: 'maria@gmail.com',
      data_criacao: '2025-11-20',
      total_reservas: 2,
      ultima_reserva: '2025-12-24'
    },
    {
      id: 4,
      nome: 'André Martins',
      telefone: '934567890',
      email: 'andre@gmail.com',
      data_criacao: '2025-08-10',
      total_reservas: 8,
      ultima_reserva: '2025-12-24'
    },
    {
      id: 5,
      nome: 'Roberto Costa',
      telefone: '956789012',
      email: 'roberto@gmail.com',
      data_criacao: '2025-07-05',
      total_reservas: 12,
      ultima_reserva: '2025-12-25'
    }
  ]
};

// Exportar para uso global
window.mockData = mockData;