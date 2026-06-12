-- ============================================================================
-- 0009_planejamentos_criado_por.sql
-- Corrige erro "Could not find the 'criado_por' column of 'planejamentos'":
-- o app (useFinanceiro.criarPlanejamento) insere criado_por, mas a coluna
-- nunca existiu na tabela. Adiciona a coluna + índice de FK.
-- (Aplicado no projeto via MCP em 11/06/2026; versionado aqui para reprodução.)
-- ============================================================================

alter table public.planejamentos
  add column if not exists criado_por uuid references public.gestores (id) on delete set null;

create index if not exists ix_planej_criado_por
  on public.planejamentos (criado_por);
