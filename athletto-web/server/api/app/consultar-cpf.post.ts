import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, rateLimited } from '~~/server/utils/appAtleta'
import { lerBodyValidado } from '~~/server/utils/validacao'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { z } from 'zod'

const consultarCpfSchema = z.object({
  cpf: z
    .string({ required_error: 'CPF inválido.' })
    .transform((s) => s.replace(/\D/g, ''))
    .refine((s) => s.length === 11, 'CPF inválido.'),
})

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

  const { cpf } = await lerBodyValidado(event, consultarCpfSchema)

  const supabase = getServiceClient(event)
  const { data, error } = await supabase.rpc('app_consultar_cpf', { p_cpf: cpf })
  if (error) {
    logEvento('error', 'app.consultar_cpf.rpc_erro', { erro: erroParaLog(error) })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao consultar CPF.' })
  }
  return data
})
