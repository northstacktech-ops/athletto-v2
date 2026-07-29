-- ============================================================================
-- Athletto — 0001_schema.sql
-- Extensões, enums, tabelas, FKs, índices e triggers de updated_at.
-- Idempotente: pode ser reaplicada sem efeitos colaterais.
-- ============================================================================

set check_function_bodies = off;

-- ── Extensões ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Trigger genérico de updated_at (coluna padrão: atualizado_em) ───────────
create or replace function public.tg_set_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ============================================================================
-- ENUMS
-- ============================================================================

do $$ begin
  create type public.plano_clube as enum ('basico', 'intermediario', 'profissional');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.atleta_status as enum ('titular', 'novato', 'selecionado', 'afastado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.atleta_saude as enum ('saudavel', 'lesionado', 'em_recuperacao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.planejamento_status as enum ('inativo', 'ativo', 'encerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.planejamento_tipo as enum ('recorrente', 'unico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.periodicidade as enum ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cobranca_status as enum ('pendente', 'pago', 'isento', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transacao_tipo as enum ('entrada', 'saida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transacao_origem as enum ('manual', 'webhook');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.evento_tipo as enum ('treino', 'evento');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assinatura_status as enum ('trial', 'ativa', 'inadimplente', 'cancelada', 'suspensa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.voucher_tipo as enum ('trial', 'extensao', 'upgrade', 'cortesia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.voucher_status as enum ('ativo', 'consumido', 'expirado', 'revogado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.indicacao_status as enum ('pendente', 'aprovada', 'rejeitada', 'expirada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.superadmin_role as enum ('owner', 'admin', 'suporte', 'financeiro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.webhook_origem as enum ('abacatepay', 'outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.webhook_status as enum ('recebido', 'processado', 'erro', 'ignorado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sistema_mov_tipo as enum ('mensalidade_recebida', 'reembolso', 'taxa_gateway', 'despesa_operacional');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- CORE — multi-tenant por clube_id
-- ============================================================================

-- ── clubes ──────────────────────────────────────────────────────────────────
create table if not exists public.clubes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,
  modalidade    text,
  cnpj          text,
  telefone      text,
  email         text,
  logo_url      text,
  plano         public.plano_clube not null default 'basico',
  plano_ativo   boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists ix_clubes_slug on public.clubes (slug);

drop trigger if exists tg_clubes_updated on public.clubes;
create trigger tg_clubes_updated
  before update on public.clubes
  for each row execute function public.tg_set_atualizado_em();

-- ── gestores (id = auth.users.id) ───────────────────────────────────────────
create table if not exists public.gestores (
  id                uuid primary key references auth.users (id) on delete cascade,
  clube_id          uuid not null references public.clubes (id) on delete cascade,
  nome              text not null,
  cpf               text,
  email             text not null,
  email_verificado  boolean not null default false,
  foto_url          text,
  telefone          text,
  role              text not null default 'principal' check (role in ('principal', 'adicional')),
  permissoes        jsonb not null default '{}'::jsonb,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index if not exists ix_gestores_clube on public.gestores (clube_id);
create index if not exists ix_gestores_email on public.gestores (email);

drop trigger if exists tg_gestores_updated on public.gestores;
create trigger tg_gestores_updated
  before update on public.gestores
  for each row execute function public.tg_set_atualizado_em();

-- ── atletas ─────────────────────────────────────────────────────────────────
create table if not exists public.atletas (
  id                    uuid primary key default gen_random_uuid(),
  clube_id              uuid not null references public.clubes (id) on delete cascade,
  nome                  text not null,
  apelido               text,
  cpf                   text not null,
  data_nascimento       date,
  telefone              text,
  telefone_responsavel  text,
  email                 text,
  foto_url              text,
  numero_camisa         text,
  posicao               text,
  status                public.atleta_status not null default 'novato',
  saude                 public.atleta_saude not null default 'saudavel',
  tipo_sanguineo        text,
  historico_lesoes      jsonb not null default '[]'::jsonb,
  observacoes_medicas   text,
  valor_mensalidade     numeric(19,4),                 -- null = usa padrão da turma; 0 = bolsa integral
  data_entrada          date not null default current_date,
  ativo                 boolean not null default true,
  -- App mobile do atleta (senha por clube: mesmo CPF pode ter senha distinta em cada clube)
  app_primeiro_acesso   boolean not null default true,
  app_senha_hash        text,
  app_senha_definida_em timestamptz,
  app_ultimo_acesso     timestamptz,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  unique (clube_id, cpf)
);
create index if not exists ix_atletas_clube on public.atletas (clube_id);
create index if not exists ix_atletas_nome  on public.atletas (clube_id, nome);

drop trigger if exists tg_atletas_updated on public.atletas;
create trigger tg_atletas_updated
  before update on public.atletas
  for each row execute function public.tg_set_atualizado_em();

comment on column public.atletas.valor_mensalidade is
  'Mensalidade personalizada (NULL = usa padrão da turma; 0 = isento/bolsa).';
comment on column public.atletas.app_senha_hash is
  'Hash bcrypt/argon2 da senha do app mobile do atleta. Senha é por clube.';

-- ── turmas ──────────────────────────────────────────────────────────────────
create table if not exists public.turmas (
  id                        uuid primary key default gen_random_uuid(),
  clube_id                  uuid not null references public.clubes (id) on delete cascade,
  nome                      text not null,
  descricao                 text,
  dias_semana               int[] not null default '{}',
  horario_inicio            time not null,
  horario_fim               time not null,
  local                     text,
  valor_mensalidade_padrao  numeric(19,4) not null default 0,
  ativo                     boolean not null default true,
  criado_em                 timestamptz not null default now(),
  atualizado_em             timestamptz not null default now()
);
create index if not exists ix_turmas_clube on public.turmas (clube_id);

drop trigger if exists tg_turmas_updated on public.turmas;
create trigger tg_turmas_updated
  before update on public.turmas
  for each row execute function public.tg_set_atualizado_em();

-- ── atleta_turma ────────────────────────────────────────────────────────────
create table if not exists public.atleta_turma (
  atleta_id     uuid not null references public.atletas (id) on delete cascade,
  turma_id      uuid not null references public.turmas (id) on delete cascade,
  ativo         boolean not null default true,
  vinculado_em  timestamptz not null default now(),
  primary key (atleta_id, turma_id)
);
create index if not exists ix_atleta_turma_turma on public.atleta_turma (turma_id);

-- ── frequencias ─────────────────────────────────────────────────────────────
create table if not exists public.frequencias (
  id              uuid primary key default gen_random_uuid(),
  clube_id        uuid not null references public.clubes (id) on delete cascade,
  turma_id        uuid not null references public.turmas (id) on delete cascade,
  atleta_id       uuid not null references public.atletas (id) on delete cascade,
  data            date not null,
  presente        boolean not null,
  registrado_por  uuid references public.gestores (id) on delete set null,
  criado_em       timestamptz not null default now(),
  unique (turma_id, atleta_id, data)
);
create index if not exists ix_freq_clube_data on public.frequencias (clube_id, data);
create index if not exists ix_freq_atleta     on public.frequencias (atleta_id, data desc);

-- ── alertas_evasao ──────────────────────────────────────────────────────────
create table if not exists public.alertas_evasao (
  id                   uuid primary key default gen_random_uuid(),
  clube_id             uuid not null references public.clubes (id) on delete cascade,
  atleta_id            uuid not null references public.atletas (id) on delete cascade,
  turma_id             uuid not null references public.turmas (id) on delete cascade,
  faltas_consecutivas  int not null,
  data_deteccao        date not null,
  dispensado           boolean not null default false,
  dispensado_por       uuid references public.gestores (id) on delete set null,
  dispensado_em        timestamptz,
  criado_em            timestamptz not null default now()
);
create index if not exists ix_alertas_clube_ativos on public.alertas_evasao (clube_id, dispensado);
create index if not exists ix_alertas_atleta       on public.alertas_evasao (atleta_id);
create index if not exists ix_alertas_turma        on public.alertas_evasao (turma_id);

-- ── eventos_calendario ──────────────────────────────────────────────────────
create table if not exists public.eventos_calendario (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references public.clubes (id) on delete cascade,
  titulo       text not null,
  descricao    text,
  tipo         public.evento_tipo not null default 'treino',
  data_inicio  timestamptz not null,
  data_fim     timestamptz,
  turma_id     uuid references public.turmas (id) on delete set null,   -- legado: vínculo único
  turma_ids    uuid[] not null default '{}',                            -- vínculo múltiplo
  atleta_ids   uuid[] not null default '{}',
  criado_por   uuid references public.gestores (id) on delete set null,
  criado_em    timestamptz not null default now()
);
create index if not exists ix_eventos_clube_data on public.eventos_calendario (clube_id, data_inicio);
create index if not exists ix_eventos_turma      on public.eventos_calendario (turma_id);
create index if not exists ix_eventos_turma_ids  on public.eventos_calendario using gin (turma_ids);
create index if not exists ix_eventos_atleta_ids on public.eventos_calendario using gin (atleta_ids);

-- ============================================================================
-- FINANCEIRO DO CLUBE
-- ============================================================================

-- ── planejamentos ───────────────────────────────────────────────────────────
create table if not exists public.planejamentos (
  id               uuid primary key default gen_random_uuid(),
  clube_id         uuid not null references public.clubes (id) on delete cascade,
  nome             text not null,
  descricao        text,
  tipo             public.planejamento_tipo not null,
  valor            numeric(19,4) not null check (valor >= 0),
  periodicidade    public.periodicidade,
  dia_vencimento   int check (dia_vencimento between 1 and 28),
  data_vencimento  date,
  status           public.planejamento_status not null default 'inativo',
  ativado_em       timestamptz,
  encerrado_em     timestamptz,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
create index if not exists ix_planej_clube on public.planejamentos (clube_id, status);

drop trigger if exists tg_planej_updated on public.planejamentos;
create trigger tg_planej_updated
  before update on public.planejamentos
  for each row execute function public.tg_set_atualizado_em();

-- ── planejamento_atletas ────────────────────────────────────────────────────
create table if not exists public.planejamento_atletas (
  id                 uuid not null default gen_random_uuid() unique,
  planejamento_id    uuid not null references public.planejamentos (id) on delete cascade,
  atleta_id          uuid not null references public.atletas (id) on delete cascade,
  valor_customizado  numeric(19,4) check (valor_customizado >= 0),  -- null = usa valor base
  isento             boolean not null default false,
  vinculado_em       timestamptz not null default now(),
  primary key (planejamento_id, atleta_id)
);
create index if not exists ix_pa_atleta on public.planejamento_atletas (atleta_id);

-- ── caixinhas ───────────────────────────────────────────────────────────────
create table if not exists public.caixinhas (
  id                uuid primary key default gen_random_uuid(),
  clube_id          uuid not null references public.clubes (id) on delete cascade,
  planejamento_id   uuid not null references public.planejamentos (id) on delete cascade,
  nome              text not null,
  saldo_arrecadado  numeric(19,4) not null default 0,
  total_previsto    numeric(19,4) not null default 0,
  total_pendente    numeric(19,4) not null default 0,
  total_pago        numeric(19,4) not null default 0,
  criada_em         timestamptz not null default now()
);
create index if not exists ix_caixinhas_clube  on public.caixinhas (clube_id);
create index if not exists ix_caixinhas_planej on public.caixinhas (planejamento_id);

-- ── cobrancas ───────────────────────────────────────────────────────────────
create table if not exists public.cobrancas (
  id                     uuid primary key default gen_random_uuid(),
  clube_id               uuid not null references public.clubes (id) on delete cascade,
  caixinha_id            uuid not null references public.caixinhas (id) on delete cascade,
  atleta_id              uuid not null references public.atletas (id) on delete cascade,
  valor                  numeric(19,4) not null check (valor >= 0),
  status                 public.cobranca_status not null default 'pendente',
  data_vencimento        date not null,
  data_pagamento         date,
  abacatepay_payment_id  text,
  abacatepay_link        text,
  gerado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);
create index if not exists ix_cobr_clube_status on public.cobrancas (clube_id, status);
create index if not exists ix_cobr_caixinha     on public.cobrancas (caixinha_id);
create index if not exists ix_cobr_atleta       on public.cobrancas (atleta_id);
create index if not exists ix_cobr_payment      on public.cobrancas (abacatepay_payment_id);
create index if not exists ix_cobr_vencimento   on public.cobrancas (data_vencimento) where status = 'pendente';

drop trigger if exists tg_cobr_updated on public.cobrancas;
create trigger tg_cobr_updated
  before update on public.cobrancas
  for each row execute function public.tg_set_atualizado_em();

-- ── transacoes ──────────────────────────────────────────────────────────────
create table if not exists public.transacoes (
  id              uuid primary key default gen_random_uuid(),
  clube_id        uuid not null references public.clubes (id) on delete cascade,
  tipo            public.transacao_tipo not null,
  valor           numeric(19,4) not null check (valor >= 0),
  descricao       text,
  categoria       text,
  data            date not null,
  cobranca_id     uuid references public.cobrancas (id) on delete set null,
  caixinha_id     uuid references public.caixinhas (id) on delete set null,
  atleta_id       uuid references public.atletas (id) on delete set null,
  origem          public.transacao_origem not null default 'manual',
  registrado_por  uuid references public.gestores (id) on delete set null,
  criado_em       timestamptz not null default now()
);
create index if not exists ix_tx_clube_data on public.transacoes (clube_id, data);
create index if not exists ix_tx_cobranca   on public.transacoes (cobranca_id);
create index if not exists ix_tx_caixinha   on public.transacoes (caixinha_id);
create index if not exists ix_tx_atleta     on public.transacoes (atleta_id);

-- ============================================================================
-- PLATAFORMA / ADMIN
-- ============================================================================

-- ── superadmins (id = auth.users.id) ────────────────────────────────────────
create table if not exists public.superadmins (
  id             uuid primary key references auth.users (id) on delete cascade,
  nome           text not null,
  email          text not null unique,
  foto_url       text,
  role           public.superadmin_role not null default 'admin',
  ativo          boolean not null default true,
  ultimo_acesso  timestamptz,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

drop trigger if exists tg_sa_updated on public.superadmins;
create trigger tg_sa_updated
  before update on public.superadmins
  for each row execute function public.tg_set_atualizado_em();

-- ── assinaturas (1 por clube) ───────────────────────────────────────────────
create table if not exists public.assinaturas (
  id                       uuid primary key default gen_random_uuid(),
  clube_id                 uuid not null unique references public.clubes (id) on delete cascade,
  plano                    public.plano_clube not null,
  status                   public.assinatura_status not null default 'trial',
  trial_inicio             date not null default current_date,
  trial_fim                date not null,
  ativada_em               timestamptz,
  proxima_cobranca         date,
  valor_mensal             numeric(19,4) not null default 0 check (valor_mensal >= 0),
  cancelada_em             timestamptz,
  motivo_cancelamento      text,
  dias_voucher_aplicados   int not null default 0,
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);
create index if not exists ix_assin_status on public.assinaturas (status);

drop trigger if exists tg_assin_updated on public.assinaturas;
create trigger tg_assin_updated
  before update on public.assinaturas
  for each row execute function public.tg_set_atualizado_em();

-- ── vouchers ────────────────────────────────────────────────────────────────
create table if not exists public.vouchers (
  id                uuid primary key default gen_random_uuid(),
  clube_id          uuid not null references public.clubes (id) on delete cascade,
  emitido_por       uuid not null references public.superadmins (id) on delete restrict,
  tipo              public.voucher_tipo not null,
  dias_concedidos   int not null check (dias_concedidos > 0 and dias_concedidos <= 730),
  plano_concedido   public.plano_clube,
  motivo            text not null,
  observacoes       text,
  status            public.voucher_status not null default 'ativo',
  aplicado_em       timestamptz not null default now(),
  expira_em         timestamptz,
  revogado_em       timestamptz,
  revogado_por      uuid references public.superadmins (id) on delete set null,
  motivo_revogacao  text,
  criado_em         timestamptz not null default now()
);
create index if not exists ix_vch_clube  on public.vouchers (clube_id);
create index if not exists ix_vch_status on public.vouchers (status);

-- ── indicacoes ──────────────────────────────────────────────────────────────
create table if not exists public.indicacoes (
  id                   uuid primary key default gen_random_uuid(),
  clube_indicador_id   uuid not null references public.clubes (id) on delete cascade,
  clube_indicado_id    uuid references public.clubes (id) on delete set null,
  email_indicado       text not null,
  nome_indicado        text,
  telefone_indicado    text,
  status               public.indicacao_status not null default 'pendente',
  dias_recompensa      int not null default 30,
  voucher_emitido_id   uuid references public.vouchers (id) on delete set null,
  aprovada_em          timestamptz,
  aprovada_por         uuid references public.superadmins (id) on delete set null,
  rejeitada_em         timestamptz,
  rejeitada_por        uuid references public.superadmins (id) on delete set null,
  motivo_rejeicao      text,
  criado_em            timestamptz not null default now()
);
create index if not exists ix_ind_indicador on public.indicacoes (clube_indicador_id);
create index if not exists ix_ind_status    on public.indicacoes (status);

-- ── webhook_logs ────────────────────────────────────────────────────────────
create table if not exists public.webhook_logs (
  id             uuid primary key default gen_random_uuid(),
  origem         public.webhook_origem not null default 'abacatepay',
  evento         text not null,
  payment_id     text,
  cobranca_id    uuid references public.cobrancas (id) on delete set null,
  payload        jsonb not null,
  hmac_valido    boolean not null,
  status         public.webhook_status not null default 'recebido',
  erro           text,
  recebido_em    timestamptz not null default now(),
  processado_em  timestamptz
);
create index if not exists ix_wh_payment  on public.webhook_logs (payment_id);
create index if not exists ix_wh_cobranca on public.webhook_logs (cobranca_id);
-- Idempotência: um (origem, payment_id, evento) só pode estar PROCESSADO uma vez.
-- Índice único PARCIAL (status='processado') em vez de constraint plena, para
-- não bloquear o registro de re-entregas legítimas do gateway (que chegam com
-- status='recebido' e podem terminar em 'erro' ou 'ignorado').
create unique index if not exists ux_wh_idempotencia
  on public.webhook_logs (origem, payment_id, evento)
  where status = 'processado';

-- ── logs_auditoria ──────────────────────────────────────────────────────────
create table if not exists public.logs_auditoria (
  id             uuid primary key default gen_random_uuid(),
  superadmin_id  uuid references public.superadmins (id) on delete set null,
  usuario_id     uuid,                       -- auth.uid() genérico (gestor ou admin)
  acao           text not null,
  entidade       text not null,
  entidade_id    text,
  detalhes       jsonb not null default '{}'::jsonb,
  ip             inet,
  user_agent     text,
  criado_em      timestamptz not null default now()
);
create index if not exists ix_audit_data       on public.logs_auditoria (criado_em desc);
create index if not exists ix_audit_superadmin on public.logs_auditoria (superadmin_id);

-- ── configuracoes_sistema (singleton) ───────────────────────────────────────
create table if not exists public.configuracoes_sistema (
  id text primary key default 'cfg-singleton' check (id = 'cfg-singleton'),
  trial_dias_padrao                      int not null default 30,
  indicacao_dias_recompensa              int not null default 30,
  indicacao_aprovacao_automatica         boolean not null default false,
  indicacao_minimo_atletas_indicado      int not null default 5,
  abacatepay_ambiente                    text not null default 'sandbox'
                                           check (abacatepay_ambiente in ('sandbox', 'production')),
  abacatepay_webhook_secret_configurado  boolean not null default false,
  rate_limit_login_tentativas            int not null default 5,
  manutencao_ativa                       boolean not null default false,
  manutencao_mensagem                    text,
  atualizado_em                          timestamptz not null default now(),
  atualizado_por                         uuid references public.superadmins (id) on delete set null
);

drop trigger if exists tg_cfg_updated on public.configuracoes_sistema;
create trigger tg_cfg_updated
  before update on public.configuracoes_sistema
  for each row execute function public.tg_set_atualizado_em();

-- ── movimentacoes_sistema ───────────────────────────────────────────────────
create table if not exists public.movimentacoes_sistema (
  id              uuid primary key default gen_random_uuid(),
  assinatura_id   uuid references public.assinaturas (id) on delete set null,
  clube_id        uuid references public.clubes (id) on delete set null,
  tipo            public.sistema_mov_tipo not null,
  valor           numeric(19,4) not null,
  descricao       text not null,
  data            date not null,
  payment_id      text,
  registrado_por  uuid references public.superadmins (id) on delete set null,
  criado_em       timestamptz not null default now()
);
create index if not exists ix_sysmov_data  on public.movimentacoes_sistema (data desc);
create index if not exists ix_sysmov_clube on public.movimentacoes_sistema (clube_id);

-- ── limites_plano ───────────────────────────────────────────────────────────
create table if not exists public.limites_plano (
  plano         text primary key,
  max_atletas   int not null default 9999,
  max_turmas    int not null default 9999,
  max_gestores  int not null default 9999
);

-- ── notificacoes ────────────────────────────────────────────────────────────
create table if not exists public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  clube_id   uuid references public.clubes (id) on delete cascade,
  gestor_id  uuid references public.gestores (id) on delete cascade,
  audience   text not null default 'gestor' check (audience in ('gestor', 'superadmin')),
  tipo       text not null check (tipo in ('info', 'success', 'warning', 'danger')),
  categoria  text not null,
  titulo     text not null,
  descricao  text,
  link       text,
  metadata   jsonb not null default '{}'::jsonb,
  lida       boolean not null default false,
  lida_em    timestamptz,
  criada_em  timestamptz not null default now()
);
create index if not exists ix_notif_clube    on public.notificacoes (clube_id, lida, criada_em desc);
create index if not exists ix_notif_gestor   on public.notificacoes (gestor_id, lida, criada_em desc);
create index if not exists ix_notif_audience on public.notificacoes (audience, lida, criada_em desc);
