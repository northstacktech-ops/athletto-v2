import { defineEventHandler, readBody, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, rateLimited } from '~~/server/utils/appAtleta'

/**
 * POST /api/app/definir-senha
 * Body: { cpf, clube_id, codigo, senha }
 *
 * Chama a RPC app_definir_senha. Repassa { ok } ou, em erro, status 400 { erro }.
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  if (rateLimited(event, 'definir-senha', 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde um minuto.' })
  }

  const body = await readBody<{
    cpf?: string
    clube_id?: string
    codigo?: string
    senha?: string
  }>(event)

  const cpf = String(body?.cpf ?? '').replace(/\D/g, '')
  const clubeId = String(body?.clube_id ?? '').trim()
  const codigo = String(body?.codigo ?? '').trim()
  const senha = String(body?.senha ?? '')

  if (cpf.length !== 11) {
    throw createError({ statusCode: 400, statusMessage: 'CPF inválido.' })
  }
  if (!clubeId) {
    throw createError({ statusCode: 400, statusMessage: 'clube_id ausente.' })
  }
  if (!codigo) {
    throw createError({ statusCode: 400, statusMessage: 'Código ausente.' })
  }
  if (!senha) {
    throw createError({ statusCode: 400, statusMessage: 'Senha ausente.' })
  }

  const supabase = getServiceClient(event)
  const { data, error } = await supabase.rpc('app_definir_senha', {
    p_cpf: cpf,
    p_clube_id: clubeId,
    p_codigo: codigo,
    p_senha: senha,
  })
  if (error) {
    console.error('[app/definir-senha] erro rpc:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao definir senha.' })
  }

  if (!data || data.ok !== true) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Não foi possível definir a senha',
      data: { erro: data?.erro ?? 'erro' },
    })
  }

  return data
})
