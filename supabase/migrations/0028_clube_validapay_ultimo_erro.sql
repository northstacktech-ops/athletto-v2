-- Guarda o último erro retornado pela ValidaPay no cadastro/verificação da
-- subconta (ex.: "phoneNumber inválido"), para mostrar o motivo ao gestor.
alter table public.clube_validapay add column if not exists ultimo_erro text;
