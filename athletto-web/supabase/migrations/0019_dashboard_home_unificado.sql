-- Dashboard em UMA chamada: métricas + gráfico + turmas de hoje + alertas.
-- Reduz 4 round-trips a 1 (performance do painel inicial).
create or replace function public.dashboard_home(
  p_clube_id uuid,
  p_de date default null,
  p_ate date default null,
  p_meses int default 6
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dow int := extract(dow from current_date)::int;
  v_metricas jsonb;
  v_grafico jsonb;
  v_turmas jsonb;
  v_alertas jsonb;
begin
  if p_clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  v_metricas := public.dashboard_metricas(p_clube_id, p_de, p_ate);

  select coalesce(jsonb_agg(r order by ord), '[]'::jsonb) into v_grafico from (
    select to_char(m.inicio,'YYYY-MM') as ord,
      jsonb_build_object(
        'mes', to_char(m.inicio,'TMmon'),
        'receita', coalesce(sum(t.valor) filter (where t.tipo='entrada'),0),
        'despesa', coalesce(sum(t.valor) filter (where t.tipo='saida'),0)
      ) as r
    from (
      select generate_series(
        date_trunc('month', current_date) - ((greatest(1, least(coalesce(p_meses,6),36)) - 1) || ' months')::interval,
        date_trunc('month', current_date),
        '1 month'::interval
      )::date as inicio
    ) m
    left join public.transacoes t
      on t.clube_id = p_clube_id and t.data >= m.inicio and t.data < (m.inicio + interval '1 month')
    group by m.inicio
  ) s;

  select coalesce(jsonb_agg(to_jsonb(tt) order by tt.horario_inicio), '[]'::jsonb)
  into v_turmas
  from (
    select * from public.turmas
    where clube_id = p_clube_id and ativo = true and dias_semana @> array[v_dow]
    order by horario_inicio
  ) tt;

  select coalesce(jsonb_agg(a order by ord desc), '[]'::jsonb) into v_alertas from (
    select al.data_deteccao as ord, jsonb_build_object(
      'id', al.id, 'atleta_id', al.atleta_id, 'turma_id', al.turma_id,
      'faltas_consecutivas', al.faltas_consecutivas, 'data_deteccao', al.data_deteccao,
      'dispensado', al.dispensado,
      'atleta', jsonb_build_object('id', at.id, 'nome', at.nome, 'apelido', at.apelido, 'foto_url', at.foto_url, 'telefone_responsavel', at.telefone_responsavel),
      'turma', jsonb_build_object('id', tu.id, 'nome', tu.nome)
    ) as a
    from public.alertas_evasao al
    left join public.atletas at on at.id = al.atleta_id
    left join public.turmas tu on tu.id = al.turma_id
    where al.clube_id = p_clube_id and al.dispensado = false
    order by al.data_deteccao desc
    limit 4
  ) s;

  return jsonb_build_object('metricas', v_metricas, 'grafico', v_grafico, 'turmas_hoje', v_turmas, 'alertas', v_alertas);
end;
$$;

grant execute on function public.dashboard_home(uuid, date, date, int) to authenticated;
