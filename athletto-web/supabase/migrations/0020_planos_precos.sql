-- ============================================================================
-- Athletto — 0020_planos_precos.sql
-- Preços dos planos: Base R$79 / Pro R$199 / Elite R$449 (antes 0/99/249).
-- Mantém o enum interno (basico/intermediario/profissional); os nomes de
-- exibição (Base/Pro/Elite) vivem no frontend (catálogo em ~/types).
-- Reafirma limites_plano (30/3/1 · 100/10/3 · ilimitado).
-- ============================================================================

create or replace function public.alterar_plano_clube(p_clube_id uuid, p_novo_plano text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano_anterior text;
  v_valor_novo     numeric(19,4);
begin
  if not public.is_superadmin() then
    raise exception 'Permissão negada' using errcode = '42501';
  end if;

  if p_novo_plano not in ('basico', 'intermediario', 'profissional') then
    raise exception 'Plano inválido: %', p_novo_plano using errcode = 'P0001';
  end if;

  select plano::text into v_plano_anterior from public.clubes where id = p_clube_id;
  if v_plano_anterior is null then
    raise exception 'Clube não encontrado' using errcode = 'P0001';
  end if;

  v_valor_novo := case p_novo_plano
    when 'basico'        then 79
    when 'intermediario' then 199
    when 'profissional'  then 449
  end;

  update public.clubes
     set plano = p_novo_plano::public.plano_clube, plano_ativo = true
   where id = p_clube_id;

  update public.assinaturas
     set plano = p_novo_plano::public.plano_clube, valor_mensal = v_valor_novo
   where clube_id = p_clube_id;

  perform public.criar_notificacao(
    p_clube_id, null, 'gestor', 'success', 'sistema',
    'Plano alterado',
    'Seu plano foi alterado para ' || p_novo_plano || '.',
    '/configuracoes#assinatura',
    jsonb_build_object('plano_anterior', v_plano_anterior, 'plano_novo', p_novo_plano)
  );

  insert into public.logs_auditoria (superadmin_id, usuario_id, acao, entidade, entidade_id, detalhes)
  values (auth.uid(), auth.uid(), 'plano_alterado', 'clube', p_clube_id::text,
          jsonb_build_object('de', v_plano_anterior, 'para', p_novo_plano));

  return jsonb_build_object('sucesso', true, 'plano_anterior', v_plano_anterior, 'plano_novo', p_novo_plano);
end;
$$;

grant execute on function public.alterar_plano_clube(uuid, text) to authenticated;

update public.assinaturas a
   set valor_mensal = case c.plano::text
         when 'basico' then 79 when 'intermediario' then 199 when 'profissional' then 449 else a.valor_mensal end
  from public.clubes c
 where c.id = a.clube_id;

insert into public.limites_plano (plano, max_atletas, max_turmas, max_gestores)
values ('basico', 30, 3, 1), ('intermediario', 100, 10, 3), ('profissional', 9999, 9999, 9999)
on conflict (plano) do update set
  max_atletas = excluded.max_atletas,
  max_turmas  = excluded.max_turmas,
  max_gestores = excluded.max_gestores;
