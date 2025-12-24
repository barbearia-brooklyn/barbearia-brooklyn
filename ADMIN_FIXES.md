# Brooklyn Barbearia - Admin Panel Fixes & Cleanup

## 🎯 Objetivo
Restruturação completa do painel administrativo com limpeza de código, correção de bugs e organização da estrutura.

## ✅ Correções Implementadas

### 1. **Login Corrigido**
- ✅ Removida dependência de UIHelper inexistente
- ✅ CSS inline para garantir renderização correta
- ✅ Feedback visual melhorado (spinner, mensagens de sucesso/erro)
- ✅ Integração com Cloudflare Turnstile mantida
- ✅ `auth.js` agora é standalone (sem dependências externas)

### 2. **Cliente API Centralizado**
- ✅ Criado `api.js` que centraliza TODAS as chamadas de API
- ✅ Endpoints corrigidos para corresponder ao backend:
  - `/api/admin/api_admin_login` - Login
  - `/api/admin/api_admin_reservas` - Reservas (CRUD)
  - `/api/admin/api_horarios_indisponiveis` - Horários (CRUD)
  - `/api/barbeiros` - Barbeiros
  - `/api/servicos` - Serviços
- ✅ Gestão automática de autenticação (JWT tokens)
- ✅ Redirect automático em caso de 401
- ✅ Tratamento de erros centralizado

### 3. **Calendário Moderno**
- ✅ Criado `calendar-modern.js` com duas vistas:
  - **Vista Geral**: Grid com todos barbeiros (colunas) e horários (linhas)
  - **Vista Individual**: Calendário semanal de um barbeiro
- ✅ Navegação entre semanas
- ✅ Carregamento via API
- ✅ Visualização de reservas e horários indisponíveis
- ✅ Clique para criar nova reserva

### 4. **Limpeza de Ficheiros**
Removidos **11 ficheiros obsoletos/duplicados**:
- `main-calendar.js`
- `main-dashboard.js`
- `main-new-booking.js`
- `main-reservations.js`
- `main-unavailable.js`
- `main.js`
- `calendar-manager.js`
- `calendar.js` (versão antiga 15KB)
- `new-booking-manager.js`
- `reservations.js`
- `unavailable.js` (versão antiga 34KB!)

### 5. **Páginas HTML Corrigidas**
Todas as páginas atualizadas para carregar os scripts corretos:
- ✅ `admin-login.html` - Login funcional com CSS inline
- ✅ `calendar.html` - Calendário moderno funcional
- ✅ `dashboard.html` - Dashboard limpo
- ✅ `reservations.html` - Lista de reservas
- ✅ `new-booking.html` - Formulário de nova reserva com lógica inline
- ✅ `unavailable.html` - Gestão de horários indisponíveis

## 📊 Estatísticas

### Antes
- **21 ficheiros** JavaScript no admin
- Múltiplas dependências confusas
- Scripts obsoletos carregados
- Erros de MIME type
- Login sem CSS

### Depois
- **9 ficheiros** JavaScript essenciais
- Estrutura clara e organizada
- Zero ficheiros obsoletos
- Todos os scripts carregam corretamente
- Login com CSS completo

**Redução: 57% menos ficheiros!**

## 📝 Estrutura Final

```
public/
├── admin-login.html          ✅ Corrigido
├── admin/
│   ├── calendar.html         ✅ Corrigido
│   ├── dashboard.html        ✅ Corrigido
│   ├── reservations.html     ✅ Corrigido
│   ├── new-booking.html      ✅ Corrigido
│   └── unavailable.html      ✅ Corrigido
└── js/admin/
    ├── api.js                ✨ NOVO - Cliente API
    ├── auth.js               ✅ Corrigido (standalone)
    ├── calendar-modern.js    ✨ NOVO - Calendário funcional
    ├── dashboard.js          ✅ Mantido
    ├── modal.js              ✅ Mantido
    ├── profiles.js           ✅ Mantido
    ├── reservations-manager.js ✅ Mantido
    ├── ui.js                 ✅ Mantido
    └── unavailable-manager.js ✅ Mantido
```

## 🚀 Como Usar

### 1. Fazer Chamadas à API

```javascript
// Buscar reservas
const reservas = await window.adminAPI.getReservas({
    data_inicio: '2025-12-24',
    data_fim: '2025-12-31',
    barbeiro_id: 1
});

// Criar reserva
const nova = await window.adminAPI.createReserva({
    barbeiro_id: 1,
    cliente_nome: 'João Silva',
    cliente_telefone: '+351912345678',
    data_hora: '2025-12-24T10:00:00',
    servico_id: 2
});

// Atualizar reserva
await window.adminAPI.updateReserva(123, {
    status: 'confirmed'
});

// Eliminar reserva
await window.adminAPI.deleteReserva(123);
```

### 2. Adicionar Nova Página Admin

```html
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <title>Nova Página</title>
    <link rel="stylesheet" href="/css/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="admin-dashboard">
    <div id="headerContainer"></div>
    <div class="dashboard-container">
        <main class="dashboard-content">
            <!-- Seu conteúdo aqui -->
        </main>
    </div>

    <!-- Scripts essenciais -->
    <script src="/js/admin/api.js"></script>
    <script src="/js/admin/auth.js"></script>
    <script>
        // Load header
        fetch('/admin/header.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('headerContainer').innerHTML = html;
            });
    </script>
    <!-- Seus scripts adicionais -->
</body>
</html>
```

## 🔐 Endpoints da API Backend

### Autenticação
- `POST /api/admin/api_admin_login` - Login com username, password, turnstileToken

### Barbeiros
- `GET /api/barbeiros` - Listar todos os barbeiros
- `GET /api/barbeiros/:id` - Detalhes de um barbeiro

### Serviços
- `GET /api/servicos` - Listar todos os serviços

### Reservas (Requer autenticação)
- `GET /api/admin/api_admin_reservas` - Listar reservas
  - Query params: `data_inicio`, `data_fim`, `barbeiro_id`, `status`
- `GET /api/admin/api_admin_reservas/:id` - Detalhes de uma reserva
- `POST /api/admin/api_admin_reservas` - Criar nova reserva
- `PUT /api/admin/api_admin_reservas/:id` - Atualizar reserva
- `DELETE /api/admin/api_admin_reservas/:id` - Eliminar reserva

### Horários Indisponíveis (Requer autenticação)
- `GET /api/admin/api_horarios_indisponiveis` - Listar horários
  - Query params: `data_inicio`, `data_fim`, `barbeiro_id`
- `GET /api/admin/api_horarios_indisponiveis/:id` - Detalhes
- `POST /api/admin/api_horarios_indisponiveis` - Criar
- `PUT /api/admin/api_horarios_indisponiveis/:id` - Atualizar
- `DELETE /api/admin/api_horarios_indisponiveis/:id` - Eliminar

## ❗ Autenticação

Todas as requisições (exceto login e endpoints públicos) requerem token JWT:

```
Authorization: Bearer <token>
```

O token é gerido automaticamente pelo `api.js` e armazenado em `localStorage` como `admin_token`.

## 👍 Boas Práticas

1. **Sempre usar `window.adminAPI`** para chamadas de API
2. **Não fazer fetch diretamente** - usar os métodos do api.js
3. **Carregar api.js primeiro** antes de outros scripts
4. **Carregar auth.js** em todas as páginas protegidas
5. **Usar try-catch** em operações assíncronas
6. **Validar dados** antes de enviar para API

## 📊 Total de Commits

**23 commits** na branch `fix/admin-cleanup-and-fixes`:
- 4 commits de correções iniciais (login, API, calendário, HTML)
- 11 commits de limpeza (remoção de ficheiros obsoletos)
- 6 commits de correção de páginas HTML
- 2 commits de documentação

## ✅ Checklist Final

- [x] Login funcional sem erros
- [x] API client centralizado
- [x] Calendário com duas vistas funcionais
- [x] Ficheiros obsoletos removidos
- [x] Todas as páginas HTML corrigidas
- [x] Scripts carregam sem erros MIME
- [x] Header aparece em todas as páginas
- [x] Documentação completa

---

🍻 **Brooklyn Barbearia** - Admin Panel v2.0  
💻 Desenvolvido com 🤍 por Tiago Oliveira
