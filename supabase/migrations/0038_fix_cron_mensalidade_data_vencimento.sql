-- ============================================================================
-- Athletto — 0038_fix_cron_mensalidade_data_vencimento.sql
--
-- Fix: gerar_cobrancas_mensalidade_mes_atual calculava a data do ciclo sem
-- avançar pro mês seguinte quando o dia de vencimento já tinha passado no mês
-- corrente (diferente de atleta_entrar_turma, que já fazia isso certo). Em
-- produção o cron roda dia 1 (antes do dia_vencimento de qualquer turma),
-- então na prática nunca dava esse caso — mas se o cron atrasar ou for
-- rodado manualmente depois do dia_vencimento, gerava uma cobrança
-- duplicada com vencimento já no passado. Alinha a lógica com
-- atleta_entrar_turma pra ficar correto em qualquer dia que rode.
-- ============================================================================

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
    if v_data_venc < current_date then
      v_data_venc := (v_data_venc + interval '1 month')::date;
    end if;

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
