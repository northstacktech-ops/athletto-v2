import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/cobrancas  (auth)
 *
 * Cobranças do atleta da sessão (join caixinha p/ nome).
 * → [{id,valor,status,data_vencimento,data_pagamento,pix_copia_cola,caixinha_nome}]
 *   ordenado por data_vencimento desc.
 *
 * NOTA (2026-07): campo mudou de `abacatepay_link` pra `pix_copia_cola`
 * (código EMV da ValidaPay) na migração do gateway de pagamento. O app
 * mobile (athletto-atleta) ainda precisa ser atualizado pra consumir o
 * campo novo — fica registrado aqui pra quando mexermos no app.
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const { data, error } = await supabase
    .from('cobrancas')
    .select(
      'id, valor, status, data_vencimento, data_pagamento, validapay_emv, caixinha:caixinhas(nome)',
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
    pix_copia_cola: c.validapay_emv,
    caixinha_nome: c.caixinha?.nome ?? null,
  }))
})
