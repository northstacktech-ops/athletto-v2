import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

/**
 * POST /api/gestores/remover
 * Só o gestor PRINCIPAL pode remover (desvincular) um gestor adicional do
 * próprio clube. Desativa (ativo=false) — preserva histórico/logs.
 * Body: { gestor_id }
 */
export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Servidor sem credenciais Supabase.' })
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // Autentica por Bearer token (header) OU pela sessão em cookie (@nuxtjs/supabase)
  // como fallback — ver nota em convidar.post.ts.
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

  const { data: caller } = await admin
    .from('gestores')
    .select('id, clube_id, role, nome, ativo')
    .eq('id', callerId)
    .maybeSingle()
  if (!caller || !caller.ativo || caller.role !== 'principal') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas o gestor principal pode remover.' })
  }

  const body = await readBody<{ gestor_id?: string }>(event)
  const alvoId = String(body?.gestor_id ?? '')
  if (!alvoId) throw createError({ statusCode: 400, statusMessage: 'gestor_id ausente' })
  if (alvoId === callerId) throw createError({ statusCode: 400, statusMessage: 'Você não pode remover a si mesmo.' })

  const { data: alvo } = await admin
    .from('gestores')
    .select('id, clube_id, role, nome')
    .eq('id', alvoId)
    .maybeSingle()
  if (!alvo || alvo.clube_id !== caller.clube_id) {
    throw createError({ statusCode: 404, statusMessage: 'Gestor não encontrado neste clube.' })
  }
  if (alvo.role === 'principal') {
    throw createError({ statusCode: 400, statusMessage: 'O gestor principal não pode ser removido.' })
  }

  const { error } = await admin.from('gestores').update({ ativo: false }).eq('id', alvoId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await admin.from('logs_gestao').insert({
    clube_id: caller.clube_id,
    gestor_id: callerId,
    gestor_nome: caller.nome,
    acao: 'removeu_gestor',
    entidade: 'gestor',
    entidade_id: alvoId,
    dados: { nome: alvo.nome },
  })

  return { ok: true }
})
