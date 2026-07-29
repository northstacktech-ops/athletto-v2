-- ============================================================================
-- Athletto — 0033_revoke_public_execute.sql
-- As funções revogadas de `anon` em 0032 ainda tinham EXECUTE concedido a
-- PUBLIC (grant implícito padrão do Postgres em `CREATE FUNCTION`), o que
-- reabria o acesso pro anon mesmo depois do revoke (PUBLIC inclui todos os
-- papéis). Fecha de vez e reafirma o grant explícito pro `authenticated`
-- nas RPCs que o app realmente chama.
-- ============================================================================
revoke execute on function public.admin_crescimento(integer) from public;
revoke execute on function public.admin_dashboard_metricas() from public;
revoke execute on function public.admin_grafico_crescimento(integer) from public;
revoke execute on function public.admin_metricas() from public;
revoke execute on function public.alterar_plano_clube(uuid, text) from public;
revoke execute on function public.app_gerar_codigo_acesso(uuid) from public;
revoke execute on function public.ativar_planejamento(uuid, uuid) from public;
revoke execute on function public.ativar_plano_clube(uuid, text) from public;
revoke execute on function public.current_clube_id() from public;
revoke execute on function public.dashboard_home(uuid, date, date, integer) from public;
revoke execute on function public.dashboard_metricas(uuid) from public;
revoke execute on function public.dashboard_metricas(uuid, date, date) from public;
revoke execute on function public.grafico_financeiro(uuid, integer) from public;
revoke execute on function public.is_superadmin() from public;
revoke execute on function public.limites_clube(uuid) from public;
revoke execute on function public.marcar_cobranca_paga(uuid, uuid) from public;
revoke execute on function public.marcar_todas_notificacoes_lidas(uuid) from public;
revoke execute on function public.preview_propagacao_planejamento(uuid, numeric) from public;
revoke execute on function public.propagar_valor_planejamento(uuid, numeric) from public;
revoke execute on function public.ranking_frequencia(uuid, integer) from public;
revoke execute on function public.reativar_clube(uuid) from public;
revoke execute on function public.regenerar_link_pix(uuid) from public;
revoke execute on function public.suspender_clube(uuid, text) from public;
revoke execute on function public.checar_limite_gestores() from public;
revoke execute on function public.tg_criar_assinatura_trial() from public;
revoke execute on function public.tg_limite_atleta() from public;
revoke execute on function public.tg_limite_gestor() from public;
revoke execute on function public.tg_limite_turma() from public;
revoke execute on function public.tg_notif_atleta_inserido() from public;
revoke execute on function public.tg_notif_clube_novo() from public;
revoke execute on function public.tg_notif_cobranca_paga() from public;
revoke execute on function public.tg_notif_evasao() from public;
revoke execute on function public.tg_notif_indicacao() from public;
revoke execute on function public.tg_notif_voucher_aplicado() from public;

grant execute on function public.current_clube_id() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.admin_crescimento(integer) to authenticated;
grant execute on function public.admin_dashboard_metricas() to authenticated;
grant execute on function public.admin_grafico_crescimento(integer) to authenticated;
grant execute on function public.admin_metricas() to authenticated;
grant execute on function public.alterar_plano_clube(uuid, text) to authenticated;
grant execute on function public.app_gerar_codigo_acesso(uuid) to authenticated;
grant execute on function public.ativar_planejamento(uuid, uuid) to authenticated;
grant execute on function public.ativar_plano_clube(uuid, text) to authenticated;
grant execute on function public.dashboard_home(uuid, date, date, integer) to authenticated;
grant execute on function public.dashboard_metricas(uuid) to authenticated;
grant execute on function public.dashboard_metricas(uuid, date, date) to authenticated;
grant execute on function public.grafico_financeiro(uuid, integer) to authenticated;
grant execute on function public.limites_clube(uuid) to authenticated;
grant execute on function public.marcar_cobranca_paga(uuid, uuid) to authenticated;
grant execute on function public.marcar_todas_notificacoes_lidas(uuid) to authenticated;
grant execute on function public.preview_propagacao_planejamento(uuid, numeric) to authenticated;
grant execute on function public.propagar_valor_planejamento(uuid, numeric) to authenticated;
grant execute on function public.ranking_frequencia(uuid, integer) to authenticated;
grant execute on function public.reativar_clube(uuid) to authenticated;
grant execute on function public.regenerar_link_pix(uuid) to authenticated;
grant execute on function public.suspender_clube(uuid, text) to authenticated;
