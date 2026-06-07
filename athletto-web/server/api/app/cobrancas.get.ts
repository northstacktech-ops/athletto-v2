import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/cobrancas  (auth)
 *
 * Cobranças do atleta da sessão (join caixinha p/ nome).
 * → [{id,valor,status,data_vencimento,data_pagamento,abacatepay_link,caixinha_nome}]
 *   ordenado por data_vencimento desc.
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const { data, error } = await supabase
    .from('cobrancas')
    .select(
      'id, valor, status, data_vencimento, data_pagamento, abacatepay_link, caixinha:caixinhas(nome)',
    )
    .eq('atleta_id', sessao.atleta_id)
    .order('data_vencimento', { ascending: false })

  if (error) {
    console.error('[app/cobrancas] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar cobranças.' })
  }

  return (data ?? []).map((c: any) => ({
    id: c.id,
    valor: c.valor,
    status: c.status,
    data_vencimento: c.data_vencimento,
    data_pagamento: c.data_pagamento,
    abacatepay_link: c.abacatepay_link,
    caixinha_nome: c.caixinha?.nome ?? null,
  }))
})
