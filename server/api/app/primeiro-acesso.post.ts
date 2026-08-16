import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, rateLimited } from '~~/server/utils/appAtleta'
import { lerBodyValidado } from '~~/server/utils/validacao'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { z } from 'zod'

/**
 * POST /api/app/primeiro-acesso
 * Body: { cpf, clube_id, data_nascimento (YYYY-MM-DD), senha }
 *
 * Substitui o código gerado pelo gestor no primeiro acesso: CPF + data de
 * nascimento (já cadastrados pelo gestor) provam que é o atleta. Só funciona
 * se `app_senha_hash` ainda for nulo — depois disso é `/api/app/login`, e
 * reset de senha continua exigindo código do gestor via `/api/app/definir-senha`.
 *
 * Chama a RPC app_criar_senha_primeiro_acesso. Repassa { ok } ou, em erro,
 * status 400 { erro }.
 */
const primeiroAcessoSchema = z.object({
  cpf: z
    .string({ required_error: 'CPF ausente.' })
    .transform((s) => s.replace(/\D/g, ''))
    .refine((s) => s.length === 11, 'CPF inválido.'),
  clube_id: z.string({ required_error: 'clube_id ausente.' }).trim().min(1, 'clube_id ausente.'),
  data_nascimento: z
    .string({ required_error: 'Data de nascimento ausente.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida.'),
  senha: z.string({ required_error: 'Senha ausente.' }).min(1, 'Senha ausente.'),
})

export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  if (await rateLimited(event, 'primeiro-acesso', 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde um minuto.' })
  }

  const { cpf, clube_id: clubeId, data_nascimento: dataNascimento, senha } = await lerBodyValidado(event, primeiroAcessoSchema)

  const supabase = getServiceClient(event)
  const { data, error } = await supabase.rpc('app_criar_senha_primeiro_acesso', {
    p_cpf: cpf,
    p_clube_id: clubeId,
    p_data_nascimento: dataNascimento,
    p_senha: senha,
  })
  if (error) {
    logEvento('error', 'app.primeiro_acesso.rpc_erro', { clube_id: clubeId, erro: erroParaLog(error) })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao criar senha.' })
  }

  if (!data || data.ok !== true) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Não foi possível concluir o primeiro acesso',
      data: { erro: data?.erro ?? 'erro' },
    })
  }

  return data
})
