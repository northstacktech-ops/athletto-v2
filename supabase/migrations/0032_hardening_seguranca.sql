-- ============================================================================
-- Athletto — 0032_hardening_seguranca.sql
-- Hardening baseado nos advisors do Supabase (2026-07-02):
--  1. Índices de FK faltantes (performance)
--  2. Policy RLS de `saques` reavaliando auth.uid() por linha (performance)
--  3. Buckets públicos permitindo listagem irrestrita (segurança)
--  4. REVOKE de EXECUTE de funções SECURITY DEFINER que não precisam ser
--     públicas — só pro `anon`; nada muda pro `authenticated` nas RPCs de
--     uso normal do app (a maioria já se protege internamente com
--     is_superadmin()/current_clube_id(), mas anon não precisa nem tentar).
--     Exceção: funções de trigger (tg_*) são revogadas de anon E
--     authenticated — nunca devem ser chamadas via RPC direto.
-- ============================================================================

-- ── 1. Índices de FK faltantes ───────────────────────────────────────────────
create index if not exists ix_chamados_suporte_gestor_id on public.chamados_suporte (gestor_id);
create index if not exists ix_gestores_convidado_por     on public.gestores (convidado_por);
create index if not exists ix_logs_gestao_gestor_id      on public.logs_gestao (gestor_id);
create index if not exists ix_saques_gestor_id           on public.saques (gestor_id);

-- ── 2. RLS de saques: auth.uid() por linha → (select auth.uid()) ────────────
drop policy if exists "Gestor le saques do seu clube" on public.saques;
create policy "Gestor le saques do seu clube" on public.saques
  for select
  using (
    clube_id in (
      select gestores.clube_id from public.gestores
      where gestores.id = (select auth.uid()) and gestores.ativo = true
    )
  );

-- ── 3. Buckets públicos: SELECT deixa de permitir listagem irrestrita ───────
-- Leitura de objeto por URL pública não passa por esta policy (bucket
-- público de verdade, servido pelo CDN de storage) — só afeta list()/get()
-- via API autenticada. Mesmo predicado usado em update/delete.
drop policy if exists "athletto_avatares_select" on storage.objects;
create policy "athletto_avatares_select" on storage.objects
  for select
  using (
    bucket_id = 'avatares'
    and (
      is_superadmin()
      or (storage.foldername(name))[1] = (current_clube_id())::text
      or (storage.foldername(name))[1] = (auth.uid())::text
    )
  );

drop policy if exists "athletto_logos_select" on storage.objects;
create policy "athletto_logos_select" on storage.objects
  for select
  using (
    bucket_id = 'logos'
    and (
      is_superadmin()
      or (storage.foldername(name))[1] = (current_clube_id())::text
    )
  );

-- ── 4. Revoke de EXECUTE do `anon` em RPCs internas (não públicas) ──────────
revoke execute on function public.admin_crescimento(integer) from anon;
revoke execute on function public.admin_dashboard_metricas() from anon;
revoke execute on function public.admin_grafico_crescimento(integer) from anon;
revoke execute on function public.admin_metricas() from anon;
revoke execute on function public.alterar_plano_clube(uuid, text) from anon;
revoke execute on function public.app_gerar_codigo_acesso(uuid) from anon;
revoke execute on function public.ativar_planejamento(uuid, uuid) from anon;
revoke execute on function public.ativar_plano_clube(uuid, text) from anon;
revoke execute on function public.current_clube_id() from anon;
revoke execute on function public.dashboard_home(uuid, date, date, integer) from anon;
revoke execute on function public.dashboard_metricas(uuid) from anon;
revoke execute on function public.dashboard_metricas(uuid, date, date) from anon;
revoke execute on function public.grafico_financeiro(uuid, integer) from anon;
revoke execute on function public.is_superadmin() from anon;
revoke execute on function public.limites_clube(uuid) from anon;
revoke execute on function public.marcar_cobranca_paga(uuid, uuid) from anon;
revoke execute on function public.marcar_todas_notificacoes_lidas(uuid) from anon;
revoke execute on function public.preview_propagacao_planejamento(uuid, numeric) from anon;
revoke execute on function public.propagar_valor_planejamento(uuid, numeric) from anon;
revoke execute on function public.ranking_frequencia(uuid, integer) from anon;
revoke execute on function public.reativar_clube(uuid) from anon;
revoke execute on function public.regenerar_link_pix(uuid) from anon;
revoke execute on function public.suspender_clube(uuid, text) from anon;

-- Trigger functions: nunca chamadas via RPC direto — revoke de anon e authenticated.
revoke execute on function public.checar_limite_gestores() from anon, authenticated;
revoke execute on function public.tg_criar_assinatura_trial() from anon, authenticated;
revoke execute on function public.tg_limite_atleta() from anon, authenticated;
revoke execute on function public.tg_limite_gestor() from anon, authenticated;
revoke execute on function public.tg_limite_turma() from anon, authenticated;
revoke execute on function public.tg_notif_atleta_inserido() from anon, authenticated;
revoke execute on function public.tg_notif_clube_novo() from anon, authenticated;
revoke execute on function public.tg_notif_cobranca_paga() from anon, authenticated;
revoke execute on function public.tg_notif_evasao() from anon, authenticated;
revoke execute on function public.tg_notif_indicacao() from anon, authenticated;
revoke execute on function public.tg_notif_voucher_aplicado() from anon, authenticated;

-- NÃO tocado (uso legítimo por anon): cadastro_publico_atleta (formulário
-- público de cadastro via slug do clube) e onboarding_criar_clube_gestor
-- (self-serve signup de clube novo).
