-- ValidaPay: cada CLUBE = uma SUBCONTA da conta Master da Athletto.
-- Guarda o vínculo clube ↔ subconta e o status do onboarding (aprovação vem
-- por webhook). Também registra os ids de cobrança ValidaPay nas cobranças.

create table if not exists public.clube_validapay (
  clube_id        uuid primary key references public.clubes(id) on delete cascade,
  tipo            text not null default 'pf' check (tipo in ('pf','pj')),
  form_id         text,                       -- id da proposta (POST /v1/proposals)
  account_number  text,                       -- número da subconta (vem no webhook account_approved)
  branch          text,
  document_number text,
  ispb            text,
  status          text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists ix_clube_validapay_form on public.clube_validapay (form_id);
create index if not exists ix_clube_validapay_account on public.clube_validapay (account_number);

alter table public.clube_validapay enable row level security;

-- Gestor do clube lê a própria subconta; superadmin vê tudo. Escrita só via
-- service role (endpoints/webhook) — sem policy de insert/update para o gestor.
drop policy if exists "clube vê sua validapay" on public.clube_validapay;
create policy "clube vê sua validapay" on public.clube_validapay for select
  using (clube_id = public.current_clube_id() or public.is_superadmin());

-- Ids da cobrança no gateway ValidaPay (paralelo aos abacatepay_*).
alter table public.cobrancas
  add column if not exists validapay_charge_id text,
  add column if not exists validapay_emv text;

create index if not exists ix_cobr_validapay_charge on public.cobrancas (validapay_charge_id);

-- trigger updated_at (reusa a função existente do schema)
drop trigger if exists tg_clube_validapay_updated on public.clube_validapay;
create trigger tg_clube_validapay_updated
  before update on public.clube_validapay
  for each row execute function public.tg_set_atualizado_em();
