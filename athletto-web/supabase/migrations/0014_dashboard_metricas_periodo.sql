-- Overload de dashboard_metricas com intervalo de datas.
-- receita/despesa/saldo passam a respeitar [p_de, p_ate]; métricas de contagem
-- (atletas, turmas, cobranças, saúde) seguem sendo pontuais. A função de 1 arg
-- continua existindo para compatibilidade.
create or replace function public.dashboard_metricas(p_clube_id uuid, p_de date, p_ate date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_de date := coalesce(p_de, date_trunc('month', current_date)::date);
  v_ate date := coalesce(p_ate, current_date);
begin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total_atletas',          (select count(*) from public.atletas  where clube_id = p_clube_id and ativo = true),
    'total_turmas',           (select count(*) from public.turmas   where clube_id = p_clube_id and ativo = true),
    'receita_mes',            (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'entrada' and data between v_de and v_ate),
    'despesas_mes',           (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'saida'   and data between v_de and v_ate),
    'saldo_mes',
      (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'entrada' and data between v_de and v_ate) -
      (select coalesce(sum(valor), 0) from public.transacoes where clube_id = p_clube_id and tipo = 'saida'   and data between v_de and v_ate),
    'cobranças_pendentes',    (select count(*) from public.cobrancas where clube_id = p_clube_id and status = 'pendente'),
    'cobranças_atraso',       (select count(*) from public.cobrancas where clube_id = p_clube_id and status = 'pendente' and data_vencimento < current_date),
    'atletas_saudaveis',      (select count(*) from public.atletas where clube_id = p_clube_id and ativo = true and saude = 'saudavel'),
    'atletas_lesionados',     (select count(*) from public.atletas where clube_id = p_clube_id and ativo = true and saude = 'lesionado'),
    'atletas_em_recuperacao', (select count(*) from public.atletas where clube_id = p_clube_id and ativo = true and saude = 'em_recuperacao')
  );
end;
$$;

grant execute on function public.dashboard_metricas(uuid, date, date) to authenticated;
