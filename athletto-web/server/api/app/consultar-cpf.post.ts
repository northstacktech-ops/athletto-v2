import { defineEventHandler, readBody, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, rateLimited } from '~~/server/utils/appAtleta'

/**
 * POST /api/app/consultar-cpf
 * Body: { cpf }
 * → { ok, clubes:[{clube_id, atleta_id, nome, logo_url, senha_definida}] } | { ok:false, erro }
 *
 * Sem auth. Rate-limit por IP (10/min). Repassa o resultado da RPC app_consultar_cpf.
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  if (rateLimited(event, 'consultar-cpf', 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde um minuto.' })
  }

  const body = await readBody<{ cpf?: string }>(event)
  const cpf = String(body?.cpf ?? '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    throw createError({ statusCode: 400, statusMessage: 'CPF inválido.' })
  }

  const supabase = getServiceClient(event)
  const { data, error } = await supabase.rpc('app_consultar_cpf', { p_cpf: cpf })
  if (error) {
    console.error('[app/consultar-cpf] erro rpc:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao consultar CPF.' })
  }
  return data
})
