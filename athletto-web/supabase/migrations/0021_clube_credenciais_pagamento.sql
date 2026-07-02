-- ============================================================================
-- Athletto — 0021_clube_credenciais_pagamento.sql
-- Modelo A: cada clube usa a PRÓPRIA conta AbacatePay (sem vínculo financeiro
-- da plataforma). Status não-sensível em clubes (visível ao cliente); o SEGREDO
-- (chave da API, cifrado em AES-256-GCM no servidor) fica em clube_credenciais
-- com RLS deny-all — só o service_role (rotas server-side) acessa.
-- ============================================================================

alter table public.clubes
  add column if not exists abacatepay_conectado boolean not null default false,
  add column if not exists abacatepay_ultimos4 text;

create table if not exists public.clube_credenciais (
  clube_id                        uuid primary key references public.clubes (id) on delete cascade,
  abacatepay_key_enc              text,
  abacatepay_webhook_secret_enc   text,
  atualizado_em                   timestamptz not null default now()
);

alter table public.clube_credenciais enable row level security;
-- Intencional: NENHUMA policy → anon/authenticated não leem nem escrevem.
revoke all on public.clube_credenciais from anon, authenticated;
