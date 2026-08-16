-- ============================================================================
-- 0045_fix_regua_cobranca_out_params_prefixados.sql
--
-- 0044 só corrigiu a ambiguidade no SELECT contra regua_cobranca_config, mas
-- `on conflict (cobranca_id, tipo)` também resolve esses nomes contra os
-- parâmetros de saída (RETURNS TABLE) — mesmo erro 42702 num lugar diferente.
-- Fix definitivo: prefixa todos os parâmetros de saída com `out_`, garantindo
-- que nunca colidem com nome de coluna em lugar nenhum do corpo da função.
-- ============================================================================

drop function if exists public.gerar_mensagens_regua_cobranca();

create function public.gerar_mensagens_regua_cobranca()
returns table (out_id uuid, out_clube_id uuid, out_cobranca_id uuid, out_tipo text, out_template_usado text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cb record;
  cfg record;
  v_dias_ate int;
  v_tipo text;
  v_template text;
  v_dia_atraso int;
  v_nova_id uuid;
begin
  for cb in
    select c.id, c.clube_id, c.data_vencimento
      from public.cobrancas c
     where c.status = 'pendente'
       and c.data_vencimento >= current_date - interval '30 days'
  loop
    select * into cfg from public.regua_cobranca_config rcc
     where rcc.clube_id = cb.clube_id and rcc.ativo = true;
    if not found then
      select * into cfg from public.regua_cobranca_config rcc
       where rcc.clube_id is null and rcc.ativo = true;
    end if;
    if not found then
      continue;
    end if;

    v_dias_ate := cb.data_vencimento - current_date;
    v_tipo := null;
    v_template := null;

    if v_dias_ate = cfg.dias_antes then
      v_tipo := 'lembrete_antes';
      v_template := 'lembrete_antes_vencimento';
    elsif v_dias_ate = 0 then
      v_tipo := 'lembrete_dia';
      v_template := 'lembrete_dia_vencimento';
    elsif v_dias_ate < 0 then
      foreach v_dia_atraso in array cfg.dias_atraso loop
        if -v_dias_ate = v_dia_atraso then
          v_tipo := 'atraso_' || v_dia_atraso::text;
          v_template := 'cobranca_atrasada_' || v_dia_atraso::text || 'd';
        end if;
      end loop;
    end if;

    if v_tipo is null then
      continue;
    end if;

    insert into public.mensagens_whatsapp (clube_id, cobranca_id, tipo, template_usado, status)
    values (cb.clube_id, cb.id, v_tipo, v_template, 'pendente')
    on conflict (cobranca_id, tipo) do nothing
    returning mensagens_whatsapp.id into v_nova_id;

    if v_nova_id is not null then
      out_id := v_nova_id;
      out_clube_id := cb.clube_id;
      out_cobranca_id := cb.id;
      out_tipo := v_tipo;
      out_template_usado := v_template;
      return next;
    end if;
  end loop;
end;
$function$;

revoke execute on function public.gerar_mensagens_regua_cobranca() from public, anon, authenticated;
