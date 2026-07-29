import { defineEventHandler, createError } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'
import { lerBodyValidado } from '~~/server/utils/validacao'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { z } from 'zod'

/**
 * POST /api/app/excluir-conta  (LGPD — direito ao esquecimento)
 *
 * Autenticado pela sessão do atleta. Exige confirmação explícita no corpo
 * (`confirmacao: "EXCLUIR"`) — a dupla confirmação de UI vive no app, mas o
 * servidor também trava aqui para evitar exclusão acidental.
 *
 * Chama app_anonimizar_atleta: zera a PII (inclui dados de saúde), desativa o
 * atleta e revoga todas as sessões. Operação IRREVERSÍVEL.
 */
const schema = z.object({
  confirmacao: z.literal('EXCLUIR', {
    errorMap: () => ({ message: 'confirmação ausente ou incorreta' }),
  }),
})

export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  const sessao = await validarSessao(event)
  await lerBodyValidado(event, schema)

  const supabase = getServiceClient(event)

  const { error } = await supabase.rpc('app_anonimizar_atleta', {
    p_atleta_id: sessao.atleta_id,
  })
  if (error) {
    logEvento('error', 'app.excluir_conta.erro', {
      atleta_id: sessao.atleta_id,
      clube_id: sessao.clube_id,
      erro: erroParaLog(error),
    })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao excluir a conta.' })
  }

  logEvento('warn', 'app.excluir_conta.ok', {
    atleta_id: sessao.atleta_id,
    clube_id: sessao.clube_id,
  })
  return { ok: true }
})
