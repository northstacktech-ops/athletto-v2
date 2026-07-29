import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, rateLimited } from '~~/server/utils/appAtleta'
import { lerBodyValidado } from '~~/server/utils/validacao'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { z } from 'zod'

/**
 * POST /api/app/definir-senha
 * Body: { cpf, clube_id, codigo, senha }
 *
 * Chama a RPC app_definir_senha. Repassa { ok } ou, em erro, status 400 { erro }.
 */
const definirSenhaSchema = z.object({
  cpf: z
    .string({ required_error: 'CPF ausente.' })
    .transform((s) => s.replace(/\D/g, ''))
    .refine((s) => s.length === 11, 'CPF inválido.'),
  clube_id: z.string({ required_error: 'clube_id ausente.' }).trim().min(1, 'clube_id ausente.'),
  codigo: z.string({ required_error: 'Código ausente.' }).trim().min(1, 'Código ausente.'),
  senha: z.string({ required_error: 'Senha ausente.' }).min(1, 'Senha ausente.'),
})

export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  if (await rateLimited(event, 'definir-senha', 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde um minuto.' })
  }

  const { cpf, clube_id: clubeId, codigo, senha } = await lerBodyValidado(event, definirSenhaSchema)

  const supabase = getServiceClient(event)
  const { data, error } = await supabase.rpc('app_definir_senha', {
    p_cpf: cpf,
    p_clube_id: clubeId,
    p_codigo: codigo,
    p_senha: senha,
  })
  if (error) {
    logEvento('error', 'app.definir_senha.rpc_erro', { clube_id: clubeId, erro: erroParaLog(error) })
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
