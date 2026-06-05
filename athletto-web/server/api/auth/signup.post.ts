import { defineEventHandler, readBody, createError, getRequestIP } from 'h3'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/signup
 *
 * Cria a conta do gestor SEM confirmação de e-mail (sem SMTP configurado):
 * usa o admin API do Supabase com `email_confirm: true`.
 *
 * Body: { email, password, nome, nome_clube, modalidade, plano }
 *
 * Segurança:
 *  • SUPABASE_SERVICE_ROLE_KEY nunca chega ao client — só roda no server.
 *  • Validação de inputs (formato/tamanhos).
 *  • Rate-limit simples em memória por IP (5 req/min).
 */

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60_000
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (list.length >= RATE_LIMIT_MAX) {
    hits.set(ip, list)
    return true
  }
  list.push(now)
  hits.set(ip, list)
  // Limpeza ocasional para não crescer indefinidamente
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(k)
    }
  }
  return false
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLANOS_VALIDOS = new Set(['basico', 'intermediario', 'profissional'])

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (rateLimited(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
    })
  }

  const body = await readBody<{
    email?: string
    password?: string
    nome?: string
    nome_clube?: string
    modalidade?: string
    plano?: string
  }>(event)

  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const nome = String(body?.nome ?? '').trim()
  const nomeClube = String(body?.nome_clube ?? '').trim()
  const modalidade = String(body?.modalidade ?? '').trim()
  const plano = String(body?.plano ?? 'basico').trim()

  // ── Validações ─────────────────────────────────────────────────────────────
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail inválido.' })
  }
  if (password.length < 8 || password.length > 72) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter entre 8 e 72 caracteres.' })
  }
  if (nome.length < 3 || nome.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Informe seu nome completo (3 a 120 caracteres).' })
  }
  if (nomeClube.length < 2 || nomeClube.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Informe o nome do clube (2 a 120 caracteres).' })
  }
  if (!modalidade || modalidade.length > 60) {
    throw createError({ statusCode: 400, statusMessage: 'Modalidade inválida.' })
  }
  if (!PLANOS_VALIDOS.has(plano)) {
    throw createError({ statusCode: 400, statusMessage: 'Plano inválido.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Servidor sem credenciais Supabase configuradas.' })
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // sem SMTP — confirma o e-mail na criação
    user_metadata: {
      nome,
      nome_clube: nomeClube,
      modalidade,
      plano,
    },
  })

  if (error) {
    const msg = String(error.message ?? '')
    const duplicado =
      (error as any).code === 'email_exists'
      || msg.toLowerCase().includes('already been registered')
      || msg.toLowerCase().includes('already registered')
      || (error as any).status === 422
    if (duplicado) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.',
      })
    }
    console.error('[signup] erro ao criar usuário:', error)
    throw createError({ statusCode: 500, statusMessage: 'Não foi possível criar sua conta. Tente novamente.' })
  }

  return { ok: true, user_id: data.user?.id ?? null }
})
