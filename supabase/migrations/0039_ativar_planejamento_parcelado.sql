-- ============================================================================
-- Athletto — 0039_ativar_planejamento_parcelado.sql
--
-- ativar_planejamento só sabia gerar 1 cobrança por atleta (recorrente ou
-- único). Com o tipo `parcelado` (0036), ativar um planejamento parcelado
-- precisa gerar N cobranças por atleta — uma por parcela, mensal a partir de
-- data_inicio. Adiciona esse branch preservando 100% o comportamento
-- existente de recorrente/único.
-- ============================================================================

create or replace function public.ativar_planejamento(p_planejamento_id uuid, p_gestor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  if coalesce(auth.role(), '') = 'service_role' then
    if not exists (
      select 1 from public.gestores g
      where g.id = p_gestor_id
        and g.clube_id = p.clube_id
        and g.ativo
    ) then
      raise exception 'Acesso negado' using errcode = '42501';
    end if;
  else
    if p.clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
      raise exception 'Acesso negado' using errcode = '42501';
    end if;
  end if;

  if p.status <> 'inativo' then
    raise exception 'Apenas planejamentos inativos podem ser ativados';
  end if;

  -- ── Parcelado: N cobranças por atleta (uma por parcela) ───────────────────
  if p.tipo = 'parcelado' then
    if p.numero_parcelas is null or p.data_inicio is null then
      raise exception 'Planejamento parcelado sem número de parcelas ou data de início';
    end if;
    if p.dia_vencimento is null then
      raise exception 'Planejamento parcelado sem dia de vencimento';
    end if;

    select count(*), coalesce(sum(coalesce(pa.valor_customizado, p.valor)), 0)
      into total_atletas, total_previsto
      from public.planejamento_atletas pa
     where pa.planejamento_id = p_planejamento_id
       and pa.isento = false;

    total_previsto := total_previsto * p.numero_parcelas;

    insert into public.caixinhas (clube_id, planejamento_id, nome, total_previsto)
    values (p.clube_id, p_planejamento_id, p.nome, total_previsto)
    returning id into cx_id;

    insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, data_vencimento)
    select
      p.clube_id, cx_id, pa.atleta_id, coalesce(pa.valor_customizado, p.valor),
      (date_trunc('month', p.data_inicio) + ((n.i - 1) || ' months')::interval
       + ((p.dia_vencimento - 1) || ' days')::interval)::date
      from public.planejamento_atletas pa
      cross join generate_series(1, p.numero_parcelas) as n(i)
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
      'cobrancas_geradas', total_atletas * p.numero_parcelas,
      'total_previsto',    total_previsto
    );
  end if;

  -- ── Recorrente / Único: comportamento original, inalterado ────────────────
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
$function$;
