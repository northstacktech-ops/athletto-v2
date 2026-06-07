import { defineEventHandler, createError, getMethod, getHeader } from 'h3'
import { getServiceClient, aplicarCorsApp, hashToken } from '~~/server/utils/appAtleta'

/**
 * POST /api/app/logout  (auth)
 * Marca a sessão atual como revogada. → { ok: true }
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const auth = getHeader(event, 'authorization') || getHeader(event, 'Authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
  const token = m?.[1]?.trim()
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Token ausente.' })
  }

  const supabase = getServiceClient(event)
  const { error } = await supabase
    .from('app_atleta_sessoes')
    .update({ revogado: true })
    .eq('token_hash', hashToken(token))

  if (error) {
    console.error('[app/logout] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao encerrar sessão.' })
  }

  return { ok: true }
})
