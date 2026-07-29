import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/frequencia  (auth)
 *
 * Últimos 60 registros de frequência do atleta da sessão.
 * → { percentual, total_treinos, total_presencas, historico:[{data,presente,turma_nome}] }
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const { data, error } = await supabase
    .from('frequencias')
    .select('data, presente, turma:turmas(nome)')
    .eq('atleta_id', sessao.atleta_id)
    .order('data', { ascending: false })
    .limit(60)

  if (error) {
    console.error('[app/frequencia] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar frequência.' })
  }

  const registros = data ?? []
  const total = registros.length
  const presencas = registros.filter((r: any) => r.presente === true).length
  const percentual = total > 0 ? Math.round((presencas / total) * 100) : 0

  return {
    percentual,
    total_treinos: total,
    total_presencas: presencas,
    historico: registros.map((r: any) => ({
      data: r.data,
      presente: r.presente,
      turma_nome: r.turma?.nome ?? null,
    })),
  }
})
