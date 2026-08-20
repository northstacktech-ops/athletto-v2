# Athletto

**Sistema de gestão esportiva** para clubes, escolinhas e academias esportivas — um SaaS multi-tenant que centraliza atletas, turmas, frequência, calendário e financeiro (incluindo cobrança automática via Pix) em um único painel, feito para o dia a dia de quem gerencia um clube.

## Objetivo

Hoje a maioria dos clubes e escolinhas esportivas roda a operação em planilhas, grupos de WhatsApp e cobrança manual de mensalidade — o que gera retrabalho, atraso no recebimento e falta de visibilidade sobre o negócio. O Athletto existe pra resolver isso: dar ao gestor esportivo um sistema único onde ele cadastra o clube, organiza turmas e atletas, registra frequência, acompanha o calendário de treinos/eventos e — principalmente — automatiza a cobrança de mensalidade, com o dinheiro caindo direto na conta do clube via Pix.

## Público-alvo

Gestores de clubes, escolinhas de futebol e outras modalidades, e academias esportivas que precisam de um sistema simples para administrar atletas, turmas e a parte financeira do negócio — do pequeno clube de bairro à escolinha com múltiplas categorias e centenas de atletas.

## Funcionalidades

### Atletas
Cadastro completo do atleta (dados pessoais, foto, responsável, CPF), vínculo com turmas, histórico de frequência e situação financeira individual, campo de saúde/observações, e controle de status (ativo/afastado/inativo).

### Turmas
Organização por categoria (ex.: Sub-15, Sub-17, Adulto), com dias da semana, horário, local e mensalidade padrão configuráveis. A mensalidade de uma turma é automaticamente vinculada a uma cobrança recorrente — sem cobrança retroativa para quem entra no meio do ciclo.

### Frequência
Registro rápido de presença por treino, histórico por atleta e por turma, e detecção automática de evasão (alerta quando um atleta acumula faltas seguidas), para o gestor agir antes de perder o atleta.

### Calendário
Agenda unificada de treinos (gerados automaticamente a partir das turmas) e eventos avulsos (jogos, campeonatos, reuniões), com visão semanal e mensal.

### Financeiro
- **Cobranças via Pix**: geração automática de Pix mensal por atleta, direto na subconta do clube (via ValidaPay) — o clube recebe direto, sem intermediação manual.
- **Caixinhas**: mecanismo genérico para cobranças avulsas (viagem, campeonato, uniforme), com opção de pagamento único ou parcelado. Quando um atleta entra numa caixinha parcelada no meio do ciclo, o gestor escolhe entre cobrar só as parcelas restantes (parcial) ou o valor total redistribuído (integral).
- **Extrato e dashboard**: visão de entradas/saídas, cobranças pendentes/atrasadas, e indicadores financeiros do clube.
- **Carteira**: saldo disponível na subconta ValidaPay do clube e solicitação de saque.
- **Régua de cobrança via WhatsApp**: lembretes automáticos antes do vencimento e mensagens de cobrança em atraso, enviados pela API oficial do WhatsApp (Meta Cloud API) — recurso pronto no sistema, ativado assim que o clube contratar um BSP de WhatsApp Business.

### Assinatura e planos
O próprio Athletto opera como SaaS: cada clube começa em trial e assina um plano (Base, Pro ou Elite, com limites crescentes de atletas/turmas/gestores) via Pix. Uma taxa de transação (percentual + valor fixo) é retida automaticamente em cada cobrança processada, como modelo de receita da plataforma.

### Gestão de equipe e permissões
Um clube pode ter múltiplos gestores, com permissão por módulo (visualizar ou editar) — só o gestor principal tem acesso total, incluindo dados financeiros sensíveis e configuração de pagamento.

### Painel administrativo (superadmin)
Visão cross-tenant para quem opera a Athletto: métricas de negócio (MRR, ARR, churn, crescimento), gestão de todos os clubes, aprovação/gestão de vouchers de cortesia, programa de indicação ("Convide e ganhe"), auditoria de ações administrativas, monitoramento de webhooks e configurações globais da plataforma.

### Outros
Tour guiado por tela para onboarding de usuários não-técnicos, central de notificações, programa de indicação entre clubes, e suporte integrado.

## Stack

- **Frontend/Backend**: [Nuxt 3](https://nuxt.com/) (Vue 3 + TypeScript), com rotas server-side (`server/api/`) para lógica sensível e integrações
- **Banco de dados**: [Supabase](https://supabase.com/) (Postgres, Auth, Storage, Row Level Security multi-tenant)
- **Pagamentos**: [ValidaPay](https://validapay.com.br/) — Pix com subconta por clube e split de taxa da plataforma
- **Mensageria**: WhatsApp Business (Meta Cloud API)
- **Deploy**: [Vercel](https://vercel.com/) (hospedagem + cron jobs agendados)
- **Estilo**: Tailwind CSS

## Estrutura do repositório

```text
athletto-v2/
├── pages/         → Rotas do gestor + painel /admin
├── components/    → Componentes por domínio (atletas, financeiro, admin, ui...)
├── composables/   → Lógica de dados (Supabase) — um por domínio
├── server/api/    → Endpoints server-side (cadastro, Pix, webhooks, cron)
├── supabase/      → Migrations SQL (fonte de verdade do banco)
└── middleware/    → Auth, plano e admin guards
```

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com as chaves do Supabase e ValidaPay
npm run dev            # http://localhost:4000
```

## Banco de dados

O schema completo está em `supabase/migrations/` (aplicar em ordem). Detalhes em `supabase/README.md`.
