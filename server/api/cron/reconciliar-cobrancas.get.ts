import { defineEventHandler, getHeader, createError } from 'h3'
import { getServiceClient } from '~~/server/utils/appAtleta'
import { statusCobranca } from '~~/server/utils/validapay'
import { baixarCobrancaPaga } from '~~/server/utils/cobranca'
import { logEvento, erroParaLog } from '~~/server/utils/logger'

/**
 * GET /api/cron/reconciliar-cobrancas
 *
 * Rede de segurança contra webhook da ValidaPay perdido/atrasado: cobranças
 * `pendente` com um `validapay_charge_id` já gerado há mais de
 * JANELA_HORAS voltam a ser consultadas direto na ValidaPay
 * (`statusCobranca`, já existente) — se ela já mostra paga, aplica a mesma
 * baixa que o webhook aplicaria (`baixarCobrancaPaga`, compartilhada).
 *
 * ⚠️ Os nomes exatos dos campos de status na resposta de GET /v1/charges/:id
 * não constam na doc pública (mesma ressalva já registrada em
 * server/utils/validapay.ts pra criação de cobrança) — parsing defensivo,
 * conferir no 1º teste sandbox.
 *
 * SEGURANÇA: mesmo padrão dos demais crons.
 */
const JANELA_HORAS = 2

function estaPago(resp: any): boolean {
  const status = String(resp?.status ?? resp?.charge?.status ?? resp?.data?.status ?? '').toLowerCase()
  return ['paid', 'pago', 'completed', 'success', 'confirmed'].some((s) => status.includes(s))
}

export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = getHeader(event, 'authorization') || ''
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Não autorizado.' })
    }
  }

  const supabase = getServiceClient(event)
  const limite = new Date(Date.now() - JANELA_HORAS * 60 * 60 * 1000).toISOString()

  const { data: presas, error } = await supabase
    .from('cobrancas')
    .select('id, validapay_charge_id')
    .eq('status', 'pendente')
    .not('validapay_charge_id', 'is', null)
    .lt('gerado_em', limite)
    .limit(200)

  if (error) {
    logEvento('error', 'cron.reconciliar.busca_erro', { erro: erroParaLog(error) })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar cobranças presas.' })
  }

  const linhas = presas ?? []
  let reconciliadas = 0
  const erros: { cobranca_id: string; erro: string }[] = []

  for (const cb of linhas) {
    try {
      const resp = await statusCobranca(cb.validapay_charge_id as string)
      if (estaPago(resp)) {
        await baixarCobrancaPaga(supabase, cb.id, { origem: 'reconciliacao' })
        reconciliadas++
      }
    } catch (err: any) {
      erros.push({ cobranca_id: cb.id, erro: String(err?.message ?? err) })
    }
  }

  if (erros.length > 0) {
    logEvento('warn', 'cron.reconciliar.erros_parciais', { total: erros.length })
  }

  return { ok: true, verificadas: linhas.length, reconciliadas, erros }
})
