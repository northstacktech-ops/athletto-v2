import { defineEventHandler, getMethod } from 'h3'
import { aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/avisos  (auth)
 *
 * Avisos do atleta. Atualmente NÃO existe uma tabela de avisos destinada ao
 * atleta — `notificacoes` tem audience 'gestor'|'superadmin', que não se aplica
 * ao atleta. Para não vazar conteúdo do gestor nem inventar tabela, este
 * endpoint retorna uma lista vazia, pronto para uma futura tabela de avisos.
 *
 * → { avisos: [] }
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  // Valida sessão (garante que o consumo é autenticado e prepara o terreno).
  await validarSessao(event)

  // TODO: quando existir uma tabela de avisos do atleta (ex.: app_avisos com
  // audience='atleta'), buscar aqui where clube_id = sessao.clube_id.
  return { avisos: [] as Array<{ id: string; titulo: string; descricao: string | null; criada_em: string }> }
})
