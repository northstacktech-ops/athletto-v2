-- ============================================================================
-- Athletto — 0005_seeds.sql
-- APENAS dados de configuração do sistema. Nenhum dado de demonstração,
-- nenhum clube/atleta/gestor fake.
-- ============================================================================

-- ── Singleton de configurações do sistema ───────────────────────────────────
insert into public.configuracoes_sistema (id)
values ('cfg-singleton')
on conflict (id) do nothing;

-- ── Limites por plano ────────────────────────────────────────────────────────
insert into public.limites_plano (plano, max_atletas, max_turmas, max_gestores)
values
  ('basico',        30,   3,    1),
  ('intermediario', 100,  10,   3),
  ('profissional',  9999, 9999, 9999)
on conflict (plano) do update set
  max_atletas  = excluded.max_atletas,
  max_turmas   = excluded.max_turmas,
  max_gestores = excluded.max_gestores;

-- ── Superadmin owner ─────────────────────────────────────────────────────────
-- NÃO é seedado aqui: precisa que o usuário exista em auth.users primeiro.
-- Depois do signup do owner, rode no SQL Editor:
--   select public.promover_owner_por_email('email-do-owner@dominio.com', 'Nome do Owner');
