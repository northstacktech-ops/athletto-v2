import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

/**
 * POST /api/gestores/convidar
 * Só o gestor PRINCIPAL pode convidar. Cria o auth.user SEM senha
 * (email_confirm: true, sem SMTP) + linha em `gestores` (role adicional,
 * permissoes, precisa_definir_senha). O convidado entra por /primeiro-acesso.
 * Body: { email, nome, permissoes }
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Servidor sem credenciais Supabase.' })
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // Autentica o caller por Bearer token (header) OU, como fallback, pela sessão
  // em cookie do @nuxtjs/supabase. O Bearer pode faltar/expirar quando o
  // getSession() do cliente não tem token fresco; o cookie é mantido atualizado
  // pelo módulo, então cobre esse caso.
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const { data: userData } = await admin.auth.getUser(token)
    callerId = userData.user?.id ?? null
  }
  if (!callerId) {
    const cookieUser = await serverSupabaseUser(event).catch(() => null)
    callerId = cookieUser?.id ?? null
  }
  if (!callerId) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  // Caller precisa ser o gestor principal de um clube.
  const { data: caller } = await admin
    .from('gestores')
    .select('id, clube_id, role, nome, ativo')
    .eq('id', callerId)
    .maybeSingle()
  if (!caller || !caller.ativo) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
  if (caller.role !== 'principal') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas o gestor principal pode convidar.' })
  }

  const body = await readBody<{ email?: string; nome?: string; permissoes?: Record<string, string> }>(event)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const nome = String(body?.nome ?? '').trim()
  const permissoes = body?.permissoes ?? {}
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail inválido.' })
  }
  if (nome.length < 3 || nome.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Informe o nome do gestor (3 a 120 caracteres).' })
  }

  // Limite de 3 gestores ativos por clube (também há trigger no banco).
  const { count } = await admin
    .from('gestores')
    .select('id', { count: 'exact', head: true })
    .eq('clube_id', caller.clube_id)
    .eq('ativo', true)
  if ((count ?? 0) >= 3) {
    throw createError({ statusCode: 409, statusMessage: 'Limite de 3 gestores ativos atingido.' })
  }

  // Cria o usuário sem senha (define depois no primeiro acesso).
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nome, convidado: true },
  })
  if (cErr || !created.user) {
    const msg = String(cErr?.message ?? '').toLowerCase()
    if (msg.includes('already') || (cErr as any)?.code === 'email_exists') {
      throw createError({ statusCode: 409, statusMessage: 'Este e-mail já tem conta no sistema.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Não foi possível criar o convite.' })
  }

  const { error: gErr } = await admin.from('gestores').insert({
    id: created.user.id,
    clube_id: caller.clube_id,
    nome,
    email,
    role: 'adicional',
    permissoes,
    ativo: true,
    email_verificado: true,
    precisa_definir_senha: true,
    convidado_por: callerId,
    convidado_em: new Date().toISOString(),
  })
  if (gErr) {
    // rollback do auth user pra não deixar órfão
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {})
    throw createError({ statusCode: 500, statusMessage: gErr.message })
  }

  await admin.from('logs_gestao').insert({
    clube_id: caller.clube_id,
    gestor_id: callerId,
    gestor_nome: caller.nome,
    acao: 'convidou_gestor',
    entidade: 'gestor',
    entidade_id: created.user.id,
    dados: { email, nome, permissoes },
  })

  return { ok: true, gestor_id: created.user.id }
})
