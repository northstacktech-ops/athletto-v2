import crypto from 'node:crypto'
import { createError, getHeader, setHeader, getRequestIP } from 'h3'
import type { H3Event } from 'h3'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Utilitários do app mobile do atleta (/api/app/*).
 *
 * Modelo de auth: o atleta NÃO é usuário do Supabase Auth. Os endpoints usam
 * o service_role (server-only) e validam um token de sessão opaco cujo hash é
 * guardado em `app_atleta_sessoes`. As RPCs de login/senha são SECURITY DEFINER
 * e só executáveis pelo service_role.
 *
 * SEGURANÇA: o SUPABASE_SERVICE_ROLE_KEY nunca chega ao client — só roda aqui.
 */

/** Cria um Supabase client com service_role (ignora RLS). Server-only. */
export function getServiceClient(_event?: H3Event): SupabaseClient {
  const cfg = (() => {
    try {
      return useRuntimeConfig()
    } catch {
      return undefined as any
    }
  })()

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    cfg?.public?.supabaseUrl ||
    cfg?.public?.supabase?.url

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || cfg?.supabaseServiceRoleKey

  if (!supabaseUrl || !serviceRole) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Servidor sem credenciais Supabase configuradas.',
    })
  }

  return createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Gera um token opaco de sessão (32 bytes em hex). */
export function gerarToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** SHA-256 hex de um token (o que é persistido no banco). */
export function hashToken(t: string): string {
  return crypto.createHash('sha256').update(t).digest('hex')
}

export interface SessaoAtleta {
  atleta_id: string
  clube_id: string
}

/**
 * Valida a sessão do atleta a partir do header `Authorization: Bearer <token>`.
 *
 * Confere:
 *  • sessão existe, não revogada e não expirada;
 *  • atleta ainda ativo;
 *  • clube ainda com plano ativo.
 *
 * Retorna { atleta_id, clube_id } ou lança 401.
 */
export async function validarSessao(event: H3Event): Promise<SessaoAtleta> {
  const auth = getHeader(event, 'authorization') || getHeader(event, 'Authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
  const token = m?.[1]?.trim()
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Token ausente.' })
  }

  const supabase = getServiceClient(event)
  const tokenHash = hashToken(token)
  const nowIso = new Date().toISOString()

  const { data: sessao, error } = await supabase
    .from('app_atleta_sessoes')
    .select('id, atleta_id, clube_id, revogado, expira_em')
    .eq('token_hash', tokenHash)
    .eq('revogado', false)
    .gt('expira_em', nowIso)
    .maybeSingle()

  if (error) {
    console.error('[app] validarSessao erro:', error)
    throw createError({ statusCode: 401, statusMessage: 'Sessão inválida.' })
  }
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão inválida ou expirada.' })
  }

  // Confere atleta ativo
  const { data: atleta } = await supabase
    .from('atletas')
    .select('id, ativo, clube_id')
    .eq('id', sessao.atleta_id)
    .maybeSingle()

  if (!atleta || atleta.ativo !== true) {
    throw createError({ statusCode: 401, statusMessage: 'Atleta inativo.' })
  }

  // Confere clube com plano ativo
  const { data: clube } = await supabase
    .from('clubes')
    .select('id, plano_ativo')
    .eq('id', sessao.clube_id)
    .maybeSingle()

  if (!clube || clube.plano_ativo !== true) {
    throw createError({ statusCode: 401, statusMessage: 'Clube inativo.' })
  }

  return { atleta_id: sessao.atleta_id, clube_id: sessao.clube_id }
}

/** Aplica os headers de CORS usados pelos endpoints do app mobile. */
export function aplicarCorsApp(event: H3Event): void {
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Authorization, Content-Type')
  setHeader(event, 'Access-Control-Max-Age', '86400')
}

// ── Rate-limit persistente por IP (Postgres — sobrevive a cold start) ────────
/**
 * Retorna true se o IP estourou o limite. `key` permite separar buckets por
 * endpoint (ex.: 'consultar-cpf', 'login', 'signup').
 *
 * NOTA (2026-07): antes era um `Map` em memória do processo — em serverless
 * (Vercel) cada cold start zerava o contador, então na prática não segurava
 * ninguém. Agora usa a RPC `checar_rate_limit` (Postgres, upsert atômico via
 * INSERT..ON CONFLICT), que persiste entre invocações.
 */
export async function rateLimited(
  event: H3Event,
  key: string,
  max = 10,
  windowMs = 60_000,
): Promise<boolean> {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const supabase = getServiceClient(event)
  const { data, error } = await supabase.rpc('checar_rate_limit', {
    p_chave: `${key}:${ip}`,
    p_max: max,
    p_janela_segundos: Math.round(windowMs / 1000),
  })
  if (error) {
    // Fail-open: se o banco falhar ao checar o limite, não travamos o
    // usuário legítimo — logamos pra investigar. Um rate-limit indisponível
    // não deve derrubar login/cadastro.
    console.error('[rateLimit] falha ao checar limite:', error)
    return false
  }
  return Boolean(data)
}
