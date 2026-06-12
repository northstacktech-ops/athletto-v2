-- ============================================================================
-- 0012_habilitar_pg_cron_e_agendar_rotinas.sql
-- P0.1 do REVIEW-FUNCIONALIDADES-2026-06: as rotinas existiam desde a 0003 mas
-- o pg_cron nunca foi habilitado — cobranças recorrentes não renovavam,
-- evasões não eram detectadas e notificações automáticas não saíam.
-- (Aplicado no projeto via MCP em 11/06/2026; versionado aqui para reprodução.)
-- ============================================================================

create extension if not exists pg_cron;

-- Horários em UTC: 09 UTC = 06h BRT (cobranças antes do expediente),
-- 11 UTC = 08h BRT (evasões), 12 UTC = 09h BRT (notificações).
select cron.schedule('athletto_cobrancas',    '0 9 * * *',  $$select public.gerar_cobrancas_recorrentes()$$);
select cron.schedule('athletto_evasoes',      '0 11 * * *', $$select public.detectar_evasoes()$$);
select cron.schedule('athletto_notificacoes', '0 12 * * *', $$select public.processar_notificacoes()$$);

-- Obs.: processar_notificacoes() já chama notificar_trials_vencendo() e
-- notificar_cobrancas_vencidas(). O cron da Vercel (vercel.json) segue
-- responsável apenas por app_gerar_lembretes_pagamento (app do atleta).
