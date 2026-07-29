-- ============================================================================
-- Athletto — 0037_fix_cobranca_cancelada_bloqueia_reentrada.sql
--
-- Achado em teste de verificação da 0036: a checagem de "cobrança já existe
-- pra esse ciclo" (em atleta_entrar_turma e gerar_cobrancas_mensalidade_mes_atual)
-- não filtrava por status. Uma cobrança CANCELADA (deixada por uma saída
-- anterior da turma no mesmo ciclo) "bloqueava" a geração de uma nova cobrança
-- ao reentrar — o atleta voltava pra turma sem cobrança pendente nenhuma.
-- Ambas as funções passam a ignorar cobranças canceladas nessa checagem.
-- ============================================================================

create or replace function public.atleta_entrar_turma(p_atleta_id uuid, p_turma_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clube        uuid;
  v_planejamento record;
  v_cx_id        uuid;
  v_valor_custom numeric(19,4);
  v_isento       boolean;
  v_valor        numeric(19,4);
  v_data_venc    date;
  v_cobranca_id  uuid;
begin
  select clube_id into v_clube from public.atletas where id = p_atleta_id;
  if v_clube is null then
    raise exception 'Atleta não encontrado';
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and v_clube is distinct from public.current_clube_id()
     and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  insert into public.atleta_turma (atleta_id, turma_id, ativo)
  values (p_atleta_id, p_turma_id, true)
  on conflict (atleta_id, turma_id) do update set ativo = true;

  select * into v_planejamento from public.planejamentos
   where turma_id = p_turma_id and status = 'ativo';

  if not found then
    return jsonb_build_object('vinculado', true, 'cobranca_id', null);
  end if;

  select valor_mensalidade into v_valor_custom from public.atletas where id = p_atleta_id;
  v_isento := (v_valor_custom is not null and v_valor_custom = 0);
  v_valor  := coalesce(v_valor_custom, v_planejamento.valor);

  insert into public.planejamento_atletas (planejamento_id, atleta_id, isento)
  values (v_planejamento.id, p_atleta_id, v_isento)
  on conflict (planejamento_id, atleta_id) do update set isento = excluded.isento;

  select id into v_cx_id from public.caixinhas where planejamento_id = v_planejamento.id;
  if v_cx_id is null then
    insert into public.caixinhas (clube_id, planejamento_id, nome)
    values (v_clube, v_planejamento.id, v_planejamento.nome)
    returning id into v_cx_id;
  end if;

  if not v_isento then
    v_data_venc := (date_trunc('month', current_date) + ((v_planejamento.dia_vencimento - 1) || ' days')::interval)::date;
    if v_data_venc < current_date then
      v_data_venc := (v_data_venc + interval '1 month')::date;
    end if;

    select id into v_cobranca_id from public.cobrancas
     where caixinha_id = v_cx_id and atleta_id = p_atleta_id and data_vencimento = v_data_venc
       and status <> 'cancelado';

    if v_cobranca_id is null then
      insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, status, data_vencimento)
      values (v_clube, v_cx_id, p_atleta_id, v_valor, 'pendente', v_data_venc)
      returning id into v_cobranca_id;

      update public.caixinhas set total_previsto = total_previsto + v_valor where id = v_cx_id;
    end if;
  end if;

  perform public.recalcular_caixinha(v_cx_id);

  return jsonb_build_object('vinculado', true, 'cobranca_id', v_cobranca_id, 'caixinha_id', v_cx_id);
end;
$function$;

drop function if exists public.gerar_cobrancas_mensalidade_mes_atual();

create function public.gerar_cobrancas_mensalidade_mes_atual()
returns uuid[]
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_planejamento record;
  v_cx_id        uuid;
  v_data_venc    date;
  v_atleta       record;
  v_nova_id      uuid;
  v_ids          uuid[] := array[]::uuid[];
begin
  for v_planejamento in
    select * from public.planejamentos where turma_id is not null and status = 'ativo'
  loop
    select id into v_cx_id from public.caixinhas where planejamento_id = v_planejamento.id;
    if v_cx_id is null then
      continue;
    end if;

    v_data_venc := (date_trunc('month', current_date) + ((v_planejamento.dia_vencimento - 1) || ' days')::interval)::date;

    for v_atleta in
      select at.atleta_id,
             coalesce(a.valor_mensalidade, v_planejamento.valor) as valor,
             (a.valor_mensalidade is not null and a.valor_mensalidade = 0) as isento
        from public.atleta_turma at
        join public.atletas a on a.id = at.atleta_id
       where at.turma_id = v_planejamento.turma_id
         and at.ativo = true
         and a.ativo = true
    loop
      if v_atleta.isento then
        continue;
      end if;

      if exists (
        select 1 from public.cobrancas
         where caixinha_id = v_cx_id and atleta_id = v_atleta.atleta_id and data_vencimento = v_data_venc
           and status <> 'cancelado'
      ) then
        continue;
      end if;

      insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, status, data_vencimento)
      values (v_planejamento.clube_id, v_cx_id, v_atleta.atleta_id, v_atleta.valor, 'pendente', v_data_venc)
      returning id into v_nova_id;

      v_ids := array_append(v_ids, v_nova_id);

      update public.caixinhas set total_previsto = total_previsto + v_atleta.valor where id = v_cx_id;
    end loop;

    perform public.recalcular_caixinha(v_cx_id);
  end loop;

  return v_ids;
end;
$function$;

revoke execute on function public.gerar_cobrancas_mensalidade_mes_atual() from public, anon, authenticated;
