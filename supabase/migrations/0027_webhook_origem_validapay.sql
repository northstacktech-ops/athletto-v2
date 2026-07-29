-- Adiciona 'validapay' ao enum webhook_origem.
-- Foi aplicado manualmente ao banco em 2026-06-17; este arquivo restaura o rastreamento no repositório.
ALTER TYPE public.webhook_origem ADD VALUE IF NOT EXISTS 'validapay';
