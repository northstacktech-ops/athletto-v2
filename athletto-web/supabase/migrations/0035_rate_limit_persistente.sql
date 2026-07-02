-- ============================================================================
-- Athletto — 0035_rate_limit_persistente.sql
-- Rate-limit em memória (Map por processo) não funciona em serverless — cada
-- cold start na Vercel zera o contador, então na prática não protegia nada
-- em produção. Move o contador pro Postgres (já é dependência do projeto,
-- sem precisar de Redis/infra nova), com upsert atômico via INSERT..ON
-- CONFLICT (sem race condition entre requests concorrentes).
-- ============================================================================

create table if not exists public.rate_limits (
  chave          text primary key,
  contagem       int not null default 1,
  janela_inicio  timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- Intencional: NENHUMA policy → só o service_role (rotas server) acessa.
revoke all on public.rate_limits from anon, authenticated, public;

comment on table public.rate_limits is
  'Contador de rate-limit por chave (ex.: "signup:1.2.3.4"). Só service_role.';

-- ── Checagem atômica: incrementa e diz se estourou o limite ─────────────────
create or replace function public.checar_rate_limit(
  p_chave           text,
  p_max             int,
  p_janela_segundos int
)
returns boolean  -- true = bloqueado (estourou o limite)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_contagem int;
begin
  insert into public.rate_limits (chave, contagem, janela_inicio)
  values (p_chave, 1, now())
  on conflict (chave) do update
    set contagem = case
          when public.rate_limits.janela_inicio < now() - (p_janela_segundos || ' seconds')::interval
            then 1
          else public.rate_limits.contagem + 1
        end,
        janela_inicio = case
          when public.rate_limits.janela_inicio < now() - (p_janela_segundos || ' seconds')::interval
            then now()
          else public.rate_limits.janela_inicio
        end
  returning contagem into v_contagem;

  return v_contagem > p_max;
end;
$function$;

revoke execute on function public.checar_rate_limit(text, int, int) from public, anon, authenticated;

-- ── Limpeza diária (evita crescimento indefinido da tabela) ─────────────────
create or replace function public.limpar_rate_limits_antigos()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  delete from public.rate_limits where janela_inicio < now() - interval '1 day';
$function$;

revoke execute on function public.limpar_rate_limits_antigos() from public, anon, authenticated;

select cron.schedule('athletto_limpar_rate_limits', '30 3 * * *', $$select public.limpar_rate_limits_antigos()$$);
