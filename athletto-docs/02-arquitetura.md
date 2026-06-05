# 02 — Arquitetura do Sistema

## Visão Geral

O Athletto é composto por duas plataformas distintas que compartilham a mesma API e base de dados:

```
┌─────────────────────────────────────────────────────┐
│                    ATHLETTO PLATFORM                │
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │  Web App (Gestor)│      │  App Flutter     │    │
│  │  Painel de gestão│      │  Atleta / Pai    │    │
│  └────────┬─────────┘      └────────┬─────────┘    │
│           │                         │               │
│           └────────────┬────────────┘               │
│                        │                            │
│              ┌─────────▼──────────┐                 │
│              │      API REST      │                 │
│              │   (Backend core)   │                 │
│              └─────────┬──────────┘                 │
│                        │                            │
│         ┌──────────────┼──────────────┐            │
│         │              │              │            │
│  ┌──────▼──────┐ ┌─────▼─────┐ ┌────▼──────┐     │
│  │  Database   │ │AbacatePay │ │  Webhook  │     │
│  │ (principal) │ │   (Pix)   │ │  Handler  │     │
│  └─────────────┘ └───────────┘ └───────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. Web App — Painel do Gestor
- Interface principal de gestão do clube
- Acesso via browser (desktop e mobile web)
- Módulos: Dashboard, Atletas, Turmas, Frequência, Calendário, Financeiro, Configurações
- Autenticação: e-mail + senha (gestor principal) ou acesso por convite (gestores adicionais)

### 2. App Flutter — Portal do Atleta/Pai
- App nativo iOS + Android
- Login: CPF como identificador + senha criada no primeiro acesso
- Funcionalidades MVP:
  - Cobranças pendentes com link Pix
  - Histórico de pagamentos
  - Frequência do atleta
- Funcionalidades futuras: Cards de evolução, notificações push

### 3. API REST
- Backend único servindo ambas as plataformas
- Autenticação JWT com roles: `gestor`, `gestor_adicional`, `atleta`
- Endpoints organizados por domínio: `/atletas`, `/turmas`, `/frequencia`, `/financeiro`, `/planejamento`, `/caixinhas`

### 4. Webhook Handler
- Endpoint dedicado para receber notificações do AbacatePay
- Ao receber confirmação de Pix pago:
  1. Valida assinatura do webhook
  2. Localiza a cobrança pelo `payment_id`
  3. Atualiza status para `pago`
  4. Registra `data_pagamento`
  5. Atualiza saldo da caixinha
  6. Gera entrada no dashboard financeiro automaticamente

### 5. Cron Jobs
- **Alerta de evasão:** roda diariamente — verifica atletas com 3+ faltas consecutivas e cria flag no dashboard
- **Cobranças recorrentes:** roda mensalmente (ou conforme periodicidade) — gera novos links Pix para caixinhas recorrentes ativas

---

## Autenticação e Roles

| Role | Acesso | Permissões |
|---|---|---|
| `gestor` | Web app | Acesso total ao clube — único responsável pelo plano |
| `gestor_adicional` | Web app | Acesso configurável por módulo (até 5 no plano Pro) |
| `atleta` | App Flutter | Acesso apenas aos próprios dados |

### Fluxo de acesso do atleta
1. Gestor cadastra o atleta com CPF
2. Sistema gera link único: `athletto.com.br/atleta/{slug-do-clube}`
3. Atleta acessa o link, informa o CPF — sistema reconhece e pede criação de senha
4. Na segunda entrada: CPF + senha criada

---

## Segurança

- Todas as requisições autenticadas via JWT com expiração curta + refresh token
- CPFs armazenados com hash (bcrypt) — exibidos mascarados na interface (`***.055.212-18`)
- Webhook do AbacatePay validado por assinatura HMAC
- Dados de um clube nunca acessíveis por outro clube (isolamento por `clube_id` em todas as queries)
- HTTPS obrigatório em todos os endpoints

---

## Escalabilidade

O sistema é projetado para ser **multi-tenant** desde o início:
- Cada clube é um tenant isolado
- Todos os dados têm `clube_id` como chave de partição
- Limites por plano aplicados no backend (não só no frontend)
- Plano e limites verificados a cada operação crítica (ex: ao adicionar atleta além do limite do plano)
