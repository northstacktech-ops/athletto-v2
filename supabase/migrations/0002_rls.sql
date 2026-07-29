-- ============================================================================
-- Athletto — 0002_rls.sql
-- Helpers de autorização + RLS habilitado em TODAS as tabelas + policies.
--
-- Helpers (SEM parâmetro — bug da versão antiga corrigido: o frontend/policies
-- jamais devem chamar is_superadmin(auth.uid()); a função usa auth.uid()
-- internamente):
--   • public.current_clube_id() → uuid do clube do gestor logado (ou null)
--   • public.is_superadmin()    → true se auth.uid() é superadmin ativo
-- ============================================================================

set check_function_bodies = off;

-- ── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.current_clube_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clube_id
    from public.gestores
   where id = auth.uid()
     and ativo = true;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.superadmins
     where id = auth.uid()
       and ativo = true
  );
$$;

grant execute on function public.current_clube_id() to authenticated, anon;
grant execute on function public.is_superadmin() to authenticated, anon;

-- ── Habilitar RLS em todas as tabelas ───────────────────────────────────────

alter table public.clubes                 enable row level security;
alter table public.gestores               enable row level security;
alter table public.atletas                enable row level security;
alter table public.turmas                 enable row level security;
alter table public.atleta_turma           enable row level security;
alter table public.frequencias            enable row level security;
alter table public.alertas_evasao         enable row level security;
alter table public.eventos_calendario     enable row level security;
alter table public.planejamentos          enable row level security;
alter table public.planejamento_atletas   enable row level security;
alter table public.caixinhas              enable row level security;
alter table public.cobrancas              enable row level security;
alter table public.transacoes             enable row level security;
alter table public.superadmins            enable row level security;
alter table public.assinaturas            enable row level security;
alter table public.vouchers               enable row level security;
alter table public.indicacoes             enable row level security;
alter table public.webhook_logs           enable row level security;
alter table public.logs_auditoria         enable row level security;
alter table public.configuracoes_sistema  enable row level security;
alter table public.movimentacoes_sistema  enable row level security;
alter table public.limites_plano          enable row level security;
alter table public.notificacoes           enable row level security;

-- ============================================================================
-- CLUBES
-- Leitura: gestor do clube ou superadmin. Leitura pública apenas da página de
-- cadastro é feita por policy separada (clube ativo, campos não sensíveis são
-- responsabilidade do select do front; quem precisa de mais usa RPC).
-- ============================================================================

drop policy if exists clubes_select        on public.clubes;
drop policy if exists clubes_select_public on public.clubes;
drop policy if exists clubes_insert        on public.clubes;
drop policy if exists clubes_update        on public.clubes;
drop policy if exists clubes_delete        on public.clubes;

create policy clubes_select on public.clubes
  for select
  using (id = public.current_clube_id() or public.is_superadmin());

-- Página pública /cadastro/[slug]: anon precisa ler o clube ativo pelo slug
-- (e o onboarding precisa checar se o slug já existe — retorna 0 linhas sem 403).
create policy clubes_select_public on public.clubes
  for select
  using (plano_ativo = true);

-- INSERT direto bloqueado para gestores: a criação de clube acontece via RPC
-- security definer (onboarding_criar_clube_gestor). Superadmin pode inserir.
create policy clubes_insert on public.clubes
  for insert
  with check (public.is_superadmin());

create policy clubes_update on public.clubes
  for update
  using (id = public.current_clube_id() or public.is_superadmin())
  with check (id = public.current_clube_id() or public.is_superadmin());

create policy clubes_delete on public.clubes
  for delete
  using (public.is_superadmin());

-- ============================================================================
-- GESTORES
-- ============================================================================

drop policy if exists gestores_select on public.gestores;
drop policy if exists gestores_insert on public.gestores;
drop policy if exists gestores_update on public.gestores;
drop policy if exists gestores_delete on public.gestores;

create policy gestores_select on public.gestores
  for select
  using (
    id = auth.uid()
    or clube_id = public.current_clube_id()
    or public.is_superadmin()
  );

create policy gestores_insert on public.gestores
  for insert
  with check (clube_id = public.current_clube_id() or public.is_superadmin());

create policy gestores_update on public.gestores
  for update
  using (id = auth.uid() or clube_id = public.current_clube_id() or public.is_superadmin())
  with check (clube_id = public.current_clube_id() or public.is_superadmin());

create policy gestores_delete on public.gestores
  for delete
  using (clube_id = public.current_clube_id() or public.is_superadmin());

-- ============================================================================
-- TABELAS MULTI-TENANT (filtro direto por clube_id)
-- atletas, turmas, frequencias, alertas_evasao, eventos_calendario,
-- planejamentos, caixinhas, cobrancas, transacoes
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'atletas','turmas','frequencias','alertas_evasao','eventos_calendario',
    'planejamentos','caixinhas','cobrancas','transacoes'
  ] loop
    execute format('drop policy if exists %1$s_select on public.%1$I', t);
    execute format('drop policy if exists %1$s_insert on public.%1$I', t);
    execute format('drop policy if exists %1$s_update on public.%1$I', t);
    execute format('drop policy if exists %1$s_delete on public.%1$I', t);
    execute format('drop policy if exists %1$s_modify on public.%1$I', t);

    execute format($f$
      create policy %1$s_select on public.%1$I for select
        using (clube_id = public.current_clube_id() or public.is_superadmin());
    $f$, t);
    execute format($f$
      create policy %1$s_insert on public.%1$I for insert
        with check (clube_id = public.current_clube_id() or public.is_superadmin());
    $f$, t);
    execute format($f$
      create policy %1$s_update on public.%1$I for update
        using (clube_id = public.current_clube_id() or public.is_superadmin())
        with check (clube_id = public.current_clube_id() or public.is_superadmin());
    $f$, t);
    execute format($f$
      create policy %1$s_delete on public.%1$I for delete
        using (clube_id = public.current_clube_id() or public.is_superadmin());
    $f$, t);
  end loop;
end $$;

-- Página pública /cadastro/[slug] lista turmas ativas do clube
drop policy if exists turmas_select_public on public.turmas;
create policy turmas_select_public on public.turmas
  for select
  using (
    ativo = true
    and exists (
      select 1 from public.clubes c
       where c.id = turmas.clube_id and c.plano_ativo = true
    )
  );

-- ============================================================================
-- TABELAS DE JUNÇÃO (clube derivado via atleta)
-- ============================================================================

drop policy if exists at_select on public.atleta_turma;
drop policy if exists at_insert on public.atleta_turma;
drop policy if exists at_update on public.atleta_turma;
drop policy if exists at_delete on public.atleta_turma;
drop policy if exists at_modify on public.atleta_turma;

create policy at_select on public.atleta_turma
  for select
  using (
    public.is_superadmin()
    or exists (select 1 from public.atletas a
                where a.id = atleta_turma.atleta_id
                  and a.clube_id = public.current_clube_id())
  );
create policy at_insert on public.atleta_turma
  for insert
  with check (
    public.is_superadmin()
    or exists (select 1 from public.atletas a
                where a.id = atleta_turma.atleta_id
                  and a.clube_id = public.current_clube_id())
  );
create policy at_update on public.atleta_turma
  for update
  using (
    public.is_superadmin()
    or exists (select 1 from public.atletas a
                where a.id = atleta_turma.atleta_id
                  and a.clube_id = public.current_clube_id())
  )
  with check (
    public.is_superadmin()
    or exists (select 1 from public.atletas a
                where a.id = atleta_turma.atleta_id
                  and a.clube_id = public.current_clube_id())
  );
create policy at_delete on public.atleta_turma
  for delete
  using (
    public.is_superadmin()
    or exists (select 1 from public.atletas a
                where a.id = atleta_turma.atleta_id
                  and a.clube_id = public.current_clube_id())
  );

drop policy if exists pa_select on public.planejamento_atletas;
drop policy if exists pa_insert on public.planejamento_atletas;
drop policy if exists pa_update on public.planejamento_atletas;
drop policy if exists pa_delete on public.planejamento_atletas;
drop policy if exists pa_modify on public.planejamento_atletas;

create policy pa_select on public.planejamento_atletas
  for select
  using (
    public.is_superadmin()
    or exists (select 1 from public.planejamentos p
                where p.id = planejamento_atletas.planejamento_id
                  and p.clube_id = public.current_clube_id())
  );
create policy pa_insert on public.planejamento_atletas
  for insert
  with check (
    public.is_superadmin()
    or exists (select 1 from public.planejamentos p
                where p.id = planejamento_atletas.planejamento_id
                  and p.clube_id = public.current_clube_id())
  );
create policy pa_update on public.planejamento_atletas
  for update
  using (
    public.is_superadmin()
    or exists (select 1 from public.planejamentos p
                where p.id = planejamento_atletas.planejamento_id
                  and p.clube_id = public.current_clube_id())
  )
  with check (
    public.is_superadmin()
    or exists (select 1 from public.planejamentos p
                where p.id = planejamento_atletas.planejamento_id
                  and p.clube_id = public.current_clube_id())
  );
create policy pa_delete on public.planejamento_atletas
  for delete
  using (
    public.is_superadmin()
    or exists (select 1 from public.planejamentos p
                where p.id = planejamento_atletas.planejamento_id
                  and p.clube_id = public.current_clube_id())
  );

-- ============================================================================
-- SUPERADMINS
-- ============================================================================

drop policy if exists sa_select on public.superadmins;
drop policy if exists sa_insert on public.superadmins;
drop policy if exists sa_update on public.superadmins;
drop policy if exists sa_delete on public.superadmins;
drop policy if exists sa_self_or_super on public.superadmins;
drop policy if exists sa_modify on public.superadmins;

-- O próprio user precisa ler sua linha para o front detectar "sou admin?"
create policy sa_select on public.superadmins
  for select
  using (id = auth.uid() or public.is_superadmin());

create policy sa_insert on public.superadmins
  for insert
  with check (public.is_superadmin());

create policy sa_update on public.superadmins
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy sa_delete on public.superadmins
  for delete
  using (public.is_superadmin());

-- ============================================================================
-- ASSINATURAS — gestor lê a do seu clube; admin gerencia todas
-- ============================================================================

drop policy if exists assin_select on public.assinaturas;
drop policy if exists assin_insert on public.assinaturas;
drop policy if exists assin_update on public.assinaturas;
drop policy if exists assin_delete on public.assinaturas;
drop policy if exists assin_modify on public.assinaturas;

create policy assin_select on public.assinaturas
  for select
  using (clube_id = public.current_clube_id() or public.is_superadmin());

create policy assin_insert on public.assinaturas
  for insert
  with check (public.is_superadmin());

create policy assin_update on public.assinaturas
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy assin_delete on public.assinaturas
  for delete
  using (public.is_superadmin());

-- ============================================================================
-- VOUCHERS — gestor lê os do clube; admin gerencia
-- ============================================================================

drop policy if exists vch_select on public.vouchers;
drop policy if exists vch_insert on public.vouchers;
drop policy if exists vch_update on public.vouchers;
drop policy if exists vch_delete on public.vouchers;
drop policy if exists vch_modify on public.vouchers;

create policy vch_select on public.vouchers
  for select
  using (clube_id = public.current_clube_id() or public.is_superadmin());

create policy vch_insert on public.vouchers
  for insert
  with check (public.is_superadmin());

create policy vch_update on public.vouchers
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy vch_delete on public.vouchers
  for delete
  using (public.is_superadmin());

-- ============================================================================
-- INDICACOES — gestor cria/lê as próprias; admin aprova/rejeita
-- ============================================================================

drop policy if exists ind_select        on public.indicacoes;
drop policy if exists ind_insert_gestor on public.indicacoes;
drop policy if exists ind_update_admin  on public.indicacoes;
drop policy if exists ind_delete_admin  on public.indicacoes;
drop policy if exists ind_modify_admin  on public.indicacoes;

create policy ind_select on public.indicacoes
  for select
  using (clube_indicador_id = public.current_clube_id() or public.is_superadmin());

create policy ind_insert_gestor on public.indicacoes
  for insert
  with check (clube_indicador_id = public.current_clube_id() or public.is_superadmin());

create policy ind_update_admin on public.indicacoes
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy ind_delete_admin on public.indicacoes
  for delete
  using (public.is_superadmin());

-- ============================================================================
-- WEBHOOK_LOGS — apenas superadmin (o server usa service_role, que ignora RLS)
-- ============================================================================

drop policy if exists wh_select on public.webhook_logs;
drop policy if exists wh_insert on public.webhook_logs;
drop policy if exists wh_update on public.webhook_logs;
drop policy if exists wh_delete on public.webhook_logs;
drop policy if exists wh_admin  on public.webhook_logs;

create policy wh_select on public.webhook_logs
  for select using (public.is_superadmin());
create policy wh_insert on public.webhook_logs
  for insert with check (public.is_superadmin());
create policy wh_update on public.webhook_logs
  for update using (public.is_superadmin()) with check (public.is_superadmin());
create policy wh_delete on public.webhook_logs
  for delete using (public.is_superadmin());

-- ============================================================================
-- LOGS_AUDITORIA — admin lê; qualquer autenticado pode inserir (trilha)
-- ============================================================================

drop policy if exists audit_select on public.logs_auditoria;
drop policy if exists audit_insert on public.logs_auditoria;
drop policy if exists audit_update on public.logs_auditoria;
drop policy if exists audit_delete on public.logs_auditoria;
drop policy if exists audit_admin  on public.logs_auditoria;

create policy audit_select on public.logs_auditoria
  for select using (public.is_superadmin());
create policy audit_insert on public.logs_auditoria
  for insert with check (auth.uid() is not null);
create policy audit_update on public.logs_auditoria
  for update using (public.is_superadmin()) with check (public.is_superadmin());
create policy audit_delete on public.logs_auditoria
  for delete using (public.is_superadmin());

-- ============================================================================
-- CONFIGURACOES_SISTEMA — apenas superadmin
-- ============================================================================

drop policy if exists cfg_select on public.configuracoes_sistema;
drop policy if exists cfg_insert on public.configuracoes_sistema;
drop policy if exists cfg_update on public.configuracoes_sistema;
drop policy if exists cfg_delete on public.configuracoes_sistema;
drop policy if exists cfg_modify on public.configuracoes_sistema;

create policy cfg_select on public.configuracoes_sistema
  for select using (public.is_superadmin());
create policy cfg_insert on public.configuracoes_sistema
  for insert with check (public.is_superadmin());
create policy cfg_update on public.configuracoes_sistema
  for update using (public.is_superadmin()) with check (public.is_superadmin());
create policy cfg_delete on public.configuracoes_sistema
  for delete using (public.is_superadmin());

-- ============================================================================
-- MOVIMENTACOES_SISTEMA — apenas superadmin
-- ============================================================================

drop policy if exists sysmov_select on public.movimentacoes_sistema;
drop policy if exists sysmov_insert on public.movimentacoes_sistema;
drop policy if exists sysmov_update on public.movimentacoes_sistema;
drop policy if exists sysmov_delete on public.movimentacoes_sistema;
drop policy if exists sysmov_admin  on public.movimentacoes_sistema;

create policy sysmov_select on public.movimentacoes_sistema
  for select using (public.is_superadmin());
create policy sysmov_insert on public.movimentacoes_sistema
  for insert with check (public.is_superadmin());
create policy sysmov_update on public.movimentacoes_sistema
  for update using (public.is_superadmin()) with check (public.is_superadmin());
create policy sysmov_delete on public.movimentacoes_sistema
  for delete using (public.is_superadmin());

-- ============================================================================
-- LIMITES_PLANO — leitura aberta (a UI mostra limites); escrita só admin
-- ============================================================================

drop policy if exists limites_select on public.limites_plano;
drop policy if exists limites_insert on public.limites_plano;
drop policy if exists limites_update on public.limites_plano;
drop policy if exists limites_delete on public.limites_plano;
drop policy if exists "limites_select_all"  on public.limites_plano;
drop policy if exists "limites_write_admin" on public.limites_plano;

create policy limites_select on public.limites_plano
  for select using (true);
create policy limites_insert on public.limites_plano
  for insert with check (public.is_superadmin());
create policy limites_update on public.limites_plano
  for update using (public.is_superadmin()) with check (public.is_superadmin());
create policy limites_delete on public.limites_plano
  for delete using (public.is_superadmin());

-- ============================================================================
-- NOTIFICACOES
-- Leitura/Update: gestor vê as do seu clube (ou direcionadas a ele);
-- superadmin vê audience='superadmin' e tudo o mais.
-- Insert: feito por triggers/funcoes security definer (e superadmin).
-- ============================================================================

drop policy if exists notif_select on public.notificacoes;
drop policy if exists notif_insert on public.notificacoes;
drop policy if exists notif_update on public.notificacoes;
drop policy if exists notif_delete on public.notificacoes;
drop policy if exists "notif_select_gestor"  on public.notificacoes;
drop policy if exists "notif_update_gestor"  on public.notificacoes;
drop policy if exists "notif_insert_service" on public.notificacoes;
drop policy if exists "notif_delete_admin"   on public.notificacoes;

create policy notif_select on public.notificacoes
  for select
  using (
    public.is_superadmin()
    or (
      audience = 'gestor'
      and (
        gestor_id = auth.uid()
        or (gestor_id is null and clube_id = public.current_clube_id())
      )
    )
  );

create policy notif_update on public.notificacoes
  for update
  using (
    public.is_superadmin()
    or (
      audience = 'gestor'
      and (
        gestor_id = auth.uid()
        or (gestor_id is null and clube_id = public.current_clube_id())
      )
    )
  )
  with check (
    public.is_superadmin()
    or (
      audience = 'gestor'
      and (
        gestor_id = auth.uid()
        or (gestor_id is null and clube_id = public.current_clube_id())
      )
    )
  );

create policy notif_insert on public.notificacoes
  for insert
  with check (public.is_superadmin());

create policy notif_delete on public.notificacoes
  for delete
  using (public.is_superadmin());
