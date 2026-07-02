-- Checkout de assinatura (clube paga o Athletto via Pix na conta Master ValidaPay).
-- Guarda o Pix pendente da assinatura e o plano que será ativado ao confirmar.
alter table public.assinaturas
  add column if not exists validapay_charge_id text,
  add column if not exists validapay_emv text,
  add column if not exists plano_pendente public.plano_clube;

create index if not exists ix_assin_validapay_charge
  on public.assinaturas (validapay_charge_id);
