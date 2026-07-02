# Athletto — Funcionalidades do Sistema (visão completa)

> Documento de referência de **tudo que a plataforma oferece e tudo que dá para cadastrar**, organizado por módulo.
> Stack: **Nuxt 3 + Supabase (Postgres/Auth/Storage/RLS) + Vercel**. Cobranças via **AbacatePay** (PIX).
> Atualizado em 2026-06-11.

---

## Índice
1. [Visão geral](#1-visão-geral)
2. [Clube & Onboarding](#2-clube--onboarding)
3. [Atletas](#3-atletas)
4. [Turmas / Categorias](#4-turmas--categorias)
5. [Frequência (chamada)](#5-frequência-chamada)
6. [Financeiro](#6-financeiro)
7. [Calendário & Eventos](#7-calendário--eventos)
8. [App do Atleta/Responsável](#8-app-do-atletaresponsável)
9. [Notificações & Automações](#9-notificações--automações)
10. [Configurações](#10-configurações)
11. [LGPD & Privacidade](#11-lgpd--privacidade)
12. [Planos & Assinatura](#12-planos--assinatura)
13. [Painel Admin (superadmin)](#13-painel-admin-superadmin)
14. [Resumo: tudo que dá para cadastrar](#14-resumo-tudo-que-dá-para-cadastrar)
15. [Conta de demonstração (dados de ~6 meses)](#15-conta-de-demonstração-dados-de-6-meses)

---

## 1. Visão geral

O Athletto é um sistema de gestão para escolas e clubes esportivos. Cada **clube** é um *tenant* isolado (RLS por `clube_id`), gerido por um ou mais **gestores**. O fluxo central liga:

```
Clube → Turmas → Atletas → (Frequência, Cobranças, Calendário)
                       └→ Planejamento financeiro → Caixinhas → Cobranças → Transações
```

Há ainda um **app do atleta/responsável** (área separada, autenticada por código + senha) e um **painel administrativo** (superadmin) para operar a plataforma como SaaS.

---

## 2. Clube & Onboarding

**O que dá para cadastrar/configurar:**
- Nome, slug (URL pública de cadastro: `/cadastro/<slug>`), modalidade, CNPJ, telefone, e-mail, logomarca.
- Plano contratado (`básico`, `intermediário`, `profissional`) e status do plano.

**Funcionalidades:**
- **Onboarding guiado** (`/onboarding`) ao criar o clube.
- **Página pública de inscrição** por slug — captação de novos atletas direto pelo responsável.
- **Tour inicial** na interface (SidebarTour) para o primeiro acesso.

---

## 3. Atletas

Cadastro completo do atleta (tabela `atletas`):

| Campo | Descrição |
|---|---|
| Nome, apelido | Identificação |
| CPF | Único por clube |
| Data de nascimento | Calcula idade/categoria |
| Telefone, telefone do responsável | Contato |
| E-mail | Login do app do atleta |
| Foto | Upload com **recorte/crop** (Storage) |
| Número da camisa, posição | Dados esportivos |
| **Status** | `titular`, `novato`, `selecionado`, `afastado` |
| **Saúde** | `saudável`, `lesionado`, `em_recuperação` |
| Tipo sanguíneo | Ficha médica |
| **Histórico de lesões** | Lista (JSON) com data/descrição/status |
| Observações médicas | Texto livre |
| Valor da mensalidade | Por atleta (pode diferir do padrão da turma) |
| Data de entrada | Início no clube |
| Ativo | Liga/desliga o atleta |

**Funcionalidades:**
- Lista com **busca, filtros e cards** com foto.
- **Drawer de detalhe** com ficha completa, vínculos de turma, histórico de cobranças e frequência.
- Formulário de criação/edição com upload e crop de foto.
- Vínculo a uma ou mais turmas.
- Marcação de afastamento, lesão e bolsista (isenção).

---

## 4. Turmas / Categorias

Cadastro (tabela `turmas`):
- Nome e descrição (ex.: Sub-11, Sub-13…).
- **Dias da semana** (multi-seleção, 0=domingo … 6=sábado).
- Horário de início e fim.
- Local de treino.
- **Valor de mensalidade padrão** (herdado pelos atletas da turma).
- Ativa/inativa.

**Funcionalidades:**
- Cards de turma com resumo (nº de atletas, horários).
- **Drawer de atletas da turma** — adicionar/remover vínculos.
- Base para a chamada de frequência e para o planejamento financeiro.

---

## 5. Frequência (chamada)

Registro de presença (tabela `frequencias`, único por turma+atleta+dia):
- **Registrar chamada** por turma e data (presente/ausente por atleta).
- **Histórico** de frequência por atleta e por turma.
- **Ranking** de presença (mais assíduos).
- **Alertas de evasão** — atletas com queda de presença (alimenta `alertas_evasao`, automação diária).
- Indicadores de % de presença para o dashboard.

---

## 6. Financeiro

O coração do sistema. Quatro peças que se conectam:

### 6.1 Planejamentos (`planejamentos`)
Modelo de cobrança. Configurável:
- **Tipo:** `recorrente` (mensalidade) ou `único` (taxa avulsa, ex.: uniforme, viagem).
- **Valor** base e **periodicidade** (`mensal`, `bimestral`, `trimestral`, `semestral`, `anual`).
- **Dia de vencimento** (1–28).
- **Status:** `inativo` → `ativo` → `encerrado`.
- Seleção de atletas participantes, com **valor customizado** ou **isenção** por atleta.
- Fluxo em etapas (definição → seleção de atletas → revisão) e ação **"Criar e Ativar cobranças"**.

### 6.2 Caixinhas (`caixinhas`)
Cada rodada de cobrança gera uma **caixinha** (ex.: "Mensalidade Junho/2026"), que agrega as cobranças daquele período e acompanha:
- Total previsto, total pago, total pendente, saldo arrecadado.
- Drawer de detalhe com a lista de cobranças e status de cada atleta.

### 6.3 Cobranças (`cobrancas`)
Uma cobrança por atleta por caixinha:
- **Status:** `pendente`, `pago`, `isento`, `cancelado`.
- Valor, vencimento, data de pagamento.
- Integração **AbacatePay**: geração de **link/QR PIX** (`payment_id`, link) e baixa automática via **webhook**.
- Aba de **pendências** (em aberto / vencidas).

### 6.4 Transações & Dashboard (`transacoes`)
Livro-caixa do clube:
- **Entradas** (mensalidades pagas, patrocínios, taxas) e **saídas** (aluguel, material, arbitragem, etc.), com categoria e origem (`manual`/`webhook`).
- Lançamento manual de entrada/saída.
- **Dashboard financeiro:** receita x despesa, saldo, evolução mensal (gráficos), KPIs, inadimplência.
- **Extrato** filtrável por período/categoria.
- Movimentações do SaaS (`movimentacoes_sistema`): mensalidade recebida, reembolso, taxa de gateway, despesa operacional.

---

## 7. Calendário & Eventos

Agenda do clube (tabela `eventos_calendario`):
- **Tipo:** `treino` ou `evento`.
- Título, descrição, data/hora início e fim.
- Vínculo a turma(s) e/ou atleta(s) específicos.
- Visão de calendário com detalhe do evento.
- Exemplos: reuniões de pais, amistosos, torneios, avaliações físicas, festivais.

---

## 8. App do Atleta/Responsável

Área separada (endpoints `/api/app/*`), pensada para o responsável:
- **Acesso por código** (`app_codigos_acesso`) + definição de senha no primeiro acesso.
- **Sessões** próprias (`app_atleta_sessoes`).
- Telas: dados do atleta, **agenda/treinos**, **avisos**, **cobranças** (com PIX), **frequência**, **notificações** e **preferências**.
- **Consulta de CPF**, **consentimento LGPD**, **exportar dados** e **excluir conta** (direitos do titular).
- Upload de foto pelo próprio app.

---

## 9. Notificações & Automações

- **Sino de notificações** (`notificacoes` / `app_notificacoes`) na interface.
- Tipos para o app: `financeiro`, `vencido`, `evento`, `clube`, `senha`.
- **Automações agendadas (pg_cron, horário de Brasília):**
  - **06h** — geração de cobranças recorrentes do mês.
  - **08h** — recálculo de alertas de evasão.
  - **09h** — processamento/envio de notificações.
- Rota protegida `/api/cron/processar-notificacoes` (protegida por `CRON_SECRET`).
- **Health check:** `/api/health` (para uptime/keep-alive).

---

## 10. Configurações

- **Dados do clube** (seção responsável, identidade visual).
- **Equipe / Gestores** (`gestores`): gestor `principal` e gestores `adicionais`, com e-mail, função e permissões (JSON).
- **Acessos** — controle de quem acessa o painel.
- **Assinatura** — plano atual, status e upgrade.
- **Tema** claro/escuro.
- **Auditoria** (`logs_auditoria`) — trilha de ações dos usuários.

---

## 11. LGPD & Privacidade

- **Consentimentos** (`consentimentos`): tipo, versão, aceite, IP, user-agent, data.
- Páginas públicas de **Termos** (`/termos`) e **Privacidade** (`/privacidade`).
- **Exportar dados** e **excluir/anonimizar conta** (campo `anonimizado_em` em atletas).
- Kit LGPD aplicado via migrations.

---

## 12. Planos & Assinatura

- **Planos:** `básico`, `intermediário`, `profissional` — com **limites por plano** (nº de atletas/turmas, etc.) aplicados via middleware (`plano.global.ts`) e `usePlanoLimites`.
- **Trial** com contador (badge "Xd trial") e página de **upgrade** (`/upgrade`).
- **Assinaturas** (`assinaturas`) com status `trial`, `ativa`, `inadimplente`, `cancelada`, `suspensa`.
- **Vouchers** (`vouchers`): `trial`, `extensão`, `upgrade`, `cortesia`, com status próprio.
- **Indicações** (`indicacoes`): programa de indicação com status `pendente/aprovada/rejeitada/expirada`.

---

## 13. Painel Admin (superadmin)

Operação da plataforma como SaaS (`/admin/*`):
- **Dashboard** geral (KPIs da operação).
- **Clubes** — lista e detalhe de cada clube.
- **Assinaturas**, **Vouchers**, **Indicações**.
- **Financeiro** consolidado da plataforma.
- **Auditoria** e **Webhooks** (monitoramento `abacatepay`, status `recebido/processado/erro/ignorado`).
- Papéis de superadmin: `owner`, `admin`, `suporte`, `financeiro`.

---

## 14. Resumo: tudo que dá para cadastrar

| Entidade | Onde |
|---|---|
| Clube (identidade, plano) | Configurações / Onboarding |
| Gestores / equipe | Configurações → Equipe |
| Turmas / categorias | Turmas |
| Atletas (ficha completa + foto + médico) | Atletas |
| Vínculo atleta↔turma | Turmas / Atletas |
| Planejamento de cobrança | Financeiro → Planejamento |
| Caixinhas (rodadas de cobrança) | Financeiro → Caixinhas |
| Cobranças (com PIX) | Financeiro → geradas pelo planejamento |
| Transações (entradas/saídas) | Financeiro → Extrato |
| Frequência (chamada) | Frequência |
| Eventos / treinos | Calendário |
| Consentimentos LGPD | App do atleta / automático |
| Vouchers, indicações, assinatura | Configurações / Admin |
| Notificações | Sistema / App |

---

## 15. Conta de demonstração (dados de ~6 meses)

Conta **ericxluzz.dsg@gmail.com** populada para simular uso real de janeiro a junho/2026.

**Clube:** Falcões FC — Escola de Futebol (slug `eric-fc`) · plano **profissional** · criado em dez/2025.

**Estrutura:**
- **4 turmas:** Sub-11 (Seg/Qua 18h), Sub-13 (Ter/Qui 18h), Sub-15 (Seg/Qua/Sex 19h), Sub-17 (Ter/Qui/Sáb 9h).
- **28 atletas** (27 ativos + 1 afastado) com **fotos**, posições, status variados (titular/novato/selecionado/afastado), saúde (saudável/lesionado/em recuperação), histórico de lesões em alguns, **2 bolsistas isentos**, datas de entrada espalhadas pelos 6 meses.

**Financeiro (jan–jun/2026):**
- **1 planejamento recorrente** mensal ativo + **6 caixinhas** mensais.
- **154 cobranças** com perfis de pagamento realistas: **131 pagas**, **11 pendentes/vencidas**, **12 isentas**.
- **147 transações**: mensalidades recebidas (PIX e manual), patrocínio, taxas, e despesas (aluguel de campo, uniformes, material, arbitragem, manutenção, festa junina).
- **Saldo do período: ~R$ 13.660** (R$ 22.320 entradas − R$ 8.660 saídas) · **R$ 1.740 a receber**.

**Operação:**
- **1.280 registros de frequência** ao longo de ~22 semanas (**~83% de presença**), com assiduidade menor para lesionados/afastados.
- **15 eventos** no calendário (reuniões de pais, amistosos, torneio, avaliações, festival, festa junina) — incluindo eventos futuros em jun/2026.
- **56 consentimentos LGPD** (termos do responsável + uso de imagem) por atleta.

> Observação: a "equipe" (gestores adicionais) não foi populada porque cada gestor exige um usuário de autenticação real (FK para `auth.users`); o único gestor é o titular **Eric Luz**. Para demonstrar a tela de Equipe, crie os gestores pelo fluxo de convite da própria interface.
