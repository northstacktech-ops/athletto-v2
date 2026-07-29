-- ============================================================================
-- 0010_performance_fk_indices_e_policies.sql
-- Performance: índices de FK ausentes + consolidação de policies permissivas
-- duplicadas (advisors do Supabase Database Linter).
-- (Aplicado no projeto via MCP em 11/06/2026; versionado aqui para reprodução.)
-- ============================================================================

-- 1) FKs sem índice de cobertura (advisors: unindexed_foreign_keys)
create index if not exists ix_app_notif_clube
  on public.app_notificacoes (clube_id);
create index if not exists ix_consent_clube
  on public.consentimentos (clube_id);

-- 2) Multiple permissive policies (advisors): duas policies permissivas de
--    SELECT na mesma tabela são avaliadas em TODA query. Consolidamos em uma
--    só com OR — exatamente a mesma lógica de autorização.
drop policy if exists clubes_select_public on public.clubes;
alter policy clubes_select on public.clubes
  using ((id = current_clube_id()) or is_superadmin() or (plano_ativo = true));

drop policy if exists turmas_select_public on public.turmas;
alter policy turmas_select on public.turmas
  using (
    (clube_id = current_clube_id())
    or is_superadmin()
    or (
      ativo = true
      and exists (
        select 1 from public.clubes c
        where c.id = turmas.clube_id and c.plano_ativo = true
      )
    )
  );
