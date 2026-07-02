-- ============================================================================
-- Athletto — 0034_financeiro_resumo_dashboard.sql
-- RPC que agrega no Postgres o que o FinanceiroDashboard.vue calculava no
-- cliente (buscando TODAS as transações/cobranças sem limite de linhas).
-- Substitui: 2x listarTransacoes({de}) sem limit + listarCobranças() sem
-- limit. Mantém buscarGrafico()/listarCaixinhas() como estão (já agregados).
-- ============================================================================
create or replace function public.financeiro_resumo(p_clube_id uuid, p_meses_categoria integer default 6)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_inicio_mes date := date_trunc('month', current_date)::date;
  v_hoje       date := current_date;
  v_inicio_cat date := (date_trunc('month', current_date)
                        - ((greatest(1, least(coalesce(p_meses_categoria, 6), 36)) - 1) || ' months')::interval)::date;
  v_receita     numeric(19,4);
  v_despesa     numeric(19,4);
  v_a_receber   numeric(19,4);
  v_atraso      int;
  v_status      jsonb;
  v_categorias  jsonb;
begin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  -- Receita/despesa do mês corrente (transações do mês, somadas no banco).
  select coalesce(sum(valor) filter (where tipo = 'entrada'), 0),
         coalesce(sum(valor) filter (where tipo = 'saida'),   0)
    into v_receita, v_despesa
  from public.transacoes
  where clube_id = p_clube_id and data >= v_inicio_mes;

  -- A receber (soma de cobranças pendentes) + contagem de atrasadas.
  select coalesce(sum(valor) filter (where status = 'pendente'), 0),
         count(*) filter (where status = 'pendente' and data_vencimento < v_hoje)
    into v_a_receber, v_atraso
  from public.cobrancas
  where clube_id = p_clube_id;

  -- Status das cobranças (contagens; usadas no donut + legenda).
  select jsonb_build_object(
    'total',      count(*),
    'pagas',      count(*) filter (where status = 'pago'),
    'pendentes',  count(*) filter (where status = 'pendente' and data_vencimento >= v_hoje),
    'atrasadas',  count(*) filter (where status = 'pendente' and data_vencimento < v_hoje),
    'isentas',    count(*) filter (where status = 'isento'),
    'canceladas', count(*) filter (where status = 'cancelado')
  )
    into v_status
  from public.cobrancas
  where clube_id = p_clube_id;

  -- Despesas por categoria nos últimos N meses (para o donut).
  select coalesce(jsonb_agg(jsonb_build_object('categoria', categoria, 'valor', valor) order by valor desc), '[]'::jsonb)
    into v_categorias
  from (
    select coalesce(categoria, 'Outros') as categoria, sum(valor) as valor
    from public.transacoes
    where clube_id = p_clube_id and tipo = 'saida' and data >= v_inicio_cat
    group by coalesce(categoria, 'Outros')
  ) s;

  return jsonb_build_object(
    'receita_mes',            v_receita,
    'despesa_mes',             v_despesa,
    'a_receber',               v_a_receber,
    'atraso_count',            v_atraso,
    'status_cobrancas',        v_status,
    'despesas_por_categoria',  v_categorias
  );
end;
$function$;

revoke execute on function public.financeiro_resumo(uuid, integer) from public;
grant execute on function public.financeiro_resumo(uuid, integer) to authenticated;
