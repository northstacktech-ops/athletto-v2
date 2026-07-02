create table if not exists public.chamados_suporte (
  id         uuid primary key default gen_random_uuid(),
  clube_id   uuid references public.clubes(id) on delete set null,
  gestor_id  uuid references public.gestores(id) on delete set null,
  nome       text,
  email      text,
  assunto    text not null,
  urgencia   text not null default 'media' check (urgencia in ('baixa','media','alta')),
  descricao  text not null,
  status     text not null default 'aberto' check (status in ('aberto','em_andamento','resolvido','fechado')),
  criado_em  timestamptz not null default now()
);
create index if not exists ix_chamados_clube on public.chamados_suporte (clube_id, criado_em desc);

alter table public.chamados_suporte enable row level security;

drop policy if exists "abrir chamado" on public.chamados_suporte;
create policy "abrir chamado" on public.chamados_suporte for insert to authenticated
  with check (clube_id = public.current_clube_id() or clube_id is null);

drop policy if exists "ver chamados do clube" on public.chamados_suporte;
create policy "ver chamados do clube" on public.chamados_suporte for select
  using (clube_id = public.current_clube_id() or public.is_superadmin());
