-- ============================================================================
-- Athletto — 0040_fix_ativar_planejamento_parcelado_valor_total.sql
--
-- 0039 tratava `planejamentos.valor` (parcelado) como valor POR PARCELA, mas
-- adicionar_atleta_caixinha_parcelada (0036) trata como valor TOTAL do plano
-- — inconsistência entre as duas RPCs. Alinha ativar_planejamento pra também
-- tratar como total, dividindo internamente pelo número de parcelas, com a
-- última parcela absorvendo o resíduo de arredondamento (mesmo padrão de
-- adicionar_atleta_caixinha_parcelada).
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
  pa_rec         record;
  v_parcela      numeric(19,4);
  v_soma         numeric(19,4);
  i              int;
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

  -- ── Parcelado: N cobranças por atleta, valor total dividido em parcelas ───
  if p.tipo = 'parcelado' then
    if p.numero_parcelas is null or p.data_inicio is null then
      raise exception 'Planejamento parcelado sem número de parcelas ou data de início';
    end if;
    if p.dia_vencimento is null then
      raise exception 'Planejamento parcelado sem dia de vencimento';
    end if;

    insert into public.caixinhas (clube_id, planejamento_id, nome, total_previsto)
    values (p.clube_id, p_planejamento_id, p.nome, 0)
    returning id into cx_id;

    total_atletas := 0;
    for pa_rec in
      select pa.atleta_id, coalesce(pa.valor_customizado, p.valor) as total_atleta
        from public.planejamento_atletas pa
       where pa.planejamento_id = p_planejamento_id
         and pa.isento = false
    loop
      total_atletas := total_atletas + 1;
      v_parcela := round(pa_rec.total_atleta / p.numero_parcelas, 2);
      v_soma := 0;
      for i in 1..p.numero_parcelas loop
        insert into public.cobrancas (clube_id, caixinha_id, atleta_id, valor, data_vencimento)
        values (
          p.clube_id, cx_id, pa_rec.atleta_id,
          case when i = p.numero_parcelas then pa_rec.total_atleta - v_soma else v_parcela end,
          (date_trunc('month', p.data_inicio) + ((i - 1) || ' months')::interval
           + ((p.dia_vencimento - 1) || ' days')::interval)::date
        );
        v_soma := v_soma + v_parcela;
      end loop;
    end loop;

    update public.caixinhas
       set total_previsto = (select coalesce(sum(valor), 0) from public.cobrancas where caixinha_id = cx_id)
     where id = cx_id;
    update public.caixinhas
       set total_pendente = total_previsto
     where id = cx_id;

    update public.planejamentos
       set status = 'ativo', ativado_em = now()
     where id = p_planejamento_id;

    select cx.total_previsto into total_previsto from public.caixinhas cx where cx.id = cx_id;

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
