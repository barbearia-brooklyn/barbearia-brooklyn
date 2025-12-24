/**
 * Init.js - Inicialização das páginas do Admin Dashboard
 * VERSÃO MOCK DATA - Sem chamadas à API
 */

class AdminDashboard {
  constructor() {
    // Verificar se mockData está disponível
    if (!window.mockData) {
      console.error('Mock data não carregado!');
      return;
    }

    this.mockData = window.mockData;
    this.currentPage = this.detectCurrentPage();
    this.init();
  }

  detectCurrentPage() {
    const pathname = window.location.pathname;
    if (pathname.includes('dashboard')) return 'dashboard';
    if (pathname.includes('calendar')) return 'calendar';
    if (pathname.includes('reservations')) return 'reservations';
    if (pathname.includes('unavailable')) return 'unavailable';
    if (pathname.includes('new-booking')) return 'new-booking';
    return 'dashboard';
  }

  async init() {
    try {
      // Carregar header
      await this.loadHeader();
      
      // Inicializar página específica
      await this.initPage();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  async loadHeader() {
    const headerContainer = document.getElementById('admin-header');
    if (!headerContainer) return;

    // Header simples sem API
    headerContainer.innerHTML = `
      <div class="admin-header">
        <div class="header-left">
          <h2>🏪 Brooklyn Barbearia - Admin</h2>
        </div>
        <div class="header-right">
          <nav class="header-nav">
            <a href="/admin/dashboard.html" class="nav-link ${this.currentPage === 'dashboard' ? 'active' : ''}">🏗️ Dashboard</a>
            <a href="/admin/calendar.html" class="nav-link ${this.currentPage === 'calendar' ? 'active' : ''}">📅 Calendário</a>
            <a href="/admin/reservations.html" class="nav-link ${this.currentPage === 'reservations' ? 'active' : ''}">📋 Reservas</a>
            <a href="/admin/unavailable.html" class="nav-link ${this.currentPage === 'unavailable' ? 'active' : ''}">🚫 Indisponibilidades</a>
            <a href="/admin/new-booking.html" class="nav-link ${this.currentPage === 'new-booking' ? 'active' : ''}">➕ Nova Reserva</a>
          </nav>
        </div>
      </div>
    `;

    // Adicionar CSS inline para o header
    if (!document.getElementById('header-styles')) {
      const style = document.createElement('style');
      style.id = 'header-styles';
      style.textContent = `
        .admin-header {
          background: linear-gradient(135deg, #218089, #32b8c6);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
        .header-left h2 {
          color: white;
          margin: 0;
          font-size: 20px;
        }
        .header-nav {
          display: flex;
          gap: 12px;
        }
        .nav-link {
          color: white;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background 0.2s;
          font-size: 14px;
          font-weight: 500;
        }
        .nav-link:hover {
          background: rgba(255,255,255,0.2);
        }
        .nav-link.active {
          background: rgba(255,255,255,0.3);
        }
        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  async initPage() {
    // Não fazer nada - os managers específicos já fazem a inicialização
    console.log(`Página ${this.currentPage} carregada com mockData`);
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.mockData) {
      new AdminDashboard();
    } else {
      console.error('Mock data não disponível. Certifique-se que mock-data.js está carregado antes de init.js');
    }
  });
} else {
  if (window.mockData) {
    new AdminDashboard();
  } else {
    console.error('Mock data não disponível. Certifique-se que mock-data.js está carregado antes de init.js');
  }
}
