-- Assinar/pagar durante o trial NÃO encurta os dias grátis.
-- Antes: ativar_plano_clube fazia trial_fim = current_date (encerrava o trial na hora).
-- Agora: mantém o trial até o fim e agenda a 1ª cobrança para a data de término
-- do trial (proxima_cobranca = trial_fim). Se o trial já acabou, ativa de imediato.
create or replace function public.ativar_plano_clube(p_clube_id uuid, p_plano text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_fim date;
begin
  if not public.is_superadmin() then
    raise exception 'Permissão negada' using errcode = '42501';
  end if;

  perform public.alterar_plano_clube(p_clube_id, p_plano);

  select trial_fim into v_trial_fim
    from public.assinaturas where clube_id = p_clube_id;

  if v_trial_fim is not null and v_trial_fim > current_date then
    -- Mantém os dias grátis; 1ª cobrança só no fim do trial.
    update public.assinaturas
       set ativada_em = coalesce(ativada_em, now()),
           proxima_cobranca = v_trial_fim
     where clube_id = p_clube_id;
  else
    -- Trial já terminou → ativa e cobra a partir de hoje.
    update public.assinaturas
       set status = 'ativa',
           ativada_em = now(),
           proxima_cobranca = current_date,
           trial_fim = current_date
     where clube_id = p_clube_id;
  end if;

  return jsonb_build_object('sucesso', true);
end;
$$;

grant execute on function public.ativar_plano_clube(uuid, text) to authenticated;
