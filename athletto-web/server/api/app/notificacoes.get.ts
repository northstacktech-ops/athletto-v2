import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/notificacoes  (auth)
 *
 * Notificações internas do atleta da sessão (tabela app_notificacoes),
 * ordenadas por criada_em desc (limite 100).
 * → [{id,tipo,titulo,mensagem,detalhe,acao_label,acao_destino,lida,criada_em}]
 *   onde tipo ∈ ('financeiro','vencido','evento','clube','senha').
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const { data, error } = await supabase
    .from('app_notificacoes')
    .select(
      'id, tipo, titulo, mensagem, detalhe, acao_label, acao_destino, lida, criada_em',
    )
    .eq('atleta_id', sessao.atleta_id)
    .order('criada_em', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[app/notificacoes] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar notificações.' })
  }

  return (data ?? []).map((n: any) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensagem: n.mensagem,
    detalhe: n.detalhe,
    acao_label: n.acao_label,
    acao_destino: n.acao_destino,
    lida: n.lida,
    criada_em: n.criada_em,
  }))
})
