-- 0030_saques_aceite_gestor.sql
-- Reconstrução de alteração aplicada manualmente em produção e nunca versionada.
-- Definição extraída do schema de produção em 2026-09-22.
-- Registra autoria e aceite do termo na solicitação de saque.

alter table public.saques
  add column if not exists gestor_id    uuid,
  add column if not exists gestor_nome  text,
  add column if not exists aceite_em    timestamptz,
  add column if not exists aceite_texto text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.saques'::regclass
       and conname  = 'saques_gestor_id_fkey'
  ) then
    alter table public.saques
      add constraint saques_gestor_id_fkey
      foreign key (gestor_id) references auth.users (id);
  end if;
end $$;

comment on column public.saques.gestor_id    is 'auth.users.id de quem solicitou o saque.';
comment on column public.saques.gestor_nome  is 'Snapshot do nome no momento da solicitação.';
comment on column public.saques.aceite_em    is 'Momento do aceite do termo.';
comment on column public.saques.aceite_texto is 'Texto do termo aceito, para auditoria.';