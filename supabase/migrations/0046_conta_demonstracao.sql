-- ============================================================================
-- 0046_conta_demonstracao.sql
--
-- Flag pra marcar clubes que são contas de apresentação/venda (dados sempre
-- mocados, plano fixo pra demonstrar o produto pro cliente) — essas contas
-- não podem inflar as métricas financeiras que o admin vê (MRR, ARR, receita,
-- contagem de clubes ativos etc.), já que não representam receita real.
-- ============================================================================

alter table public.clubes
  add column if not exists conta_demonstracao boolean not null default false;

comment on column public.clubes.conta_demonstracao is
  'Clube usado como conta de apresentação/venda (dados mocados, plano fixo) — excluído das métricas financeiras do admin.';

-- Berserkers é a conta de demonstração usada pra apresentar o produto.
update public.clubes
set conta_demonstracao = true
where id = '0489305d-9c42-43a7-8331-18f37963159d';

-- ── admin_metricas: exclui clubes de demonstração de todas as contagens/somas ──
create or replace function public.admin_metricas()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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

  select coalesce(sum(a.valor_mensal), 0) into v_mrr
    from public.assinaturas a
    join public.clubes c on c.id = a.clube_id
   where a.status = 'ativa' and not c.conta_demonstracao;

  select count(*) into v_cancel_mes from public.assinaturas a
    join public.clubes c on c.id = a.clube_id
   where a.status = 'cancelada' and a.cancelada_em >= v_inicio_mes and not c.conta_demonstracao;
  select count(*) into v_total_mes from public.assinaturas a
    join public.clubes c on c.id = a.clube_id
   where a.status in ('ativa', 'inadimplente', 'cancelada') and not c.conta_demonstracao;
  v_churn := case when v_total_mes > 0
                  then round((v_cancel_mes::numeric / v_total_mes) * 100, 2)
                  else 0 end;

  return jsonb_build_object(
    'total_clubes',         (select count(*) from public.clubes where not conta_demonstracao),
    'clubes_ativos',        (select count(*) from public.assinaturas a join public.clubes c on c.id = a.clube_id
                               where a.status = 'ativa' and not c.conta_demonstracao),
    'clubes_trial',         (select count(*) from public.assinaturas a join public.clubes c on c.id = a.clube_id
                               where a.status = 'trial' and not c.conta_demonstracao),
    'clubes_inadimplentes', (select count(*) from public.assinaturas a join public.clubes c on c.id = a.clube_id
                               where a.status = 'inadimplente' and not c.conta_demonstracao),
    'clubes_cancelados',    (select count(*) from public.assinaturas a join public.clubes c on c.id = a.clube_id
                               where a.status = 'cancelada' and not c.conta_demonstracao),
    'total_atletas',        (select count(*) from public.atletas at join public.clubes c on c.id = at.clube_id
                               where at.ativo = true and not c.conta_demonstracao),
    'total_gestores',       (select count(*) from public.gestores g join public.clubes c on c.id = g.clube_id
                               where g.ativo = true and not c.conta_demonstracao),
    'mrr',                  v_mrr,
    'arr',                  v_mrr * 12,
    'receita_mes',          (select coalesce(sum(m.valor), 0) from public.movimentacoes_sistema m
                               left join public.clubes c on c.id = m.clube_id
                              where m.tipo = 'mensalidade_recebida' and m.data >= v_inicio_mes
                                and coalesce(c.conta_demonstracao, false) = false),
    'receita_pendente',     (select coalesce(sum(a.valor_mensal), 0) from public.assinaturas a
                               join public.clubes c on c.id = a.clube_id
                              where a.status = 'inadimplente' and not c.conta_demonstracao),
    'churn_mes_percent',    v_churn,
    'vouchers_ativos',      (select count(*) from public.vouchers where status = 'ativo'),
    'indicacoes_pendentes', (select count(*) from public.indicacoes where status = 'pendente'),
    'webhooks_falhos_24h',  (select count(*) from public.webhook_logs
                              where status = 'erro' and recebido_em >= now() - interval '24 hours')
  );
end;
$function$;

-- ── admin_crescimento: mesma exclusão no histórico mensal ──────────────────
create or replace function public.admin_crescimento(p_meses integer DEFAULT 6)
returns table(mes text, novos_clubes integer, cancelamentos integer, mrr numeric)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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
        and c.criado_em < (m.inicio + interval '1 month')
        and not c.conta_demonstracao) as novos_clubes,
    (select count(*)::int from public.assinaturas a
      join public.clubes c on c.id = a.clube_id
      where a.cancelada_em >= m.inicio
        and a.cancelada_em < (m.inicio + interval '1 month')
        and not c.conta_demonstracao) as cancelamentos,
    coalesce((
      select sum(a.valor_mensal) from public.assinaturas a
      join public.clubes c on c.id = a.clube_id
       where a.status in ('ativa', 'inadimplente', 'cancelada')
         and a.ativada_em is not null
         and a.ativada_em < (m.inicio + interval '1 month')
         and (a.cancelada_em is null or a.cancelada_em >= (m.inicio + interval '1 month'))
         and not c.conta_demonstracao
    ), 0)::numeric as mrr
  from meses m
  order by m.inicio;
end;
$function$;
