-- ============================================================================
-- 0010_lgpd_kit.sql
-- Kit de conformidade LGPD: registro de consentimento + direito de acesso
-- (exportação) + direito ao esquecimento (anonimização). Funções SECURITY
-- DEFINER, executáveis só pelo service_role (endpoints do servidor).
-- (Aplicado no projeto via MCP em 06/06/2026; versionado aqui para reprodução.)
-- ============================================================================
set check_function_bodies = off;

-- Marca de anonimização (mantém integridade referencial, remove identificação).
alter table public.atletas
  add column if not exists anonimizado_em timestamptz;

-- ── Registro de consentimento (versão do documento, IP, user agent) ──────────
create table if not exists public.consentimentos (
  id          uuid primary key default gen_random_uuid(),
  atleta_id   uuid references public.atletas (id) on delete cascade,
  clube_id    uuid references public.clubes (id) on delete cascade,
  tipo        text not null,                 -- 'termos_uso','politica_privacidade','marketing'
  versao      text not null,                 -- ex.: '2026-06-06'
  aceito      boolean not null default true,
  ip_address  inet,
  user_agent  text,
  aceito_em   timestamptz not null default now()
);
create index if not exists ix_consent_atleta on public.consentimentos (atleta_id, tipo, aceito_em desc);
alter table public.consentimentos enable row level security; -- sem policies: só service_role

-- ── Direito de acesso: exporta os dados do atleta em JSON ────────────────────
create or replace function public.app_exportar_dados_atleta(p_atleta_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v json;
begin
  select json_build_object(
    'atleta', (select to_jsonb(a) - 'app_senha_hash' from public.atletas a where a.id = p_atleta_id),
    'clube', (select json_build_object('id', c.id, 'nome', c.nome)
              from public.atletas a join public.clubes c on c.id = a.clube_id where a.id = p_atleta_id),
    'turmas', (select coalesce(json_agg(t.nome), '[]'::json)
               from public.atleta_turma at join public.turmas t on t.id = at.turma_id
               where at.atleta_id = p_atleta_id and at.ativo = true),
    'cobrancas', (select coalesce(json_agg(json_build_object(
                      'valor', cb.valor, 'status', cb.status,
                      'vencimento', cb.data_vencimento, 'pagamento', cb.data_pagamento)), '[]'::json)
                  from public.cobrancas cb where cb.atleta_id = p_atleta_id),
    'frequencias_total', (select count(*) from public.frequencias f where f.atleta_id = p_atleta_id),
    'consentimentos', (select coalesce(json_agg(json_build_object(
                          'tipo', co.tipo, 'versao', co.versao, 'aceito_em', co.aceito_em)), '[]'::json)
                       from public.consentimentos co where co.atleta_id = p_atleta_id),
    'gerado_em', now()
  ) into v;
  return v;
end;
$$;
revoke execute on function public.app_exportar_dados_atleta(uuid) from public, anon, authenticated;
grant execute on function public.app_exportar_dados_atleta(uuid) to service_role;

-- ── Direito ao esquecimento: anonimiza (não apaga, preserva integridade) ─────
create or replace function public.app_anonimizar_atleta(p_atleta_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.atletas set
    nome                = 'Atleta removido',
    apelido             = null,
    cpf                 = null,
    data_nascimento     = null,
    telefone            = null,
    telefone_responsavel = null,
    email               = null,
    foto_url            = null,
    tipo_sanguineo      = null,
    historico_lesoes    = null,
    observacoes_medicas = null,
    app_senha_hash      = null,
    ativo               = false,
    anonimizado_em      = now(),
    atualizado_em       = now()
  where id = p_atleta_id;

  update public.app_atleta_sessoes set revogado = true where atleta_id = p_atleta_id;
end;
$$;
revoke execute on function public.app_anonimizar_atleta(uuid) from public, anon, authenticated;
grant execute on function public.app_anonimizar_atleta(uuid) to service_role;
