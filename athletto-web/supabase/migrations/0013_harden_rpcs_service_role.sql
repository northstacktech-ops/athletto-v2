-- ============================================================================
-- 0013_harden_rpcs_service_role.sql
-- P1.1 do REVIEW-FUNCIONALIDADES-2026-06: marcar_cobranca_paga e
-- regenerar_link_pix usavam apenas current_clube_id()/auth.uid() — o mesmo
-- padrão que quebrou ativar_planejamento quando chamado via service role
-- (corrigido na 0011). Endurecidos preventivamente com o mesmo bloco:
--   • service_role: valida p_gestor_id contra o clube (quando aplicável);
--   • usuário autenticado: regra original (gestor do clube ou superadmin).
-- (Aplicado no projeto via MCP em 11/06/2026; versionado aqui para reprodução.)
-- ============================================================================

create or replace function public.marcar_cobranca_paga(p_cobranca_id uuid, p_gestor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cb record;
begin
  select * into cb from public.cobrancas where id = p_cobranca_id and status = 'pendente';
  if not found then
    raise exception 'Cobrança não pendente';
  end if;

  if coalesce(auth.role(), '') = 'service_role' then
    if not exists (
      select 1 from public.gestores g
      where g.id = p_gestor_id and g.clube_id = cb.clube_id and g.ativo
    ) then
      raise exception 'Acesso negado' using errcode = '42501';
    end if;
  else
    if cb.clube_id is distinct from public.current_clube_id() and not public.is_superadmin() then
      raise exception 'Acesso negado' using errcode = '42501';
    end if;
  end if;

  update public.cobrancas
     set status = 'pago', data_pagamento = current_date
   where id = p_cobranca_id;

  insert into public.transacoes
    (clube_id, tipo, valor, descricao, data, cobranca_id, caixinha_id, atleta_id, origem, registrado_por)
  values
    (cb.clube_id, 'entrada', cb.valor, 'Pagamento manual', current_date,
     cb.id, cb.caixinha_id, cb.atleta_id, 'manual', coalesce(p_gestor_id, auth.uid()));

  perform public.recalcular_caixinha(cb.caixinha_id);
end;
$$;

create or replace function public.regenerar_link_pix(p_cobranca_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clube uuid;
begin
  select clube_id into v_clube from public.cobrancas where id = p_cobranca_id;
  if v_clube is null then
    raise exception 'Cobrança não encontrada';
  end if;

  -- service_role (server route já autenticou o caller); demais: regra original
  if coalesce(auth.role(), '') <> 'service_role' then
    if v_clube is distinct from public.current_clube_id() and not public.is_superadmin() then
      raise exception 'Acesso negado' using errcode = '42501';
    end if;
  end if;

  update public.cobrancas
     set abacatepay_payment_id = null,
         abacatepay_link = null
   where id = p_cobranca_id and status = 'pendente';
end;
$$;
