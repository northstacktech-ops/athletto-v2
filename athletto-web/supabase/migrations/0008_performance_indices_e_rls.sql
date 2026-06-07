-- ============================================================================
-- 0008_performance_indices_e_rls.sql
-- Performance: índices de FK ausentes + junções + otimização de RLS initplan.
-- Gerado a partir dos advisors de performance (Supabase Database Linter).
-- (Aplicado no projeto via MCP em 06/06/2026; versionado aqui para reprodução.)
-- ============================================================================

-- 1) Índice de junção que faltava: atleta_turma já tem ix por turma_id,
--    mas não por atleta_id (usado ao listar turmas de um atleta).
create index if not exists ix_atleta_turma_atleta
  on public.atleta_turma (atleta_id);

-- 2) planejamento_atletas: já tem ix por atleta_id, faltava por planejamento_id
create index if not exists ix_pa_planejamento
  on public.planejamento_atletas (planejamento_id);

-- 3) Foreign keys sem índice de cobertura (advisors: unindexed_foreign_keys)
create index if not exists ix_alertas_dispensado_por
  on public.alertas_evasao (dispensado_por);
create index if not exists ix_app_sessoes_clube
  on public.app_atleta_sessoes (clube_id);
create index if not exists ix_app_cod_clube
  on public.app_codigos_acesso (clube_id);
create index if not exists ix_app_cod_criado_por
  on public.app_codigos_acesso (criado_por);
create index if not exists ix_config_atualizado_por
  on public.configuracoes_sistema (atualizado_por);
create index if not exists ix_eventos_criado_por
  on public.eventos_calendario (criado_por);
create index if not exists ix_freq_registrado_por
  on public.frequencias (registrado_por);
create index if not exists ix_ind_aprovada_por
  on public.indicacoes (aprovada_por);
create index if not exists ix_ind_clube_indicado
  on public.indicacoes (clube_indicado_id);
create index if not exists ix_ind_rejeitada_por
  on public.indicacoes (rejeitada_por);
create index if not exists ix_ind_voucher_emitido
  on public.indicacoes (voucher_emitido_id);
create index if not exists ix_sysmov_assinatura
  on public.movimentacoes_sistema (assinatura_id);
create index if not exists ix_sysmov_registrado_por
  on public.movimentacoes_sistema (registrado_por);
create index if not exists ix_tx_registrado_por
  on public.transacoes (registrado_por);
create index if not exists ix_vch_emitido_por
  on public.vouchers (emitido_por);
create index if not exists ix_vch_revogado_por
  on public.vouchers (revogado_por);

-- 4) RLS initplan: envolver auth.uid() em (select auth.uid()) para que o
--    planner avalie a função UMA vez por query, não por linha.
--    (Mantém exatamente a mesma lógica de autorização.)
alter policy gestores_select on public.gestores
  using (((id = (select auth.uid())) or (clube_id = current_clube_id()) or is_superadmin()));

alter policy gestores_update on public.gestores
  using (((id = (select auth.uid())) or (clube_id = current_clube_id()) or is_superadmin()))
  with check (((clube_id = current_clube_id()) or is_superadmin()));

alter policy sa_select on public.superadmins
  using (((id = (select auth.uid())) or is_superadmin()));

alter policy audit_insert on public.logs_auditoria
  with check (((select auth.uid()) is not null));

alter policy notif_select on public.notificacoes
  using ((is_superadmin() or ((audience = 'gestor'::text) and ((gestor_id = (select auth.uid())) or ((gestor_id is null) and (clube_id = current_clube_id()))))));

alter policy notif_update on public.notificacoes
  using ((is_superadmin() or ((audience = 'gestor'::text) and ((gestor_id = (select auth.uid())) or ((gestor_id is null) and (clube_id = current_clube_id()))))))
  with check ((is_superadmin() or ((audience = 'gestor'::text) and ((gestor_id = (select auth.uid())) or ((gestor_id is null) and (clube_id = current_clube_id()))))));
