import { defineEventHandler, readRawBody, getHeader, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { PLANOS } from '~/types'

/**
 * POST /api/webhooks/validapay
 * Recebe eventos da ValidaPay:
 *  - account_approved  → marca a subconta do clube como aprovada (+ account number)
 *  - payment.success   → marca a cobrança como paga e cria a transação de entrada
 *
 * Verificação: header x-webhook-signature com formato t=<ms>,v1=<hmac-sha256>
 * HMAC = SHA256(secret, "{timestamp}.{rawBody}")
 * Proteção anti-replay: rejeita eventos com mais de 5 minutos.
 */
function verificarAssinatura(rawBody: string, sigHeader: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
    const timestamp = parts.t
    const receivedSig = parts.v1
    if (!timestamp || !receivedSig) return false
    if (Date.now() - parseInt(timestamp) > 300_000) return false // replay > 5 min
    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
    return timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSig))
  } catch { return false }
}

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    logEvento('warn', 'webhook.validapay.modo_mock', {})
    return { received: true, mock: true }
  }

  // Verificação HMAC com x-webhook-signature (t=<ms>,v1=<sha256>).
  const segredo = process.env.VALIDAPAY_WEBHOOK_SECRET
  const rawBody = (await readRawBody(event)) ?? ''
  if (segredo) {
    const sigHeader = getHeader(event, 'x-webhook-signature') ?? ''
    if (!sigHeader || !verificarAssinatura(rawBody, sigHeader, segredo)) {
      throw createError({ statusCode: 401, statusMessage: 'invalid_signature' })
    }
  }

  const payload = JSON.parse(rawBody || '{}')
  const evento = payload?.event ?? 'desconhecido'
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // chave de idempotência: chargeId (pagamento) ou formId/onboardingId (conta)
  const chaveIdem = payload?.chargeId ?? payload?.formId ?? payload?.onboardingId ?? null

  if (chaveIdem) {
    const { data: existente } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('origem', 'validapay')
      .eq('payment_id', chaveIdem)
      .eq('evento', evento)
      .eq('status', 'processado')
      .maybeSingle()
    if (existente) return { received: true, idempotent: true }
  }

  const { data: logRow } = await supabase
    .from('webhook_logs')
    .insert({
      origem: 'validapay',
      evento,
      payment_id: chaveIdem,
      payload,
      hmac_valido: true,
      status: 'recebido',
      recebido_em: new Date().toISOString(),
    })
    .select('id')
    .single()

  try {
    // Bug 4: webhook global configurado para todos os eventos — subconta pode
    // chegar como onboarding.*, account.*, proposal.* ou nome desconhecido.
    const ehSubconta = evento.startsWith('onboarding') || evento.startsWith('account.') || evento.startsWith('proposal.')
    if (ehSubconta) {
      // Evento de status de subconta. Decidimos por status/account presentes no payload.
      // Na 1ª aprovação real, o nome exato fica registrado em webhook_logs.evento.
      const acc = payload?.account ?? payload?.subaccount ?? {}
      const formId = payload?.formId ?? payload?.proposalId ?? payload?.id ?? null
      const accountNumber = acc.account ?? acc.accountNumber ?? payload?.accountNumber ?? null
      const statusRaw = String(payload?.status ?? acc.status ?? '').toLowerCase()
      const recusado = ['rejected', 'refused', 'denied', 'recusado', 'reproved'].some((s) => statusRaw.includes(s))
      const aprovado = !recusado && (
        !!accountNumber ||
        ['approved', 'aprovado', 'active', 'completed', 'success'].some((s) => statusRaw.includes(s))
      )

      if (formId && (aprovado || recusado)) {
        await supabase
          .from('clube_validapay')
          .update({
            account_number: accountNumber,
            branch: acc.branch ?? null,
            document_number: acc.documentNumber ?? payload?.documentNumber ?? null,
            ispb: acc.ispb ?? null,
            status: recusado ? 'recusado' : 'aprovado',
            atualizado_em: new Date().toISOString(),
          })
          .eq('form_id', formId)
      }
    } else if (evento === 'payment.success' || evento === 'charge.paid') {
      // Pagamento confirmado → baixa a cobrança + cria transação de entrada.
      const chargeId = payload?.chargeId
      const valor = Number(payload?.amount ?? 0)
      const paidAt = (payload?.paidAt ?? new Date().toISOString()).slice(0, 10)

      const { data: cb } = await supabase
        .from('cobrancas')
        .select('id, clube_id, atleta_id, caixinha_id, valor, status')
        .eq('validapay_charge_id', chargeId)
        .maybeSingle()

      if (cb && cb.status !== 'pago') {
        await supabase
          .from('cobrancas')
          .update({ status: 'pago', data_pagamento: paidAt, atualizado_em: new Date().toISOString() })
          .eq('id', cb.id)

        await supabase.from('transacoes').insert({
          clube_id: cb.clube_id,
          tipo: 'entrada',
          valor: valor || cb.valor,
          descricao: 'Pagamento recebido via Pix (ValidaPay)',
          data: paidAt,
          cobranca_id: cb.id,
          caixinha_id: cb.caixinha_id,
          atleta_id: cb.atleta_id,
          origem: 'webhook',
        })

        if (cb.caixinha_id) { try { await supabase.rpc('recalcular_caixinha', { p_caixinha_id: cb.caixinha_id }) } catch { /* best-effort */ } }
      } else if (!cb) {
        // Não é cobrança de atleta → pode ser a ASSINATURA do clube (clube paga
        // o Athletto). Ativa o plano pendente preservando o trial.
        const { data: assin } = await supabase
          .from('assinaturas')
          .select('clube_id, plano_pendente, trial_fim')
          .eq('validapay_charge_id', chargeId)
          .maybeSingle()

        if (assin && (assin as any).plano_pendente) {
          const plano = (assin as any).plano_pendente as keyof typeof PLANOS
          const preco = PLANOS[plano]?.preco ?? 0
          const hoje = new Date().toISOString().slice(0, 10)
          const trialAtivo = (assin as any).trial_fim && String((assin as any).trial_fim) > hoje

          await supabase.from('clubes')
            .update({ plano, plano_ativo: true })
            .eq('id', (assin as any).clube_id)

          if (trialAtivo) {
            // Mantém os dias grátis; 1ª cobrança no fim do trial.
            await supabase.from('assinaturas').update({
              plano, valor_mensal: preco,
              ativada_em: new Date().toISOString(),
              proxima_cobranca: (assin as any).trial_fim,
              plano_pendente: null, validapay_charge_id: null, validapay_emv: null,
              atualizado_em: new Date().toISOString(),
            }).eq('clube_id', (assin as any).clube_id)
          } else {
            // Trial já acabou (ou upgrade) → ativa e cobra a partir de hoje.
            const prox = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            await supabase.from('assinaturas').update({
              status: 'ativa', plano, valor_mensal: preco,
              ativada_em: new Date().toISOString(),
              proxima_cobranca: prox, trial_fim: hoje,
              plano_pendente: null, validapay_charge_id: null, validapay_emv: null,
              atualizado_em: new Date().toISOString(),
            }).eq('clube_id', (assin as any).clube_id)
          }
        }
      }
    }

    if (logRow) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processado', processado_em: new Date().toISOString() })
        .eq('id', logRow.id)
    }
    return { received: true, processed: true }
  } catch (err: any) {
    logEvento('error', 'webhook.validapay.processar_erro', { evento, erro: erroParaLog(err) })
    if (logRow) {
      await supabase.from('webhook_logs').update({ status: 'erro', erro: String(err?.message ?? err) }).eq('id', logRow.id)
    }
    throw createError({ statusCode: 500, statusMessage: 'process_failed' })
  }
})
