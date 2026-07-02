-- Trial padrão fixado em 14 dias (antes 30). Afeta apenas cadastros novos.
-- 1) Atualiza a config singleton (fonte que o trigger lê).
update public.configuracoes_sistema set trial_dias_padrao = 14 where id = 'cfg-singleton';

-- 2) Atualiza o fallback do trigger (caso a config esteja ausente) de 30 → 14.
create or replace function public.tg_criar_assinatura_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_dias int;
begin
  select trial_dias_padrao into v_trial_dias
    from public.configuracoes_sistema where id = 'cfg-singleton';
  v_trial_dias := coalesce(v_trial_dias, 14);

  insert into public.assinaturas (clube_id, plano, status, trial_inicio, trial_fim, valor_mensal)
  values (new.id, new.plano, 'trial', current_date, current_date + v_trial_dias, 0)
  on conflict (clube_id) do nothing;

  return new;
end;
$$;
