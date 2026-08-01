# 12 — Checklist de Desenvolvimento

> Use este documento para acompanhar o progresso do MVP. Marque cada item conforme for implementando.

---

## Setup Inicial

- [ ] Repositório criado (web app)
- [ ] Repositório criado (app Flutter)
- [ ] Banco de dados provisionado
- [ ] Variáveis de ambiente configuradas
- [ ] CI/CD básico configurado

### Variáveis de ambiente necessárias
```env
# Banco
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AbacatePay
ABACATEPAY_API_KEY=
ABACATEPAY_WEBHOOK_SECRET=
ABACATEPAY_BASE_URL=https://api.abacatepay.com/v1

# App
APP_URL=https://athletto.com.br
API_URL=https://api.athletto.com.br/v1

# Cron
CRON_TIMEZONE=America/Sao_Paulo
```

---

## Banco de Dados

- [ ] Criar tabela `clubes`
- [ ] Criar tabela `gestores`
- [ ] Criar tabela `atletas`
- [ ] Criar tabela `turmas`
- [ ] Criar tabela `atleta_turma`
- [ ] Criar tabela `frequencias`
- [ ] Criar tabela `alertas_evasao`
- [ ] Criar tabela `eventos_calendario`
- [ ] Criar tabela `planejamentos`
- [ ] Criar tabela `planejamento_atletas`
- [ ] Criar tabela `caixinhas`
- [ ] Criar tabela `cobranças`
- [ ] Criar tabela `transacoes`
- [ ] Criar tabela `webhook_logs`
- [ ] Criar índices de performance

---

## Backend — Auth

- [ ] `POST /auth/login` (gestor)
- [ ] `POST /auth/refresh`
- [ ] `POST /auth/logout`
- [ ] `POST /auth/atleta/login`
- [ ] `POST /auth/atleta/criar-senha`
- [ ] Middleware de autenticação JWT
- [ ] Middleware de isolamento por clube_id
- [ ] Middleware de verificação de plano/limites

---

## Backend — Módulos Core

### Atletas
- [ ] CRUD completo
- [ ] Soft delete
- [ ] Filtros (status, saúde, turma)
- [ ] Link de cadastro público
- [ ] Endpoint de cadastro público (sem auth)
- [ ] Validação de CPF
- [ ] Verificação de limite do plano

### Turmas
- [ ] CRUD completo
- [ ] Vinculação de atletas
- [ ] Verificação de limite do plano

### Frequência
- [ ] Registro de presença (batch por turma)
- [ ] Histórico por atleta / por turma
- [ ] Cálculo de % de presença
- [ ] Alertas de evasão (endpoint + cron job)
- [ ] Deep link WhatsApp para alerta

### Calendário
- [ ] Geração automática de eventos de turma
- [ ] CRUD de eventos manuais
- [ ] Query por período

---

## Backend — Financeiro

### Planejamentos
- [ ] CRUD completo
- [ ] Vinculação de atletas/turmas
- [ ] Ativar planejamento → criar caixinha + cobranças
- [ ] Encerrar caixinha
- [ ] Validações (mínimo 1 atleta, etc.)

### AbacatePay
- [ ] Serviço de criação de cobrança (link Pix)
- [ ] Tratamento de erro da API
- [ ] Webhook endpoint `/webhooks/abacatepay`
- [ ] Validação de assinatura HMAC
- [ ] Processamento: atualizar cobrança → saldo caixinha → transação
- [ ] Idempotência (não processar webhook duplicado)
- [ ] Log de todos os webhooks

### Cobranças
- [ ] Listar por status / caixinha / atleta
- [ ] Marcar como pago manualmente
- [ ] Isentar atleta
- [ ] Cancelar cobrança
- [ ] Regenerar link Pix
- [ ] Gerar deep link WhatsApp para cobrança

### Dashboard Financeiro
- [ ] Resumo (entradas, saídas, saldo, pendentes)
- [ ] Registro de entrada manual
- [ ] Registro de saída manual
- [ ] Extrato com filtros
- [ ] Dados para gráficos

### Cron Jobs
- [ ] Alerta de evasão (diário 08:00)
- [ ] Cobranças recorrentes (diário 06:00)

---

## Frontend Web — Páginas

### Layout
- [ ] Sidebar de navegação
- [ ] Header com busca e notificações
- [ ] Design dark mode consistente
- [ ] Responsivo (mobile web)

### Módulos
- [ ] Dashboard principal
- [ ] Atletas (listagem + cadastro + perfil)
- [ ] Turmas (listagem + criação + gestão de atletas)
- [ ] Frequência (registro + histórico + alertas)
- [ ] Calendário (mensal + detalhe do dia)
- [ ] Financeiro — Planejamento
- [ ] Financeiro — Dashboard (entradas + saídas + extrato)
- [ ] Financeiro — Caixinhas
- [ ] Financeiro — Pendentes
- [ ] Configurações (todas as abas)

---

## App Flutter

- [ ] Setup do projeto Flutter
- [ ] Configuração do Dio (API client + interceptors)
- [ ] Configuração do go_router
- [ ] Configuração do flutter_riverpod
- [ ] flutter_secure_storage para JWT

### Telas MVP
- [ ] Seleção de clube (slug ou deep link)
- [ ] Login (CPF + senha)
- [ ] Criar senha (primeiro acesso)
- [ ] Home / Dashboard do atleta
- [ ] Cobranças (listagem pendentes + pagas)
- [ ] Detalhe da cobrança + QR code Pix
- [ ] Frequência
- [ ] Perfil

### Integrações Flutter
- [ ] url_launcher para links Pix
- [ ] app_links para deep links de clube
- [ ] Tema dark mode

---

## Testes e Qualidade

- [ ] Testes unitários nas regras de negócio críticas
- [ ] Teste do fluxo completo: criar planejamento → ativar → webhook → confirmar pagamento
- [ ] Teste de idempotência do webhook
- [ ] Teste de limite de plano (bloquear acima do limite)
- [ ] Teste de isolamento multi-tenant (clube A não acessa dados do clube B)

---

## Pré-lançamento

- [ ] Revisão dos limites do plano Pro (20 turmas vs. atletas ilimitados)
- [ ] Política de privacidade e termos de uso
- [ ] LGPD: consentimento + política de dados sensíveis (CPF)
- [ ] Monitoramento de erros (Sentry ou similar)
- [ ] Backup automático do banco
- [ ] Rate limiting na API
- [ ] HTTPS em todos os endpoints
- [ ] Teste de carga básico
- [ ] Onboarding wizard para novos gestores
- [ ] Página de status da plataforma (ou status simples)
