-- ============================================================================
-- 0043_whatsapp_regua_e_taxa_athletto.sql
--
-- Régua de cobrança via WhatsApp (mensagens_whatsapp, regua_cobranca_config)
-- + registro da taxa de transação da Athletto por cobrança (taxa_athletto).
-- Não recria `cobrancas` (só adiciona coluna) — evita a colisão de nome que
-- a spec original teria causado.
-- ============================================================================

alter table public.cobrancas
  add column if not exists taxa_athletto numeric(19,4);

comment on column public.cobrancas.taxa_athletto is
  'Taxa retida via split no Pix (percentual + fixo), calculada em server/utils/pix.ts. Null = cobrança sem split configurado.';

create table public.mensagens_whatsapp (
  id                   uuid primary key default gen_random_uuid(),
  clube_id             uuid not null references public.clubes(id) on delete cascade,
  cobranca_id          uuid not null references public.cobrancas(id) on delete cascade,
  tipo                 text not null, -- lembrete_antes | lembrete_dia | atraso_1 | atraso_3 | atraso_7 | confirmacao
  template_usado       text not null,
  status               text not null default 'pendente', -- pendente | enviada | entregue | lida | falhou
  whatsapp_message_id  text,
  erro                 text,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now(),
  unique (cobranca_id, tipo)
);
create index idx_mensagens_whatsapp_clube on public.mensagens_whatsapp(clube_id);
create index idx_mensagens_whatsapp_cobranca on public.mensagens_whatsapp(cobranca_id);
create index idx_mensagens_whatsapp_message_id on public.mensagens_whatsapp(whatsapp_message_id);

comment on constraint mensagens_whatsapp_cobranca_id_tipo_key on public.mensagens_whatsapp is
  'Garante idempotência da régua: nunca manda o mesmo tipo de lembrete duas vezes pra mesma cobrança.';

create table public.regua_cobranca_config (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid references public.clubes(id) on delete cascade, -- null = padrão da plataforma
  dias_antes    int not null default 3,
  dias_atraso   int[] not null default '{1,3,7}',
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (clube_id)
);

alter table public.mensagens_whatsapp enable row level security;
alter table public.regua_cobranca_config enable row level security;

-- Leitura: gestor vê só do próprio clube (mesma convenção de cobrancas/caixinhas).
-- Escrita: só service_role/RPC — nenhuma policy de INSERT/UPDATE/DELETE pro
-- authenticated (o gestor não grava direto nessas tabelas, igual webhook_logs).
create policy mwa_select on public.mensagens_whatsapp
  for select using (clube_id = public.current_clube_id() or public.is_superadmin());

create policy rcc_select on public.regua_cobranca_config
  for select using (clube_id is null or clube_id = public.current_clube_id() or public.is_superadmin());

-- Config padrão da plataforma (clube_id null).
insert into public.regua_cobranca_config (clube_id, dias_antes, dias_atraso, ativo)
values (null, 3, '{1,3,7}', true);
