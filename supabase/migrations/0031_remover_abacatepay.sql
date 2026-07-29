-- ============================================================================
-- Athletto — 0031_remover_abacatepay.sql
-- Remove o gateway AbacatePay do sistema; ValidaPay passa a ser o único
-- gateway Pix. Confirmado antes de rodar: 0 cobrancas usam
-- abacatepay_payment_id e só 1 clube_credenciais de teste (sem uso real).
-- ============================================================================

-- ── 1. RPC regenerar_link_pix: limpava campos AbacatePay → agora ValidaPay ───
create or replace function public.regenerar_link_pix(p_cobranca_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clube uuid;
begin
  select clube_id into v_clube from public.cobrancas where id = p_cobranca_id;
  if v_clube is null then
    raise exception 'Cobrança não encontrada';
  end if;

  if coalesce(auth.role(), '') <> 'service_role' then
    if v_clube is distinct from public.current_clube_id() and not public.is_superadmin() then
      raise exception 'Acesso negado' using errcode = '42501';
    end if;
  end if;

  update public.cobrancas
     set validapay_charge_id = null,
         validapay_emv = null
   where id = p_cobranca_id and status = 'pendente';
end;
$function$;

-- ── 2. Tabela exclusiva do Modelo A (chave AbacatePay por clube) ────────────
drop table if exists public.clube_credenciais;

-- ── 3. Colunas de status AbacatePay em clubes ────────────────────────────────
alter table public.clubes
  drop column if exists abacatepay_conectado,
  drop column if exists abacatepay_ultimos4;

-- ── 4. Colunas AbacatePay em cobrancas (validapay_charge_id/emv já existem) ──
alter table public.cobrancas
  drop column if exists abacatepay_payment_id,
  drop column if exists abacatepay_link;

-- ── 5. configuracoes_sistema: renomear pra refletir o gateway atual ─────────
alter table public.configuracoes_sistema
  rename column abacatepay_ambiente to validapay_ambiente;
alter table public.configuracoes_sistema
  rename column abacatepay_webhook_secret_configurado to validapay_webhook_secret_configurado;
alter table public.configuracoes_sistema
  rename constraint configuracoes_sistema_abacatepay_ambiente_check to configuracoes_sistema_validapay_ambiente_check;
