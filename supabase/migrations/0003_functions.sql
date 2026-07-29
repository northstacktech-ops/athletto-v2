-- ============================================================================
-- Athletto — 0003_functions.sql
-- RPCs e triggers de negócio.
--
-- AGENDAMENTO (sem pg_cron nesta migration — pode não estar habilitado):
--   As funções abaixo são chamáveis manualmente ou por um scheduler externo
--   (Vercel Cron / GitHub Actions / Supabase Edge Function agendada):
--     • select public.detectar_evasoes();
--     • select public.processar_notificacoes();
--     • select public.gerar_cobrancas_recorrentes();
--   Se quiser usar pg_cron depois (Dashboard → Database → Extensions):
--     select cron.schedule('athletto_evasoes',      '0 11 * * *', $$select public.detectar_evasoes()$$);
--     select cron.schedule('athletto_notificacoes', '0 12 * * *', $$select public.processar_notificacoes()$$);
--     select cron.schedule('athletto_cobrancas',    '0 9 * * *',  $$select public.gerar_cobrancas_recorrentes()$$);
-- ============================================================================

set check_function_bodies = off;

-- ============================================================================
-- 1. NOTIFICAÇÕES — utilitário interno + RPC do front
-- ============================================================================

create or replace function public.criar_notificacao(
  p_clube_id   uuid,
  p_gestor_id  uuid,
  p_audience   text,
  p_tipo       text,
  p_categoria  text,
  p_titulo     text,
  p_descricao  text default null,
  p_link       text default null,
  p_metadata   jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notificacoes
    (clube_id, gestor_id, audience, tipo, categoria, titulo, descricao, link, metadata)
  values
    (p_clube_id, p_gestor_id, coalesce(p_audience, 'gestor'),
     p_tipo, p_categoria, p_titulo, p_descricao, p_link, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- Não exposta diretamente ao client (uso interno por triggers/funcoes)
revoke execute on function public.criar_notificacao(uuid, uuid, text, text, text, text, text, text, jsonb) from public, anon, authenticated;

-- RPC do front: marcar todas as notificações como lidas
create or replace function public.marcar_todas_notificacoes_lidas(p_clube_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if public.is_superadmin() then
    update public.notificacoes
       set lida = true, lida_em = now()
     where audience = 'superadmin' and lida = false;
    get diagnostics v_count = row_count;
    return v_count;
  end if;

  update public.notificacoes
     set lida = true, lida_em = now()
   where audience = 'gestor'
     and lida = false
     and (
       gestor_id = auth.uid()
       or (gestor_id is null and clube_id = public.current_clube_id())
     );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.marcar_todas_notificacoes_lidas(uuid) to authenticated;

-- ============================================================================
-- 2. ONBOARDING — cria clube + gestor atomicamente (chamado por onboarding.vue)
-- ============================================================================

create or replace function public.onboarding_criar_clube_gestor(
  p_nome_clube        text,
  p_slug              text,
  p_cnpj              text default null,
  p_modalidade        text default null,
  p_email_clube       text default null,
  p_nome_gestor       text default null,
  p_email_gestor      text default null,
  p_email_verificado  boolean default false
)
returns table (out_clube_id uuid, out_gestor_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_clube_id uuid;
  v_plano    public.plano_clube := 'basico';
  v_meta     jsonb;
begin
  if v_uid is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  -- Um auth user só pode ser gestor de um clube
  if exists (select 1 from public.gestores where id = v_uid) then
    raise exception 'Usuário já vinculado a um clube' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_nome_clube), '') = '' or length(p_nome_clube) > 120 then
    raise exception 'Nome do clube inválido' using errcode = 'P0001';
  end if;
  if p_slug !~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' or length(p_slug) > 80 then
    raise exception 'Slug inválido' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.clubes where slug = p_slug) then
    raise exception 'Slug já em uso' using errcode = 'P0001';
  end if;

  -- Plano escolhido no signup (user_metadata.plano), se válido
  select raw_user_meta_data into v_meta from auth.users where id = v_uid;
  if v_meta ? 'plano' and (v_meta->>'plano') in ('basico', 'intermediario', 'profissional') then
    v_plano := (v_meta->>'plano')::public.plano_clube;
  end if;

  insert into public.clubes (nome, slug, cnpj, modalidade, email, plano)
  values (
    trim(p_nome_clube),
    p_slug,
    nullif(trim(coalesce(p_cnpj, '')), ''),
    coalesce(nullif(trim(coalesce(p_modalidade, '')), ''), v_meta->>'modalidade'),
    p_email_clube,
    v_plano
  )
  returning id into v_clube_id;

  insert into public.gestores (id, clube_id, nome, email, email_verificado, role)
  values (
    v_uid,
    v_clube_id,
    coalesce(nullif(trim(coalesce(p_nome_gestor, '')), ''), v_meta->>'nome', nullif(split_part(coalesce(p_email_gestor, ''), '@', 1), ''), 'Gestor'),
    coalesce(p_email_gestor, (select email from auth.users where id = v_uid)),
    coalesce(p_email_verificado, false),
    'principal'
  );

  out_clube_id  := v_clube_id;
  out_gestor_id := v_uid;
  return next;
end;
$$;

grant execute on function public.onboarding_criar_clube_gestor(text, text, text, text, text, text, text, boolean)
  to authenticated;

-- ============================================================================
-- 3. CADASTRO PÚBLICO DE ATLETA (página /cadastro/[slug], anon key)
-- ============================================================================

create or replace function public.cadastro_publico_atleta(p_slug text, p_dados jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clube     public.clubes%rowtype;
  v_nome      text := trim(coalesce(p_dados->>'nome', ''));
  v_cpf       text := regexp_replace(coalesce(p_dados->>'cpf', ''), '\D', '', 'g');
  v_tel_resp  text := trim(coalesce(p_dados->>'telefone_responsavel', ''));
  v_apelido   text := nullif(trim(coalesce(p_dados->>'apelido', '')), '');
  v_posicao   text := nullif(trim(coalesce(p_dados->>'posicao', '')), '');
  v_nasc      date;
  v_turma_id  uuid;
  v_atleta_id uuid;
begin
  -- Clube ativo pelo slug
  select * into v_clube
    from public.clubes
   where slug = p_slug and plano_ativo = true;
  if not found then
    return json_build_object('ok', false, 'erro', 'Clube não encontrado ou inativo');
  end if;

  -- Validações anti-abuso (campos obrigatórios + tamanhos)
  if length(v_nome) < 3 or length(v_nome) > 120 then
    return json_build_object('ok', false, 'erro', 'Nome inválido');
  end if;
  if v_cpf !~ '^\d{11}$' then
    return json_build_object('ok', false, 'erro', 'CPF inválido');
  end if;
  if length(regexp_replace(v_tel_resp, '\D', '', 'g')) < 10 or length(v_tel_resp) > 20 then
    return json_build_object('ok', false, 'erro', 'Telefone do responsável inválido');
  end if;
  if v_apelido is not null and length(v_apelido) > 40 then
    return json_build_object('ok', false, 'erro', 'Apelido muito longo');
  end if;
  if v_posicao is not null and length(v_posicao) > 40 then
    return json_build_object('ok', false, 'erro', 'Posição muito longa');
  end if;

  -- Data de nascimento opcional
  begin
    v_nasc := nullif(p_dados->>'data_nascimento', '')::date;
  exception when others then
    return json_build_object('ok', false, 'erro', 'Data de nascimento inválida');
  end;
  if v_nasc is not null and (v_nasc > current_date or v_nasc < current_date - interval '120 years') then
    return json_build_object('ok', false, 'erro', 'Data de nascimento inválida');
  end if;

  -- CPF não duplicado no clube
  if exists (select 1 from public.atletas where clube_id = v_clube.id and cpf = v_cpf) then
    return json_build_object('ok', false, 'erro', 'CPF já cadastrado neste clube');
  end if;

  -- Turma opcional: precisa pertencer ao clube e estar ativa
  begin
    v_turma_id := nullif(p_dados->>'turma_id', '')::uuid;
  exception when others then
    v_turma_id := null;
  end;
  if v_turma_id is not null and not exists (
    select 1 from public.turmas
     where id = v_turma_id and clube_id = v_clube.id and ativo = true
  ) then
    v_turma_id := null;  -- turma inválida: ignora vínculo, mantém cadastro
  end if;

  insert into public.atletas (
    clube_id, nome, apelido, cpf, data_nascimento,
    telefone_responsavel, posicao, status, saude, ativo, app_primeiro_acesso
  ) values (
    v_clube.id, v_nome, v_apelido, v_cpf, v_nasc,
    v_tel_resp, v_posicao, 'novato', 'saudavel', true, true
  )
  returning id into v_atleta_id;

  if v_turma_id is not null then
    insert into public.atleta_turma (atleta_id, turma_id, ativo)
    values (v_atleta_id, v_turma_id, true)
    on conflict do nothing;
  end if;

  return json_build_object('ok', true, 'atleta_id', v_atleta_id);
exception
  when others then
    return json_build_object('ok', false, 'erro', sqlerrm);
end;
$$;

grant execute on function public.cadastro_publico_atleta(text, jsonb) to anon, authenticated;

-- ============================================================================
-- 4. DASHBOARD DO CLUBE
-- ============================================================================

create or replace function public.dashboard_metricas(p_clube_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_inicio_mes date := date_trunc('month', current_date)::date;
begin
  -- Autorização: gestor do próprio clube ou superadmin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total_atletas',          (select count(*) from public.atletas  where clube_id = p_clube_id and ativo = true),
    'total_turmas',           (select count(*) from public.turmas   where clube_id = p_clube_id and ativo = true),
    'receita_mes',            (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'entrada' and data >= v_inicio_mes),
    'despesas_mes',           (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'saida'   and data >= v_inicio_mes),
    'saldo_mes',
      (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'entrada' and data >= v_inicio_mes) -
      (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'saida'   and data >= v_inicio_mes),
    'cobranças_pendentes',    (select count(*) from public.cobrancas where clube_id = p_clube_id and status = 'pendente'),
    'cobranças_atraso',       (select count(*) from public.cobrancas where clube_id = p_clube_id and status = 'pendente' and data_vencimento < current_date),
    'atletas_saudaveis',      (select count(*) from public.atletas where clube_id = p_clube_id and ativo = true and saude = 'saudavel'),
    'atletas_lesionados',     (select count(*) from public.atletas where clube_id = p_clube_id and ativo = true and saude = 'lesionado'),
    'atletas_em_recuperacao', (select count(*) from public.atletas where clube_id = p_clube_id and ativo = true and saude = 'em_recuperacao')
  );
end;
$$;

grant execute on function public.dashboard_metricas(uuid) to authenticated;

create or replace function public.grafico_financeiro(p_clube_id uuid, p_meses int default 6)
returns table (mes text, receita numeric, despesa numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return query
  with meses as (
    select generate_series(
      date_trunc('month', current_date) - ((greatest(1, least(coalesce(p_meses, 6), 36)) - 1) || ' months')::interval,
      date_trunc('month', current_date),
      '1 month'::interval
    )::date as inicio
  )
  select
    to_char(m.inicio, 'TMmon') as mes,
    coalesce(sum(t.valor) filter (where t.tipo = 'entrada'), 0)::numeric as receita,
    coalesce(sum(t.valor) filter (where t.tipo = 'saida'),   0)::numeric as despesa
  from meses m
  left join public.transacoes t
    on t.clube_id = p_clube_id
   and t.data >= m.inicio
   and t.data <  (m.inicio + interval '1 month')
  group by m.inicio
  order by m.inicio;
end;
$$;

grant execute on function public.grafico_financeiro(uuid, int) to authenticated;

-- ============================================================================
-- 5. FREQUÊNCIA — ranking + detecção de evasão
-- ============================================================================

create or replace function public.ranking_frequencia(p_clube_id uuid, p_limite int default 20)
returns table (
  atleta          jsonb,
  total_treinos   int,
  total_presencas int,
  percentual      int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return query
  with stats as (
    select
      jsonb_build_object(
        'id', a.id,
        'nome', a.nome,
        'apelido', a.apelido,
        'foto_url', a.foto_url,
        'numero_camisa', a.numero_camisa,
        'posicao', a.posicao
      ) as atleta_json,
      count(f.id)::int as treinos,
      count(f.id) filter (where f.presente)::int as presencas
    from public.atletas a
    left join public.frequencias f on f.atleta_id = a.id
    where a.clube_id = p_clube_id
      and a.ativo = true
      and a.status <> 'afastado'
    group by a.id, a.nome, a.apelido, a.foto_url, a.numero_camisa, a.posicao
  )
  select
    s.atleta_json,
    s.treinos,
    s.presencas,
    case when s.treinos > 0 then round((s.presencas::numeric / s.treinos) * 100)::int else 0 end
  from stats s
  order by 4 desc, 3 desc
  limit greatest(1, least(coalesce(p_limite, 20), 200));
end;
$$;

grant execute on function public.ranking_frequencia(uuid, int) to authenticated;

-- Regra F5: 3+ faltas consecutivas (considerando só dias com registro) → alerta.
-- Chamável manualmente ou por scheduler externo (ver cabeçalho deste arquivo).
create or replace function public.detectar_evasoes()
returns table (
  clube_id  uuid,
  atleta_id uuid,
  turma_id  uuid,
  faltas    int,
  alerta_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r       record;
  novo_id uuid;
begin
  for r in
    with ordenado as (
      select
        f.clube_id  as c_id,
        f.atleta_id as a_id,
        f.turma_id  as t_id,
        f.presente,
        row_number() over (
          partition by f.clube_id, f.atleta_id, f.turma_id
          order by f.data desc
        ) as rn
      from public.frequencias f
      where exists (
        select 1 from public.atletas a
         where a.id = f.atleta_id and a.ativo = true and a.status <> 'afastado'
      )
    ),
    consecutivas as (
      select
        c_id, a_id, t_id,
        coalesce(min(rn) filter (where presente = true), 9999) - 1 as faltas_seguidas
      from ordenado
      group by c_id, a_id, t_id
    )
    select c_id, a_id, t_id, faltas_seguidas::int as fs
      from consecutivas
     where faltas_seguidas >= 3
  loop
    if not exists (
      select 1 from public.alertas_evasao ae
       where ae.atleta_id = r.a_id
         and ae.turma_id = r.t_id
         and ae.dispensado = false
    ) then
      insert into public.alertas_evasao
        (clube_id, atleta_id, turma_id, faltas_consecutivas, data_deteccao)
      values (r.c_id, r.a_id, r.t_id, r.fs, current_date)
      returning id into novo_id;

      clube_id  := r.c_id;
      atleta_id := r.a_id;
      turma_id  := r.t_id;
      faltas    := r.fs;
      alerta_id := novo_id;
      return next;
    else
      update public.alertas_evasao ae
         set faltas_consecutivas = r.fs
       where ae.atleta_id = r.a_id
         and ae.turma_id = r.t_id
         and ae.dispensado = false
         and ae.faltas_consecutivas < r.fs;
    end if;
  end loop;
end;
$$;

-- Apenas service_role / scheduler (não exposta ao client)
revoke execute on function public.detectar_evasoes() from public, anon, authenticated;

-- ============================================================================
-- 6. FINANCEIRO — ativar planejamento, marcar paga, regenerar link, recorrência
-- ============================================================================

create or replace function public.ativar_planejamento(p_planejamento_id uuid, p_gestor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p              record;
  cx_id          uuid;
  data_venc      date;
  total_atletas  int;
  total_previsto numeric(19,4);
begin
  select * into p from public.planejamentos where id = p_planejamento_id;
  if not found then
    raise exception 'Planejamento não encontrado';
  end if;

  -- Autorização: gestor do clube dono do planejamento ou superadmin
  if p.clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  if p.status <> 'inativo' then
    raise exception 'Apenas planejamentos inativos podem ser ativados';
  end if;

  -- Vencimento do primeiro ciclo
  if p.tipo = 'unico' then
    data_venc := p.data_vencimento;
    if data_venc is null then
      raise exception 'Planejamento único sem data de vencimento';
    end if;
  else
    if p.dia_vencimento is null then
      raise exception 'Planejamento recorrente sem dia de vencimento';
    end if;
    data_venc := (date_trunc('month', current_date) + ((p.dia_vencimento - 1) || ' days')::interval)::date;
    if data_venc < current_date then
      data_venc := (data_venc + interval '1 month')::date;
    end if;
  end if;

  -- Atletas elegíveis (não isentos) + total previsto (respeita override)
  select count(*), coalesce(sum(coalesce(pa.valor_customizado, p.valor)), 0)
    into total_atletas, total_previsto
    from public.planejamento_atletas pa
   where pa.planejamento_id = p_planejamento_id
     and pa.isento = false;

  insert into public.caixinhas (clube_id, planejamento_id, nome, total_previsto)
  values (p.clube_id, p_planejamento_id, p.nome, total_previsto)
  returning id into cx_id;

  insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, data_vencimento)
  select p.clube_id, cx_id, pa.atleta_id, coalesce(pa.valor_customizado, p.valor), data_venc
    from public.planejamento_atletas pa
   where pa.planejamento_id = p_planejamento_id
     and pa.isento = false;

  update public.caixinhas
     set total_pendente = (select coalesce(sum(valor), 0) from public.cobrancas where caixinha_id = cx_id and status = 'pendente')
   where id = cx_id;

  update public.planejamentos
     set status = 'ativo', ativado_em = now()
   where id = p_planejamento_id;

  return jsonb_build_object(
    'planejamento_id',   p_planejamento_id,
    'caixinha_id',       cx_id,
    'cobrancas_geradas', total_atletas,
    'total_previsto',    total_previsto
  );
end;
$$;

grant execute on function public.ativar_planejamento(uuid, uuid) to authenticated;

create or replace function public.marcar_cobranca_paga(p_cobranca_id uuid, p_gestor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cb record;
begin
  select * into cb from public.cobrancas where id = p_cobranca_id and status = 'pendente';
  if not found then
    raise exception 'Cobrança não pendente';
  end if;

  if cb.clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  update public.cobrancas
     set status = 'pago', data_pagamento = current_date
   where id = p_cobranca_id;

  insert into public.transacoes
    (clube_id, tipo, valor, descricao, data, cobranca_id, caixinha_id, atleta_id, origem, registrado_por)
  values
    (cb.clube_id, 'entrada', cb.valor, 'Pagamento manual', current_date,
     cb.id, cb.caixinha_id, cb.atleta_id, 'manual', coalesce(p_gestor_id, auth.uid()));

  perform public.recalcular_caixinha(cb.caixinha_id);
end;
$$;

grant execute on function public.marcar_cobranca_paga(uuid, uuid) to authenticated;

-- Utilitário: recalcula os agregados de uma caixinha
create or replace function public.recalcular_caixinha(p_caixinha_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.caixinhas cx
     set total_pago       = s.pago,
         total_pendente   = s.pendente,
         saldo_arrecadado = s.pago
    from (
      select
        coalesce(sum(valor) filter (where status = 'pago'), 0)     as pago,
        coalesce(sum(valor) filter (where status = 'pendente'), 0) as pendente
      from public.cobrancas
      where caixinha_id = p_caixinha_id
    ) s
   where cx.id = p_caixinha_id;
$$;

revoke execute on function public.recalcular_caixinha(uuid) from public, anon, authenticated;

create or replace function public.regenerar_link_pix(p_cobranca_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clube uuid;
begin
  select clube_id into v_clube from public.cobrancas where id = p_cobranca_id;
  if v_clube is null then
    raise exception 'Cobrança não encontrada';
  end if;
  if v_clube is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  update public.cobrancas
     set abacatepay_payment_id = null,
         abacatepay_link = null
   where id = p_cobranca_id and status = 'pendente';
end;
$$;

grant execute on function public.regenerar_link_pix(uuid) to authenticated;

-- Geração do próximo ciclo de cobranças recorrentes (chamável por scheduler)
create or replace function public.gerar_cobrancas_recorrentes()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r            record;
  proxima_data date;
  cx_id        uuid;
  geradas      int := 0;
begin
  for r in
    select p.* from public.planejamentos p
    where p.status = 'ativo' and p.tipo = 'recorrente' and p.dia_vencimento is not null
  loop
    proxima_data := (date_trunc('month', current_date)
      + ((r.dia_vencimento - 1) || ' days')::interval
      + case r.periodicidade
          when 'mensal'     then interval '1 month'
          when 'bimestral'  then interval '2 months'
          when 'trimestral' then interval '3 months'
          when 'semestral'  then interval '6 months'
          when 'anual'      then interval '1 year'
          else interval '1 month'
        end)::date;

    if proxima_data - current_date <= 5 and proxima_data >= current_date
       and not exists (
         select 1 from public.cobrancas c
         join public.caixinhas cx on cx.id = c.caixinha_id
         where cx.planejamento_id = r.id and c.data_vencimento = proxima_data
       )
    then
      select id into cx_id
        from public.caixinhas
       where planejamento_id = r.id
       order by criada_em desc
       limit 1;

      if cx_id is null then
        insert into public.caixinhas (clube_id, planejamento_id, nome)
        values (r.clube_id, r.id, r.nome || ' — ' || to_char(proxima_data, 'TMmon/YYYY'))
        returning id into cx_id;
      end if;

      insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, data_vencimento)
      select r.clube_id, cx_id, pa.atleta_id, coalesce(pa.valor_customizado, r.valor), proxima_data
        from public.planejamento_atletas pa
        join public.atletas a on a.id = pa.atleta_id
       where pa.planejamento_id = r.id
         and pa.isento = false
         and a.ativo = true
         and a.status <> 'afastado';

      perform public.recalcular_caixinha(cx_id);
      geradas := geradas + 1;
    end if;
  end loop;

  return geradas;
end;
$$;

revoke execute on function public.gerar_cobrancas_recorrentes() from public, anon, authenticated;

-- ============================================================================
-- 7. LIMITES DE PLANO — verificação + triggers + consulta
-- ============================================================================

create or replace function public.verificar_limite_plano(p_clube_id uuid, p_recurso text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano  text;
  v_ativo  boolean;
  v_limite int;
  v_atual  int;
begin
  select plano::text, plano_ativo into v_plano, v_ativo
    from public.clubes where id = p_clube_id;

  if not coalesce(v_ativo, true) then return; end if;

  case p_recurso
    when 'atleta' then
      select max_atletas into v_limite from public.limites_plano where plano = v_plano;
      select count(*) into v_atual from public.atletas
       where clube_id = p_clube_id and ativo = true;
    when 'turma' then
      select max_turmas into v_limite from public.limites_plano where plano = v_plano;
      select count(*) into v_atual from public.turmas
       where clube_id = p_clube_id and ativo = true;
    when 'gestor' then
      select max_gestores into v_limite from public.limites_plano where plano = v_plano;
      select count(*) into v_atual from public.gestores
       where clube_id = p_clube_id and ativo = true;
    else
      return;
  end case;

  if v_atual >= coalesce(v_limite, 9999) then
    raise exception 'Limite do plano atingido: o plano % permite no máximo % %(s). Faça upgrade para continuar.',
      v_plano, v_limite, p_recurso
      using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.verificar_limite_plano(uuid, text) from public, anon, authenticated;

create or replace function public.tg_limite_atleta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.verificar_limite_plano(new.clube_id, 'atleta');
  return new;
end $$;

drop trigger if exists tg_limite_atleta on public.atletas;
create trigger tg_limite_atleta
  before insert on public.atletas
  for each row execute function public.tg_limite_atleta();

create or replace function public.tg_limite_turma()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.verificar_limite_plano(new.clube_id, 'turma');
  return new;
end $$;

drop trigger if exists tg_limite_turma on public.turmas;
create trigger tg_limite_turma
  before insert on public.turmas
  for each row execute function public.tg_limite_turma();

create or replace function public.tg_limite_gestor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.verificar_limite_plano(new.clube_id, 'gestor');
  return new;
end $$;

drop trigger if exists tg_limite_gestor on public.gestores;
create trigger tg_limite_gestor
  before insert on public.gestores
  for each row execute function public.tg_limite_gestor();

create or replace function public.limites_clube(p_clube_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plano    text;
  v_lim      record;
  v_atletas  int;
  v_turmas   int;
  v_gestores int;
begin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  select plano::text into v_plano from public.clubes where id = p_clube_id;
  select * into v_lim from public.limites_plano where plano = v_plano;

  select count(*) into v_atletas  from public.atletas  where clube_id = p_clube_id and ativo = true;
  select count(*) into v_turmas   from public.turmas   where clube_id = p_clube_id and ativo = true;
  select count(*) into v_gestores from public.gestores where clube_id = p_clube_id and ativo = true;

  return jsonb_build_object(
    'plano',    v_plano,
    'atletas',  jsonb_build_object('atual', v_atletas,  'maximo', v_lim.max_atletas),
    'turmas',   jsonb_build_object('atual', v_turmas,   'maximo', v_lim.max_turmas),
    'gestores', jsonb_build_object('atual', v_gestores, 'maximo', v_lim.max_gestores)
  );
end;
$$;

grant execute on function public.limites_clube(uuid) to authenticated;

-- ============================================================================
-- 8. ADMIN — métricas, crescimento, gestão de clubes
-- ============================================================================

create or replace function public.admin_metricas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mrr        numeric(19,4);
  v_inicio_mes date := date_trunc('month', current_date)::date;
  v_cancel_mes int;
  v_total_mes  int;
  v_churn      numeric(19,4);
begin
  if not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  select coalesce(sum(valor_mensal), 0) into v_mrr
    from public.assinaturas where status = 'ativa';

  select count(*) into v_cancel_mes from public.assinaturas
   where status = 'cancelada' and cancelada_em >= v_inicio_mes;
  select count(*) into v_total_mes from public.assinaturas
   where status in ('ativa', 'inadimplente', 'cancelada');
  v_churn := case when v_total_mes > 0
                  then round((v_cancel_mes::numeric / v_total_mes) * 100, 2)
                  else 0 end;

  return jsonb_build_object(
    'total_clubes',         (select count(*) from public.clubes),
    'clubes_ativos',        (select count(*) from public.assinaturas where status = 'ativa'),
    'clubes_trial',         (select count(*) from public.assinaturas where status = 'trial'),
    'clubes_inadimplentes', (select count(*) from public.assinaturas where status = 'inadimplente'),
    'clubes_cancelados',    (select count(*) from public.assinaturas where status = 'cancelada'),
    'total_atletas',        (select count(*) from public.atletas where ativo = true),
    'total_gestores',       (select count(*) from public.gestores where ativo = true),
    'mrr',                  v_mrr,
    'arr',                  v_mrr * 12,
    'receita_mes',          (select coalesce(sum(valor), 0) from public.movimentacoes_sistema
                              where tipo = 'mensalidade_recebida' and data >= v_inicio_mes),
    'receita_pendente',     (select coalesce(sum(valor_mensal), 0) from public.assinaturas where status = 'inadimplente'),
    'churn_mes_percent',    v_churn,
    'vouchers_ativos',      (select count(*) from public.vouchers where status = 'ativo'),
    'indicacoes_pendentes', (select count(*) from public.indicacoes where status = 'pendente'),
    'webhooks_falhos_24h',  (select count(*) from public.webhook_logs
                              where status = 'erro' and recebido_em >= now() - interval '24 hours')
  );
end;
$$;

grant execute on function public.admin_metricas() to authenticated;

create or replace function public.admin_crescimento(p_meses int default 6)
returns table (mes text, novos_clubes int, cancelamentos int, mrr numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return query
  with meses as (
    select generate_series(
      date_trunc('month', current_date) - ((greatest(1, least(coalesce(p_meses, 6), 36)) - 1) || ' months')::interval,
      date_trunc('month', current_date),
      '1 month'::interval
    )::date as inicio
  )
  select
    to_char(m.inicio, 'TMmon') as mes,
    (select count(*)::int from public.clubes c
      where c.criado_em >= m.inicio
        and c.criado_em < (m.inicio + interval '1 month')) as novos_clubes,
    (select count(*)::int from public.assinaturas a
      where a.cancelada_em >= m.inicio
        and a.cancelada_em < (m.inicio + interval '1 month')) as cancelamentos,
    coalesce((
      select sum(a.valor_mensal) from public.assinaturas a
       where a.status in ('ativa', 'inadimplente', 'cancelada')
         and a.ativada_em is not null
         and a.ativada_em < (m.inicio + interval '1 month')
         and (a.cancelada_em is null or a.cancelada_em >= (m.inicio + interval '1 month'))
    ), 0)::numeric as mrr
  from meses m
  order by m.inicio;
end;
$$;

grant execute on function public.admin_crescimento(int) to authenticated;

-- ── Novas RPCs do painel admin (retorno json, contrato enxuto) ──────────────

create or replace function public.admin_dashboard_metricas()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return json_build_object(
    'total_clubes',         (select count(*) from public.clubes),
    'clubes_ativos',        (select count(*) from public.assinaturas where status = 'ativa'),
    'clubes_trial',         (select count(*) from public.assinaturas where status = 'trial'),
    'clubes_inadimplentes', (select count(*) from public.assinaturas where status = 'inadimplente'),
    'clubes_cancelados',    (select count(*) from public.assinaturas where status = 'cancelada'),
    'mrr',                  (select coalesce(sum(valor_mensal), 0) from public.assinaturas where status = 'ativa'),
    'total_atletas',        (select count(*) from public.atletas where ativo = true),
    'novos_clubes_30d',     (select count(*) from public.clubes where criado_em >= now() - interval '30 days')
  );
end;
$$;

grant execute on function public.admin_dashboard_metricas() to authenticated;

create or replace function public.admin_grafico_crescimento(p_meses int default 6)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  if not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  with meses as (
    select generate_series(
      date_trunc('month', current_date) - ((greatest(1, least(coalesce(p_meses, 6), 36)) - 1) || ' months')::interval,
      date_trunc('month', current_date),
      '1 month'::interval
    )::date as inicio
  )
  select coalesce(json_agg(json_build_object(
    'mes', to_char(m.inicio, 'TMmon/YY'),
    'novos_clubes', (select count(*) from public.clubes c
                      where c.criado_em >= m.inicio
                        and c.criado_em < (m.inicio + interval '1 month')),
    'mrr', coalesce((
      select sum(a.valor_mensal) from public.assinaturas a
       where a.status in ('ativa', 'inadimplente', 'cancelada')
         and a.ativada_em is not null
         and a.ativada_em < (m.inicio + interval '1 month')
         and (a.cancelada_em is null or a.cancelada_em >= (m.inicio + interval '1 month'))
    ), 0)
  ) order by m.inicio), '[]'::json)
  into v_result
  from meses m;

  return v_result;
end;
$$;

grant execute on function public.admin_grafico_crescimento(int) to authenticated;

-- ── Gestão de clube (suspender / reativar / alterar plano / ativar plano) ──

create or replace function public.suspender_clube(
  p_clube_id uuid,
  p_motivo   text default 'Suspensão administrativa'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Permissão negada' using errcode = '42501';
  end if;

  update public.clubes
     set plano_ativo = false
   where id = p_clube_id;

  update public.assinaturas
     set status = 'suspensa'
   where clube_id = p_clube_id
     and status <> 'cancelada';

  perform public.criar_notificacao(
    p_clube_id, null, 'gestor', 'danger', 'sistema',
    'Conta suspensa',
    'Sua conta foi suspensa: ' || p_motivo || '. Entre em contato com o suporte.',
    null,
    jsonb_build_object('motivo', p_motivo)
  );

  insert into public.logs_auditoria (superadmin_id, usuario_id, acao, entidade, entidade_id, detalhes)
  values (auth.uid(), auth.uid(), 'clube_suspenso', 'clube', p_clube_id::text,
          jsonb_build_object('motivo', p_motivo));

  return jsonb_build_object('sucesso', true, 'clube_id', p_clube_id);
end;
$$;

grant execute on function public.suspender_clube(uuid, text) to authenticated;

create or replace function public.reativar_clube(p_clube_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Permissão negada' using errcode = '42501';
  end if;

  update public.clubes
     set plano_ativo = true
   where id = p_clube_id;

  update public.assinaturas
     set status = case
           when trial_fim is not null and trial_fim > current_date then 'trial'::public.assinatura_status
           else 'ativa'::public.assinatura_status
         end
   where clube_id = p_clube_id
     and status = 'suspensa';

  perform public.criar_notificacao(
    p_clube_id, null, 'gestor', 'success', 'sistema',
    'Conta reativada',
    'Sua conta foi reativada. Bem-vindo de volta ao Athletto!',
    null,
    '{}'::jsonb
  );

  insert into public.logs_auditoria (superadmin_id, usuario_id, acao, entidade, entidade_id, detalhes)
  values (auth.uid(), auth.uid(), 'clube_reativado', 'clube', p_clube_id::text, '{}'::jsonb);

  return jsonb_build_object('sucesso', true, 'clube_id', p_clube_id);
end;
$$;

grant execute on function public.reativar_clube(uuid) to authenticated;

create or replace function public.alterar_plano_clube(p_clube_id uuid, p_novo_plano text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano_anterior text;
  v_valor_novo     numeric(19,4);
begin
  if not public.is_superadmin() then
    raise exception 'Permissão negada' using errcode = '42501';
  end if;

  if p_novo_plano not in ('basico', 'intermediario', 'profissional') then
    raise exception 'Plano inválido: %', p_novo_plano using errcode = 'P0001';
  end if;

  select plano::text into v_plano_anterior from public.clubes where id = p_clube_id;
  if v_plano_anterior is null then
    raise exception 'Clube não encontrado' using errcode = 'P0001';
  end if;

  -- Tabela de preços (centralize aqui; ajuste conforme pricing)
  v_valor_novo := case p_novo_plano
    when 'basico'        then 0
    when 'intermediario' then 99
    when 'profissional'  then 249
  end;

  update public.clubes
     set plano = p_novo_plano::public.plano_clube,
         plano_ativo = true
   where id = p_clube_id;

  update public.assinaturas
     set plano = p_novo_plano::public.plano_clube,
         valor_mensal = v_valor_novo
   where clube_id = p_clube_id;

  perform public.criar_notificacao(
    p_clube_id, null, 'gestor', 'success', 'sistema',
    'Plano alterado',
    'Seu plano foi alterado para ' || p_novo_plano || '.',
    '/configuracoes#assinatura',
    jsonb_build_object('plano_anterior', v_plano_anterior, 'plano_novo', p_novo_plano)
  );

  insert into public.logs_auditoria (superadmin_id, usuario_id, acao, entidade, entidade_id, detalhes)
  values (auth.uid(), auth.uid(), 'plano_alterado', 'clube', p_clube_id::text,
          jsonb_build_object('de', v_plano_anterior, 'para', p_novo_plano));

  return jsonb_build_object('sucesso', true, 'plano_anterior', v_plano_anterior, 'plano_novo', p_novo_plano);
end;
$$;

grant execute on function public.alterar_plano_clube(uuid, text) to authenticated;

create or replace function public.ativar_plano_clube(p_clube_id uuid, p_plano text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Permissão negada' using errcode = '42501';
  end if;

  perform public.alterar_plano_clube(p_clube_id, p_plano);

  update public.assinaturas
     set status = 'ativa',
         ativada_em = now(),
         trial_fim = current_date
   where clube_id = p_clube_id;

  return jsonb_build_object('sucesso', true);
end;
$$;

grant execute on function public.ativar_plano_clube(uuid, text) to authenticated;

-- ── Promover owner (seed manual após signup do owner) ──────────────────────

create or replace function public.promover_owner_por_email(p_email text, p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'Usuário com email % ainda não fez signup', p_email;
  end if;

  insert into public.superadmins (id, nome, email, role)
  values (v_user_id, p_nome, p_email, 'owner')
  on conflict (id) do update set
    nome = excluded.nome,
    role = 'owner',
    ativo = true;

  return v_user_id;
end;
$$;

-- Só via SQL Editor / service_role (não exposta ao client)
revoke execute on function public.promover_owner_por_email(text, text) from public, anon, authenticated;

comment on function public.promover_owner_por_email is
  'Promove um email já existente em auth.users a superadmin owner. Idempotente. Executar pelo SQL Editor.';

-- ============================================================================
-- 9. TRIGGERS DE NEGÓCIO
-- ============================================================================

-- ── Clube criado → assinatura trial (usa trial_dias_padrao da config) ──────
create or replace function public.tg_criar_assinatura_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_dias int;
begin
  select trial_dias_padrao into v_trial_dias
    from public.configuracoes_sistema where id = 'cfg-singleton';
  v_trial_dias := coalesce(v_trial_dias, 30);

  insert into public.assinaturas (clube_id, plano, status, trial_inicio, trial_fim, valor_mensal)
  values (new.id, new.plano, 'trial', current_date, current_date + v_trial_dias, 0)
  on conflict (clube_id) do nothing;

  return new;
end;
$$;

drop trigger if exists tg_clube_trial on public.clubes;
create trigger tg_clube_trial
  after insert on public.clubes
  for each row execute function public.tg_criar_assinatura_trial();

-- ── Notificações por evento ─────────────────────────────────────────────────

-- Atleta novo
create or replace function public.tg_notif_atleta_inserido()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.criar_notificacao(
    new.clube_id, null, 'gestor', 'success', 'novo_atleta',
    'Novo atleta cadastrado',
    new.nome || ' foi adicionado ao elenco.',
    '/atletas/' || new.id,
    jsonb_build_object('atleta_id', new.id)
  );
  return new;
end $$;

drop trigger if exists tg_notif_atleta_inserido on public.atletas;
create trigger tg_notif_atleta_inserido
  after insert on public.atletas
  for each row execute function public.tg_notif_atleta_inserido();

-- Alerta de evasão criado
create or replace function public.tg_notif_evasao()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text;
begin
  select nome into v_nome from public.atletas where id = new.atleta_id;
  perform public.criar_notificacao(
    new.clube_id, null, 'gestor', 'warning', 'evasao',
    'Atleta com faltas consecutivas',
    coalesce(v_nome, 'Atleta') || ' — ' || new.faltas_consecutivas || ' faltas seguidas.',
    '/frequencia#alertas',
    jsonb_build_object('alerta_id', new.id, 'atleta_id', new.atleta_id, 'turma_id', new.turma_id)
  );
  return new;
end $$;

drop trigger if exists tg_notif_evasao on public.alertas_evasao;
create trigger tg_notif_evasao
  after insert on public.alertas_evasao
  for each row execute function public.tg_notif_evasao();

-- Cobrança paga
create or replace function public.tg_notif_cobranca_paga()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text;
begin
  if new.status = 'pago' and old.status is distinct from 'pago' then
    select nome into v_nome from public.atletas where id = new.atleta_id;
    perform public.criar_notificacao(
      new.clube_id, null, 'gestor', 'success', 'cobranca_paga',
      'Pagamento recebido',
      'Cobrança de ' || coalesce(v_nome, 'atleta') ||
      ' (R$ ' || to_char(new.valor, 'FM999G999G990D00') || ') foi quitada.',
      '/financeiro#caixinhas',
      jsonb_build_object('cobranca_id', new.id, 'atleta_id', new.atleta_id)
    );
  end if;
  return new;
end $$;

drop trigger if exists tg_notif_cobranca_paga on public.cobrancas;
create trigger tg_notif_cobranca_paga
  after update on public.cobrancas
  for each row execute function public.tg_notif_cobranca_paga();

-- Voucher aplicado (gestor + superadmin)
create or replace function public.tg_notif_voucher_aplicado()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome_clube text;
begin
  select nome into v_nome_clube from public.clubes where id = new.clube_id;

  perform public.criar_notificacao(
    new.clube_id, null, 'gestor', 'info', 'voucher_aplicado',
    'Voucher aplicado',
    new.dias_concedidos || ' dias bônus adicionados à sua assinatura.',
    '/configuracoes#assinatura',
    jsonb_build_object('voucher_id', new.id, 'dias', new.dias_concedidos)
  );

  perform public.criar_notificacao(
    null, null, 'superadmin', 'info', 'voucher_aplicado',
    'Voucher emitido',
    coalesce(v_nome_clube, 'Clube') || ' recebeu ' || new.dias_concedidos || ' dias.',
    '/admin/vouchers',
    jsonb_build_object('voucher_id', new.id, 'clube_id', new.clube_id)
  );
  return new;
end $$;

drop trigger if exists tg_notif_voucher_aplicado on public.vouchers;
create trigger tg_notif_voucher_aplicado
  after insert on public.vouchers
  for each row execute function public.tg_notif_voucher_aplicado();

-- Indicação criada (superadmin) / aprovada (gestor)
create or replace function public.tg_notif_indicacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome_clube text;
begin
  if tg_op = 'INSERT' then
    select nome into v_nome_clube from public.clubes where id = new.clube_indicador_id;
    perform public.criar_notificacao(
      null, null, 'superadmin', 'info', 'indicacao',
      'Nova indicação pendente',
      coalesce(v_nome_clube, 'Clube') || ' indicou ' ||
        coalesce(new.nome_indicado, new.email_indicado),
      '/admin/indicacoes',
      jsonb_build_object('indicacao_id', new.id)
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status = 'aprovada' and old.status is distinct from 'aprovada' then
    perform public.criar_notificacao(
      new.clube_indicador_id, null, 'gestor', 'success', 'indicacao',
      'Indicação aprovada',
      'Sua indicação para ' || coalesce(new.nome_indicado, new.email_indicado) ||
      ' foi aprovada — ' || new.dias_recompensa || ' dias bônus liberados.',
      '/configuracoes#indicacoes',
      jsonb_build_object('indicacao_id', new.id)
    );
  end if;

  return new;
end $$;

drop trigger if exists tg_notif_indicacao_ins on public.indicacoes;
create trigger tg_notif_indicacao_ins
  after insert on public.indicacoes
  for each row execute function public.tg_notif_indicacao();

drop trigger if exists tg_notif_indicacao_upd on public.indicacoes;
create trigger tg_notif_indicacao_upd
  after update on public.indicacoes
  for each row execute function public.tg_notif_indicacao();

-- Novo clube (superadmin)
create or replace function public.tg_notif_clube_novo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.criar_notificacao(
    null, null, 'superadmin', 'success', 'novo_clube',
    'Novo clube cadastrado',
    new.nome || ' (' || new.plano || ') entrou na plataforma.',
    '/admin/clubes/' || new.id,
    jsonb_build_object('clube_id', new.id, 'plano', new.plano)
  );
  return new;
end $$;

drop trigger if exists tg_notif_clube_novo on public.clubes;
create trigger tg_notif_clube_novo
  after insert on public.clubes
  for each row execute function public.tg_notif_clube_novo();

-- ============================================================================
-- 10. NOTIFICAÇÕES PERIÓDICAS — chamável por scheduler externo
-- ============================================================================

create or replace function public.notificar_trials_vencendo()
returns void
language plpgsql security definer set search_path = public as $$
declare
  r      record;
  v_dias int;
begin
  for r in
    select a.clube_id, a.trial_fim
      from public.assinaturas a
     where a.status = 'trial'
       and a.trial_fim in (
         current_date + 7,
         current_date + 3,
         current_date + 1,
         current_date
       )
  loop
    v_dias := greatest(0, r.trial_fim - current_date);

    if not exists (
      select 1 from public.notificacoes
       where clube_id = r.clube_id
         and categoria = 'trial_expirando'
         and criada_em::date = current_date
    ) then
      perform public.criar_notificacao(
        r.clube_id, null, 'gestor',
        case when v_dias <= 1 then 'danger' else 'warning' end,
        'trial_expirando',
        case when v_dias = 0 then 'Seu trial expira hoje'
             else 'Seu trial expira em ' || v_dias || ' dia(s)' end,
        'Atualize seu plano para não perder acesso aos recursos do Athletto.',
        '/configuracoes#assinatura',
        jsonb_build_object('dias_restantes', v_dias)
      );
    end if;
  end loop;
end $$;

revoke execute on function public.notificar_trials_vencendo() from public, anon, authenticated;

create or replace function public.notificar_cobrancas_vencidas()
returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  for r in
    select c.clube_id, count(*) as qtd, sum(c.valor) as total_devido
      from public.cobrancas c
     where c.status = 'pendente'
       and c.data_vencimento < current_date - 3
     group by c.clube_id
  loop
    if not exists (
      select 1 from public.notificacoes
       where clube_id = r.clube_id
         and categoria = 'pagamento_vencido'
         and criada_em::date = current_date
    ) then
      perform public.criar_notificacao(
        r.clube_id, null, 'gestor', 'danger', 'pagamento_vencido',
        r.qtd || ' cobrança(s) vencida(s) há mais de 3 dias',
        'Valor total devido: R$ ' || to_char(r.total_devido, 'FM999G999G990D00'),
        '/financeiro#pendentes',
        jsonb_build_object('quantidade', r.qtd, 'total', r.total_devido)
      );
    end if;
  end loop;
end $$;

revoke execute on function public.notificar_cobrancas_vencidas() from public, anon, authenticated;

-- Wrapper único para o scheduler diário
create or replace function public.processar_notificacoes()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_trials_vencendo();
  perform public.notificar_cobrancas_vencidas();
end $$;

revoke execute on function public.processar_notificacoes() from public, anon, authenticated;
