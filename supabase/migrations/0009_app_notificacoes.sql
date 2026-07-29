-- ============================================================================
-- 0009_app_notificacoes.sql
-- Notificações internas do app do atleta + preferências + lembretes de pagamento.
-- Acesso só via service_role (endpoints /api/app/*). RLS habilitada sem policies.
-- (Aplicado no projeto via MCP em 06/06/2026; versionado aqui para reprodução.)
-- ============================================================================
set check_function_bodies = off;

-- ── Notificações do atleta ──────────────────────────────────────────────────
create table if not exists public.app_notificacoes (
  id           uuid primary key default gen_random_uuid(),
  atleta_id    uuid not null references public.atletas (id) on delete cascade,
  clube_id     uuid not null references public.clubes (id) on delete cascade,
  tipo         text not null default 'clube'
                 check (tipo in ('financeiro','vencido','evento','clube','senha')),
  titulo       text not null,
  mensagem     text not null,
  detalhe      text,
  acao_label   text,
  acao_destino text,                -- ex.: 'financeiro','agenda'
  cobranca_id  uuid references public.cobrancas (id) on delete cascade,
  marco        text,                -- idempotência de lembretes: d-3,d0,atraso-1,atraso-3
  lida         boolean not null default false,
  lida_em      timestamptz,
  criada_em    timestamptz not null default now()
);
create index if not exists ix_app_notif_atleta
  on public.app_notificacoes (atleta_id, lida, criada_em desc);
-- Unique (não-parcial): NULLs são distintos, então notificações sem cobranca/marco
-- não colidem; lembretes (cobranca_id, marco) ficam idempotentes para ON CONFLICT.
create unique index if not exists ux_app_notif_cobranca_marco
  on public.app_notificacoes (cobranca_id, marco);

alter table public.app_notificacoes enable row level security;

-- ── Preferências do atleta ──────────────────────────────────────────────────
create table if not exists public.app_atleta_prefs (
  atleta_id      uuid primary key references public.atletas (id) on delete cascade,
  notif_avisos   boolean not null default true,
  notif_pagamento boolean not null default true,
  atualizado_em  timestamptz not null default now()
);
alter table public.app_atleta_prefs enable row level security;

-- ── Função: gerar lembretes de pagamento ───────────────────────────────────
-- Marcos: 3 dias antes (d-3), no dia (d0), em atraso 1 e 3 dias (atraso-1/3).
-- Idempotente via ux_app_notif_cobranca_marco. Respeita prefs.notif_pagamento.
create or replace function public.app_gerar_lembretes_pagamento()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_inseridos integer := 0;
begin
  insert into public.app_notificacoes
    (atleta_id, clube_id, tipo, titulo, mensagem, acao_label, acao_destino, cobranca_id, marco)
  select
    c.atleta_id,
    c.clube_id,
    case when (c.data_vencimento - v_hoje) < 0 then 'vencido' else 'financeiro' end,
    case (c.data_vencimento - v_hoje)
      when 3  then 'Pagamento vence em 3 dias'
      when 0  then 'Pagamento vence hoje'
      when -1 then 'Pagamento em atraso'
      when -3 then 'Pagamento em atraso há 3 dias'
    end,
    'Cobrança de R$ ' || replace(to_char(c.valor, 'FM999990.00'), '.', ',')
      || coalesce(' • ' || cx.nome, '')
      || ' • vencimento ' || to_char(c.data_vencimento, 'DD/MM'),
    'Ir para pagamentos',
    'financeiro',
    c.id,
    case (c.data_vencimento - v_hoje)
      when 3 then 'd-3' when 0 then 'd0' when -1 then 'atraso-1' when -3 then 'atraso-3'
    end
  from public.cobrancas c
  left join public.caixinhas cx on cx.id = c.caixinha_id
  left join public.app_atleta_prefs p on p.atleta_id = c.atleta_id
  where c.status = 'pendente'
    and c.data_vencimento is not null
    and (c.data_vencimento - v_hoje) in (3, 0, -1, -3)
    and coalesce(p.notif_pagamento, true) = true
  on conflict (cobranca_id, marco) do nothing;

  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$$;
revoke execute on function public.app_gerar_lembretes_pagamento() from public, anon, authenticated;
grant execute on function public.app_gerar_lembretes_pagamento() to service_role;
