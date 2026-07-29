import { defineEventHandler, createError } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'
import { logEvento, erroParaLog } from '~~/server/utils/logger'

/**
 * GET /api/app/exportar-dados  (LGPD — direito de acesso)
 *
 * Autenticado pela sessão do atleta. Retorna um JSON com todos os dados
 * pessoais do atleta (dados cadastrais, clube, turmas, cobranças, frequências
 * e consentimentos), via RPC app_exportar_dados_atleta.
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const { data, error } = await supabase.rpc('app_exportar_dados_atleta', {
    p_atleta_id: sessao.atleta_id,
  })
  if (error) {
    logEvento('error', 'app.exportar_dados.erro', {
      atleta_id: sessao.atleta_id,
      clube_id: sessao.clube_id,
      erro: erroParaLog(error),
    })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao exportar seus dados.' })
  }

  logEvento('info', 'app.exportar_dados.ok', {
    atleta_id: sessao.atleta_id,
    clube_id: sessao.clube_id,
  })
  return data
})
