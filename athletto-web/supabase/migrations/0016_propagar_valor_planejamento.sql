-- ESPELHO: ao editar o valor padrão de um planejamento, propaga para as
-- cobranças FUTURAS e NÃO PAGAS dos atletas que seguem o padrão
-- (valor_customizado IS NULL AND NOT isento). Nunca toca pago/vencido nem
-- atletas diferenciados/isentos. Idempotente e transacional.

-- Prévia: quantos atletas e cobranças seriam afetados (para confirmação na UI).
create or replace function public.preview_propagacao_planejamento(p_planejamento_id uuid, p_novo_valor numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_clube uuid;
  v_atletas int;
  v_cobrancas int;
begin
  select clube_id into v_clube from public.planejamentos where id = p_planejamento_id;
  if v_clube is null then raise exception 'Planejamento não encontrado'; end if;
  if v_clube is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  select count(distinct pa.atleta_id), count(c.id)
    into v_atletas, v_cobrancas
  from public.planejamento_atletas pa
  join public.caixinhas cx on cx.planejamento_id = p_planejamento_id
  join public.cobrancas c
    on c.caixinha_id = cx.id
   and c.atleta_id = pa.atleta_id
   and c.status = 'pendente'
   and c.data_vencimento >= current_date
   and c.valor is distinct from p_novo_valor
  where pa.planejamento_id = p_planejamento_id
    and pa.valor_customizado is null
    and pa.isento = false;

  return jsonb_build_object('atletas', coalesce(v_atletas,0), 'cobrancas', coalesce(v_cobrancas,0));
end;
$$;

grant execute on function public.preview_propagacao_planejamento(uuid, numeric) to authenticated;

-- Aplica a propagação. Retorna quantas cobranças foram atualizadas.
create or replace function public.propagar_valor_planejamento(p_planejamento_id uuid, p_novo_valor numeric)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clube uuid;
  v_atualizadas int := 0;
begin
  select clube_id into v_clube from public.planejamentos where id = p_planejamento_id;
  if v_clube is null then raise exception 'Planejamento não encontrado'; end if;
  if v_clube is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  with alvos as (
    select c.id
    from public.planejamento_atletas pa
    join public.caixinhas cx on cx.planejamento_id = p_planejamento_id
    join public.cobrancas c
      on c.caixinha_id = cx.id
     and c.atleta_id = pa.atleta_id
     and c.status = 'pendente'
     and c.data_vencimento >= current_date
    where pa.planejamento_id = p_planejamento_id
      and pa.valor_customizado is null
      and pa.isento = false
  )
  update public.cobrancas c
     set valor = p_novo_valor, atualizado_em = now()
   from alvos a
   where c.id = a.id;
  get diagnostics v_atualizadas = row_count;

  -- Recalcula totais das caixinhas do planejamento.
  perform public.recalcular_caixinha(cx.id)
  from public.caixinhas cx where cx.planejamento_id = p_planejamento_id;

  return v_atualizadas;
end;
$$;

grant execute on function public.propagar_valor_planejamento(uuid, numeric) to authenticated;
