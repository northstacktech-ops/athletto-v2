-- ============================================================================
-- Athletto — 0007_app_atleta.sql
-- Backend do app mobile do atleta (login por CPF + senha por clube).
-- Mesmo projeto Supabase; só acrescenta tabelas/RPCs do fluxo do atleta.
--
-- Modelo de auth: o atleta NÃO é usuário do Supabase Auth. Os endpoints Nuxt
-- (/api/app/*) usam service_role e validam um token de sessão opaco guardado
-- (hash) em app_atleta_sessoes. As RPCs de login/senha são SECURITY DEFINER e
-- só executáveis pelo service_role (revogadas de anon/authenticated).
-- ============================================================================

set check_function_bodies = off;

-- ── Tabelas ─────────────────────────────────────────────────────────────────

create table if not exists public.app_codigos_acesso (
  id          uuid primary key default gen_random_uuid(),
  atleta_id   uuid not null references public.atletas (id) on delete cascade,
  clube_id    uuid not null references public.clubes (id) on delete cascade,
  codigo_hash text not null,
  tipo        text not null default 'primeiro_acesso' check (tipo in ('primeiro_acesso','reset')),
  expira_em   timestamptz not null,
  usado       boolean not null default false,
  usado_em    timestamptz,
  criado_por  uuid references public.gestores (id) on delete set null,
  criado_em   timestamptz not null default now()
);
create index if not exists ix_app_cod_atleta on public.app_codigos_acesso (atleta_id, usado);

create table if not exists public.app_atleta_sessoes (
  id         uuid primary key default gen_random_uuid(),
  atleta_id  uuid not null references public.atletas (id) on delete cascade,
  clube_id   uuid not null references public.clubes (id) on delete cascade,
  token_hash text not null unique,
  device     text,
  criado_em  timestamptz not null default now(),
  expira_em  timestamptz not null,
  revogado   boolean not null default false
);
create index if not exists ix_app_sess_atleta on public.app_atleta_sessoes (atleta_id);

-- RLS habilitado e SEM policies: ninguém acessa via anon/authenticated;
-- apenas o service_role (que ignora RLS) nos endpoints do servidor.
alter table public.app_codigos_acesso  enable row level security;
alter table public.app_atleta_sessoes  enable row level security;

-- ── RPC: consultar CPF → clubes vinculados ──────────────────────────────────
create or replace function public.app_consultar_cpf(p_cpf text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D', '', 'g');
  v_res json;
begin
  if v_cpf !~ '^\d{11}$' then
    return json_build_object('ok', false, 'erro', 'cpf_invalido');
  end if;

  select coalesce(json_agg(json_build_object(
           'clube_id', c.id,
           'atleta_id', a.id,
           'nome', c.nome,
           'logo_url', c.logo_url,
           'senha_definida', (a.app_senha_hash is not null)
         ) order by (a.app_senha_hash is not null), c.nome), '[]'::json)
    into v_res
    from public.atletas a
    join public.clubes c on c.id = a.clube_id
   where a.cpf = v_cpf
     and a.ativo = true
     and c.plano_ativo = true;

  return json_build_object('ok', true, 'clubes', v_res);
end;
$$;
revoke execute on function public.app_consultar_cpf(text) from public, anon, authenticated;

-- ── RPC: login (valida senha por clube) ─────────────────────────────────────
create or replace function public.app_login(p_cpf text, p_clube_id uuid, p_senha text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D', '', 'g');
  a public.atletas%rowtype;
  v_clube_ativo boolean;
begin
  select * into a from public.atletas
   where cpf = v_cpf and clube_id = p_clube_id and ativo = true;
  if not found then
    return json_build_object('ok', false, 'erro', 'nao_encontrado');
  end if;

  select plano_ativo into v_clube_ativo from public.clubes where id = p_clube_id;
  if not coalesce(v_clube_ativo, false) then
    return json_build_object('ok', false, 'erro', 'clube_inativo');
  end if;

  if a.app_senha_hash is null then
    return json_build_object('ok', false, 'erro', 'senha_nao_definida');
  end if;

  if a.app_senha_hash <> crypt(coalesce(p_senha,''), a.app_senha_hash) then
    return json_build_object('ok', false, 'erro', 'credenciais');
  end if;

  update public.atletas set app_ultimo_acesso = now() where id = a.id;

  return json_build_object('ok', true, 'atleta_id', a.id, 'clube_id', a.clube_id);
end;
$$;
revoke execute on function public.app_login(text, uuid, text) from public, anon, authenticated;

-- ── RPC: definir/redefinir senha via código do gestor ───────────────────────
create or replace function public.app_definir_senha(p_cpf text, p_clube_id uuid, p_codigo text, p_senha text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D', '', 'g');
  a public.atletas%rowtype;
  c public.app_codigos_acesso%rowtype;
begin
  select * into a from public.atletas
   where cpf = v_cpf and clube_id = p_clube_id and ativo = true;
  if not found then
    return json_build_object('ok', false, 'erro', 'nao_encontrado');
  end if;

  if length(coalesce(p_senha,'')) < 8 then
    return json_build_object('ok', false, 'erro', 'senha_curta');
  end if;

  select * into c from public.app_codigos_acesso
   where atleta_id = a.id
     and usado = false
     and expira_em > now()
     and codigo_hash = crypt(coalesce(p_codigo,''), codigo_hash)
   order by criado_em desc
   limit 1;
  if not found then
    return json_build_object('ok', false, 'erro', 'codigo_invalido');
  end if;

  update public.atletas
     set app_senha_hash = crypt(p_senha, gen_salt('bf')),
         app_senha_definida_em = now(),
         app_primeiro_acesso = false
   where id = a.id;

  update public.app_codigos_acesso set usado = true, usado_em = now() where id = c.id;

  return json_build_object('ok', true);
end;
$$;
revoke execute on function public.app_definir_senha(text, uuid, text, text) from public, anon, authenticated;

-- ── RPC: gestor gera código de acesso para um atleta ────────────────────────
create or replace function public.app_gerar_codigo_acesso(p_atleta_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_clube uuid;
  v_codigo text;
begin
  select clube_id into v_clube from public.atletas where id = p_atleta_id;
  if v_clube is null then
    raise exception 'Atleta não encontrado' using errcode = 'P0001';
  end if;
  if v_clube is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  -- Invalida códigos anteriores não usados
  update public.app_codigos_acesso
     set usado = true, usado_em = now()
   where atleta_id = p_atleta_id and usado = false;

  -- Código de 6 dígitos
  v_codigo := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.app_codigos_acesso (atleta_id, clube_id, codigo_hash, tipo, expira_em, criado_por)
  values (
    p_atleta_id, v_clube,
    crypt(v_codigo, gen_salt('bf')),
    'primeiro_acesso',
    now() + interval '24 hours',
    auth.uid()
  );

  return json_build_object('ok', true, 'codigo', v_codigo, 'expira_em', (now() + interval '24 hours'));
end;
$$;
grant execute on function public.app_gerar_codigo_acesso(uuid) to authenticated;
