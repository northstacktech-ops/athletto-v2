-- ============================================================================
-- Athletto — 0036_mensalidade_turma_e_caixinha_parcelada.sql
--
-- Parte A: mensalidade deixa de ser um Planejamento manual e passa a nascer
-- automaticamente junto com a turma. `planejamentos.turma_id` marca esse
-- vínculo 1:1. Entrada/saída de atleta na turma passam a gerar/cancelar
-- cobrança automaticamente, sem retroativo (só a partir do ciclo atual).
--
-- Parte B: caixinhas ganham o tipo `parcelado` (valor total dividido em N
-- parcelas mensais, com data de início). Adicionar atleta depois que a
-- caixinha já começou oferece dois modos: `parcial` (só as parcelas que
-- restam, no mesmo valor de parcela de quem já está desde o início) ou
-- `integral` (valor total do plano inteiro, comprimido nas parcelas que
-- restam).
-- ============================================================================

-- ── Colunas novas ────────────────────────────────────────────────────────────

alter table public.turmas
  add column dia_vencimento_mensalidade int not null default 10
    check (dia_vencimento_mensalidade between 1 and 28);

alter table public.planejamentos
  add column turma_id uuid unique references public.turmas(id),
  add column numero_parcelas int check (numero_parcelas is null or numero_parcelas > 0),
  add column data_inicio date;

alter type public.planejamento_tipo add value if not exists 'parcelado';

comment on column public.planejamentos.turma_id is
  'Não nulo = este planejamento É a mensalidade da turma (nasce/morre com ela). Nunca aparece na tela manual de Novo Planejamento.';

-- ── Parte A: mensalidade automática por turma ───────────────────────────────

create or replace function public.criar_planejamento_mensalidade_turma(p_turma_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  t record;
  v_id uuid;
begin
  select * into t from public.turmas where id = p_turma_id;
  if not found then
    raise exception 'Turma não encontrada';
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and t.clube_id is distinct from public.current_clube_id()
     and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  insert into public.planejamentos (
    clube_id, nome, tipo, valor, periodicidade, dia_vencimento,
    status, ativado_em, turma_id
  )
  values (
    t.clube_id, 'Mensalidade — ' || t.nome, 'recorrente', t.valor_mensalidade_padrao,
    'mensal', t.dia_vencimento_mensalidade,
    'ativo', now(), p_turma_id
  )
  returning id into v_id;

  return v_id;
end;
$function$;

-- Vincula atleta à turma e, se ela tiver mensalidade ativa, gera a cobrança
-- só do ciclo atual/próximo (nunca meses anteriores à entrada dele).
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
     where caixinha_id = v_cx_id and atleta_id = p_atleta_id and data_vencimento = v_data_venc;

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

-- Desvincula atleta da turma e cancela cobranças FUTURAS pendentes (histórico
-- passado — já pago ou já vencido — fica intacto).
create or replace function public.atleta_sair_turma(p_atleta_id uuid, p_turma_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clube        uuid;
  v_planejamento record;
  v_cx_id        uuid;
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

  update public.atleta_turma set ativo = false
   where atleta_id = p_atleta_id and turma_id = p_turma_id;

  select * into v_planejamento from public.planejamentos
   where turma_id = p_turma_id and status = 'ativo';
  if not found then
    return;
  end if;

  select id into v_cx_id from public.caixinhas where planejamento_id = v_planejamento.id;
  if v_cx_id is null then
    return;
  end if;

  update public.cobrancas
     set status = 'cancelado', atualizado_em = now()
   where caixinha_id = v_cx_id
     and atleta_id = p_atleta_id
     and status = 'pendente'
     and data_vencimento >= current_date;

  perform public.recalcular_caixinha(v_cx_id);
end;
$function$;

-- Cron mensal (dia 1): gera a cobrança do ciclo corrente pra cada atleta hoje
-- vinculado a uma turma com mensalidade ativa. Idempotente (não duplica se já
-- existir cobrança pro mesmo atleta+caixinha+vencimento).
create or replace function public.gerar_cobrancas_mensalidade_mes_atual()
returns int
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_planejamento record;
  v_cx_id        uuid;
  v_data_venc    date;
  v_atleta       record;
  v_geradas      int := 0;
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
      ) then
        continue;
      end if;

      insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, status, data_vencimento)
      values (v_planejamento.clube_id, v_cx_id, v_atleta.atleta_id, v_atleta.valor, 'pendente', v_data_venc);

      update public.caixinhas set total_previsto = total_previsto + v_atleta.valor where id = v_cx_id;
      v_geradas := v_geradas + 1;
    end loop;

    perform public.recalcular_caixinha(v_cx_id);
  end loop;

  return v_geradas;
end;
$function$;

-- ── Parte B: rateio em caixinha parcelada ───────────────────────────────────

create or replace function public.adicionar_atleta_caixinha_parcelada(
  p_planejamento_id uuid,
  p_atleta_id       uuid,
  p_modo            text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  p               record;
  v_clube         uuid;
  v_cx_id         uuid;
  v_restantes     int;
  v_valor_parcela numeric(19,4);
  v_row           record;
  v_soma          numeric(19,4) := 0;
  v_geradas       int := 0;
begin
  if p_modo not in ('parcial', 'integral') then
    raise exception 'Modo inválido: use parcial ou integral';
  end if;

  select * into p from public.planejamentos where id = p_planejamento_id;
  if not found then
    raise exception 'Planejamento não encontrado';
  end if;
  if p.tipo <> 'parcelado' then
    raise exception 'Esta operação só vale para planejamentos parcelados';
  end if;
  if p.status <> 'ativo' then
    raise exception 'Planejamento não está ativo';
  end if;
  if p.numero_parcelas is null or p.data_inicio is null then
    raise exception 'Planejamento parcelado sem número de parcelas ou data de início';
  end if;

  v_clube := p.clube_id;
  if coalesce(auth.role(), '') <> 'service_role'
     and v_clube is distinct from public.current_clube_id()
     and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  select id into v_cx_id from public.caixinhas where planejamento_id = p_planejamento_id;
  if v_cx_id is null then
    raise exception 'Caixinha não encontrada pra este planejamento';
  end if;

  select count(*) into v_restantes
    from generate_series(1, p.numero_parcelas) as i
   where (date_trunc('month', p.data_inicio) + ((i - 1) || ' months')::interval
          + ((p.dia_vencimento - 1) || ' days')::interval)::date >= current_date;

  if v_restantes = 0 then
    raise exception 'Não há parcelas restantes nesta caixinha';
  end if;

  v_valor_parcela := case
    when p_modo = 'parcial' then round(p.valor / p.numero_parcelas, 2)
    else                          round(p.valor / v_restantes, 2)
  end;

  insert into public.planejamento_atletas (planejamento_id, atleta_id, valor_customizado)
  values (p_planejamento_id, p_atleta_id, v_valor_parcela)
  on conflict (planejamento_id, atleta_id) do update set valor_customizado = excluded.valor_customizado;

  for v_row in (
    select i as num,
           (date_trunc('month', p.data_inicio) + ((i - 1) || ' months')::interval
            + ((p.dia_vencimento - 1) || ' days')::interval)::date as venc
      from generate_series(1, p.numero_parcelas) as i
     where (date_trunc('month', p.data_inicio) + ((i - 1) || ' months')::interval
            + ((p.dia_vencimento - 1) || ' days')::interval)::date >= current_date
     order by i
  )
  loop
    v_geradas := v_geradas + 1;
    insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, status, data_vencimento)
    values (
      v_clube, v_cx_id, p_atleta_id,
      -- Modo integral: a última parcela absorve o resíduo de arredondamento
      -- pra fechar exatamente no valor total do plano.
      case when p_modo = 'integral' and v_geradas = v_restantes
           then p.valor - v_soma
           else v_valor_parcela
      end,
      'pendente', v_row.venc
    );
    v_soma := v_soma + v_valor_parcela;
  end loop;

  update public.caixinhas
     set total_previsto = total_previsto + (case when p_modo = 'integral' then p.valor else v_valor_parcela * v_restantes end)
   where id = v_cx_id;

  perform public.recalcular_caixinha(v_cx_id);

  return jsonb_build_object('parcelas_geradas', v_restantes, 'valor_parcela', v_valor_parcela, 'modo', p_modo);
end;
$function$;

-- ── Permissões ───────────────────────────────────────────────────────────────
-- `CREATE FUNCTION` concede EXECUTE a PUBLIC por padrão (o que reabriria pro
-- anon) — revoga de PUBLIC e concede só ao papel que cada função realmente
-- precisa, mesmo padrão de 0033_revoke_public_execute.sql.

revoke execute on function public.criar_planejamento_mensalidade_turma(uuid) from public;
revoke execute on function public.atleta_entrar_turma(uuid, uuid) from public;
revoke execute on function public.atleta_sair_turma(uuid, uuid) from public;
revoke execute on function public.adicionar_atleta_caixinha_parcelada(uuid, uuid, text) from public;

grant execute on function public.criar_planejamento_mensalidade_turma(uuid) to authenticated;
grant execute on function public.atleta_entrar_turma(uuid, uuid) to authenticated;
grant execute on function public.atleta_sair_turma(uuid, uuid) to authenticated;
grant execute on function public.adicionar_atleta_caixinha_parcelada(uuid, uuid, text) to authenticated;

-- Cron-only: chamada via service_role a partir do server, nunca pelo client.
revoke execute on function public.gerar_cobrancas_mensalidade_mes_atual() from public, anon, authenticated;
