-- ============================================================================
-- Athletto — 0042_reforcar_revoke_execute_rpcs_mensalidade.sql
--
-- As RPCs novas desta feature (0036) tinham `revoke ... from public` logo na
-- criação, mas o advisor de segurança (get_advisors) mostrou depois que
-- `anon` ainda conseguia executar todas elas. Causa: cada `CREATE OR REPLACE
-- FUNCTION` de correção subsequente (0037) reabre o EXECUTE pra PUBLIC por
-- padrão do Postgres — o mesmo gotcha que 0033_revoke_public_execute já
-- tinha documentado, só que dessa vez sem reaplicar o revoke depois de cada
-- fix. Lição: toda vez que uma SECURITY DEFINER function existente for
-- redefinida (create or replace), reafirmar revoke/grant na mesma migration.
-- ============================================================================

revoke execute on function public.criar_planejamento_mensalidade_turma(uuid) from public, anon;
revoke execute on function public.atleta_entrar_turma(uuid, uuid) from public, anon;
revoke execute on function public.atleta_sair_turma(uuid, uuid) from public, anon;
revoke execute on function public.adicionar_atleta_caixinha_parcelada(uuid, uuid, text) from public, anon;

grant execute on function public.criar_planejamento_mensalidade_turma(uuid) to authenticated;
grant execute on function public.atleta_entrar_turma(uuid, uuid) to authenticated;
grant execute on function public.atleta_sair_turma(uuid, uuid) to authenticated;
grant execute on function public.adicionar_atleta_caixinha_parcelada(uuid, uuid, text) to authenticated;

revoke execute on function public.gerar_cobrancas_mensalidade_mes_atual() from public, anon, authenticated;
