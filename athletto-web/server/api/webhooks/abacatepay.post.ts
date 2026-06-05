import { defineEventHandler, readRawBody, getHeader, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { verificarHmacAbacatePay } from '~/server/utils/abacatepay'
import type { AbacateWebhookPayload } from '~/types/abacatepay'

/**
 * POST /api/webhooks/abacatepay
 *
 * Endpoint público que AbacatePay chama quando um evento Pix muda de estado.
 *
 * Responsabilidades:
 *  1. Capturar o body cru (para validar HMAC).
 *  2. Validar HMAC com `ABACATEPAY_WEBHOOK_SECRET`.
 *  3. Registrar TUDO em `webhook_logs` (idempotência por `payment_id`).
 *  4. Encontrar a cobrança correspondente (por `metadata.cobranca_id` OU
 *     por `abacatepay_payment_id`) e atualizar status.
 *  5. Criar `Transacao` automaticamente quando `event = pix.paid`.
 *  6. Para webhooks da própria assinatura Athletto (mensalidade),
 *     atualizar `assinaturas.status` + criar `MovimentacaoFinanceiraSistema`.
 *
 * Idempotência:
 *  - Se já existe webhook_log com mesmo `payment_id` + status `processado`,
 *    devolve 200 sem reprocessar.
 *
 * Esta rota só fica viva quando `SUPABASE_SERVICE_ROLE_KEY` está setada —
 * caso contrário responde 503 (sistema em modo mock).
 */
export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET
  const ambiente = process.env.ABACATEPAY_ENV ?? 'sandbox'

  if (!supabaseUrl || !serviceRole) {
    // Modo mock — log mas não persiste
    console.warn('[webhook abacatepay] Supabase service role ausente — modo mock')
    return { received: true, mock: true }
  }

  const signature = getHeader(event, 'x-abacatepay-signature')
  const hmacValido = verificarHmacAbacatePay(rawBody, signature, webhookSecret)

  let payload: AbacateWebhookPayload | null = null
  try {
    payload = JSON.parse(rawBody) as AbacateWebhookPayload
  } catch (err) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  })

  const paymentId = payload.data?.id ?? null
  const evento = payload.event
  const cobrancaId = payload.metadata?.cobranca_id ?? null

  // ── 1. Idempotência: já processamos este payment_id + status? ────────────
  if (paymentId) {
    const { data: existente } = await supabase
      .from('webhook_logs')
      .select('id, status')
      .eq('origem', 'abacatepay')
      .eq('payment_id', paymentId)
      .eq('evento', evento)
      .eq('status', 'processado')
      .maybeSingle()

    if (existente) {
      return { received: true, idempotent: true, id: existente.id }
    }
  }

  // ── 2. Persistir log ─────────────────────────────────────────────────────
  const { data: logRow, error: logErr } = await supabase
    .from('webhook_logs')
    .insert({
      origem: 'abacatepay',
      evento,
      payment_id: paymentId,
      cobranca_id: cobrancaId,
      payload: payload as unknown as Record<string, unknown>,
      hmac_valido: hmacValido,
      status: 'recebido',
      recebido_em: new Date().toISOString(),
    })
    .select()
    .single()

  if (logErr) {
    console.error('[webhook abacatepay] falha ao registrar log:', logErr)
    throw createError({ statusCode: 500, statusMessage: 'log_failed' })
  }

  // ── 3. Bloquear HMAC inválido em production ──────────────────────────────
  if (!hmacValido && ambiente === 'production') {
    await supabase
      .from('webhook_logs')
      .update({
        status: 'erro',
        erro: 'Assinatura HMAC inválida (production)',
      })
      .eq('id', logRow.id)
    throw createError({ statusCode: 401, statusMessage: 'invalid_signature' })
  }

  // ── 4. Processar conforme evento ────────────────────────────────────────
  try {
    if (evento === 'pix.paid') {
      await processarPagamento(supabase, payload, cobrancaId)
    } else if (evento === 'pix.expired' || evento === 'pix.cancelled') {
      await processarCancelamento(supabase, payload, cobrancaId)
    }

    await supabase
      .from('webhook_logs')
      .update({ status: 'processado', processado_em: new Date().toISOString() })
      .eq('id', logRow.id)

    return { received: true, processed: true }
  } catch (err: any) {
    console.error('[webhook abacatepay] falha ao processar:', err)
    await supabase
      .from('webhook_logs')
      .update({ status: 'erro', erro: String(err?.message ?? err) })
      .eq('id', logRow.id)
    throw createError({ statusCode: 500, statusMessage: 'process_failed' })
  }
})

// ─── Handlers de evento ──────────────────────────────────────────────────────

async function processarPagamento(
  supabase: ReturnType<typeof createClient>,
  payload: AbacateWebhookPayload,
  cobrancaId: string | null,
) {
  const paymentId = payload.data.id
  const paidAt = payload.data.paid_at ?? new Date().toISOString()
  const amountBrl = payload.data.amount / 100

  // 1) Tentar identificar a cobrança do clube
  let cobranca = null as { id: string; clube_id: string; atleta_id: string; caixinha_id: string; valor: number } | null

  if (cobrancaId) {
    const { data } = await supabase
      .from('cobrancas')
      .select('id, clube_id, atleta_id, caixinha_id, valor')
      .eq('id', cobrancaId)
      .maybeSingle()
    cobranca = data as typeof cobranca
  }
  if (!cobranca) {
    const { data } = await supabase
      .from('cobrancas')
      .select('id, clube_id, atleta_id, caixinha_id, valor')
      .eq('abacatepay_payment_id', paymentId)
      .maybeSingle()
    cobranca = data as typeof cobranca
  }

  if (cobranca) {
    // Atualiza cobrança + cria transação
    await supabase
      .from('cobrancas')
      .update({
        status: 'pago',
        data_pagamento: paidAt.slice(0, 10),
        abacatepay_payment_id: paymentId,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cobranca.id)

    await supabase.from('transacoes').insert({
      clube_id: cobranca.clube_id,
      tipo: 'entrada',
      valor: amountBrl,
      descricao: 'Pagamento recebido via Pix',
      data: paidAt.slice(0, 10),
      cobranca_id: cobranca.id,
      caixinha_id: cobranca.caixinha_id,
      atleta_id: cobranca.atleta_id,
      origem: 'webhook',
    })
    return
  }

  // 2) Não bateu com cobrança? Pode ser mensalidade da própria Athletto
  const assinaturaId = payload.metadata?.assinatura_id
  if (assinaturaId) {
    await supabase
      .from('assinaturas')
      .update({
        status: 'ativa',
        ativada_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', assinaturaId)

    await supabase.from('movimentacoes_sistema').insert({
      assinatura_id: assinaturaId,
      tipo: 'mensalidade_recebida',
      valor: amountBrl,
      descricao: 'Mensalidade Athletto via Pix',
      data: paidAt.slice(0, 10),
      payment_id: paymentId,
    })
  }
}

async function processarCancelamento(
  supabase: ReturnType<typeof createClient>,
  payload: AbacateWebhookPayload,
  cobrancaId: string | null,
) {
  const paymentId = payload.data.id
  const id =
    cobrancaId ??
    (
      await supabase
        .from('cobrancas')
        .select('id')
        .eq('abacatepay_payment_id', paymentId)
        .maybeSingle()
    ).data?.id

  if (!id) return

  await supabase
    .from('cobrancas')
    .update({ status: 'cancelado', atualizado_em: new Date().toISOString() })
    .eq('id', id)
}
