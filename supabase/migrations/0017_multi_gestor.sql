-- Multi-gestor: campos de convite, limite de 3 ativos por clube e logs de gestão.

alter table public.gestores
  add column if not exists precisa_definir_senha boolean not null default false,
  add column if not exists convidado_por uuid references public.gestores(id) on delete set null,
  add column if not exists convidado_em  timestamptz;

-- Limite de 3 gestores ATIVOS por clube (o principal + até 2 adicionais).
create or replace function public.checar_limite_gestores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qtd int;
begin
  if (TG_OP = 'INSERT' and new.ativo) or (TG_OP = 'UPDATE' and new.ativo and not old.ativo) then
    select count(*) into v_qtd from public.gestores
     where clube_id = new.clube_id and ativo = true and id <> new.id;
    if v_qtd >= 3 then
      raise exception 'Limite de 3 gestores ativos por clube atingido' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limite_gestores on public.gestores;
create trigger trg_limite_gestores
  before insert or update on public.gestores
  for each row execute function public.checar_limite_gestores();

-- Logs de gestão: o que cada gestor faz no clube.
create table if not exists public.logs_gestao (
  id          uuid primary key default gen_random_uuid(),
  clube_id    uuid not null references public.clubes(id) on delete cascade,
  gestor_id   uuid references public.gestores(id) on delete set null,
  gestor_nome text,
  acao        text not null,
  entidade    text,
  entidade_id uuid,
  dados       jsonb,
  criado_em   timestamptz not null default now()
);
create index if not exists ix_logs_gestao_clube on public.logs_gestao (clube_id, criado_em desc);

alter table public.logs_gestao enable row level security;

drop policy if exists "logs do clube" on public.logs_gestao;
create policy "logs do clube" on public.logs_gestao for select
  using (clube_id = public.current_clube_id() or public.is_superadmin());

drop policy if exists "gestor registra log" on public.logs_gestao;
create policy "gestor registra log" on public.logs_gestao for insert
  with check (clube_id = public.current_clube_id());
