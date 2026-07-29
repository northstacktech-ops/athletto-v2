-- Índices de performance/escalabilidade (todos aditivos, idempotentes).
-- Cobrem JOINs, filtros e ordenações usados nas queries/RPCs mais quentes.
-- Aplicar: já incluído no projeto; rode via `supabase db push` ou MCP apply_migration.

-- frequencias: JOIN por turma + período (FrequenciaHistorico, detalhe da turma)
create index if not exists ix_freq_turma_data
  on public.frequencias (turma_id, data desc);

-- frequencias: agregação por clube+atleta (ranking_frequencia, calcularPresenca)
create index if not exists ix_freq_clube_atleta
  on public.frequencias (clube_id, atleta_id, presente);

-- cobrancas: cobranças em aberto de um atleta (entrada vinculada, detalhe)
create index if not exists ix_cobr_atleta_status
  on public.cobrancas (atleta_id, status);

-- cobrancas: vencimento sem filtro de status (relatórios/dashboard)
create index if not exists ix_cobr_data_vencimento
  on public.cobrancas (data_vencimento);

-- alertas_evasao: ordenação por data (dashboard_home ordena recentes)
create index if not exists ix_alertas_data_deteccao
  on public.alertas_evasao (data_deteccao desc);

-- transacoes: filtro por categoria (extrato/relatórios)
create index if not exists ix_tx_categoria
  on public.transacoes (categoria);

-- caixinhas: lista por clube com ordenação (aba Caixinhas)
create index if not exists ix_caixinhas_clube_criada
  on public.caixinhas (clube_id, criada_em desc);
