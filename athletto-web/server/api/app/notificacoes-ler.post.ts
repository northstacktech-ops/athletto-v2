import { defineEventHandler, readBody, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * POST /api/app/notificacoes-ler  (auth)
 * Body: { id?: string, todas?: boolean }
 *
 * Marca notificações como lidas (lida=true, lida_em=now()), sempre escopado
 * ao atleta da sessão. Se `todas` = true, marca todas as não lidas; senão,
 * marca apenas a de `id`.
 * → { ok: true }
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const body = await readBody<{ id?: string; todas?: boolean }>(event)
  const todas = body?.todas === true
  const id = body?.id ? String(body.id).trim() : ''

  if (!todas && !id) {
    throw createError({ statusCode: 400, statusMessage: 'Informe `id` ou `todas`.' })
  }

  const patch = { lida: true, lida_em: new Date().toISOString() }

  let query = supabase
    .from('app_notificacoes')
    .update(patch)
    .eq('atleta_id', sessao.atleta_id)

  if (todas) {
    query = query.eq('lida', false)
  } else {
    query = query.eq('id', id)
  }

  const { error } = await query
  if (error) {
    console.error('[app/notificacoes-ler] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao marcar como lida.' })
  }

  return { ok: true }
})
