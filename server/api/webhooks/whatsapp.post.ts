import { defineEventHandler, readRawBody, getHeader, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { logEvento, erroParaLog } from '~~/server/utils/logger'

/**
 * POST /api/webhooks/whatsapp
 * Recebe eventos de status de mensagem (sent/delivered/read/failed) da Meta
 * Cloud API e atualiza `mensagens_whatsapp`.
 *
 * Verificação: header X-Hub-Signature-256 = "sha256=<hmac>", HMAC-SHA256 do
 * raw body com WHATSAPP_APP_SECRET.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#validating-payloads
 */
function verificarAssinatura(rawBody: string, sigHeader: string, secret: string): boolean {
  try {
    const recebido = sigHeader.replace(/^sha256=/, '')
    const esperado = createHmac('sha256', secret).update(rawBody).digest('hex')
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido))
  } catch {
    return false
  }
}

// Evita que um status atrasado (ex.: "sent" chegando depois de "read") regrida
// o registro — só aceita atualização se for um avanço na régua de status.
const RANK: Record<string, number> = { enviada: 1, entregue: 2, lida: 3, falhou: 4 }

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    logEvento('warn', 'webhook.whatsapp.modo_mock', {})
    return { received: true, mock: true }
  }

  const segredo = process.env.WHATSAPP_APP_SECRET
  const rawBody = (await readRawBody(event)) ?? ''
  if (segredo) {
    const sigHeader = getHeader(event, 'x-hub-signature-256') ?? ''
    if (!sigHeader || !verificarAssinatura(rawBody, sigHeader, segredo)) {
      throw createError({ statusCode: 401, statusMessage: 'invalid_signature' })
    }
  }

  const payload = JSON.parse(rawBody || '{}')
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  const statusMap: Record<string, string> = {
    sent: 'enviada',
    delivered: 'entregue',
    read: 'lida',
    failed: 'falhou',
  }

  try {
    const entries = payload?.entry ?? []
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const statuses = change?.value?.statuses ?? []
        for (const s of statuses) {
          const messageId = s?.id
          const statusNovo = statusMap[s?.status]
          if (!messageId || !statusNovo) continue

          const { data: atual } = await supabase
            .from('mensagens_whatsapp')
            .select('id, status')
            .eq('whatsapp_message_id', messageId)
            .maybeSingle()

          if (!atual) continue // mensagem não rastreada por essa régua (ou de outro fluxo)
          if ((RANK[(atual as any).status] ?? 0) >= (RANK[statusNovo] ?? 0)) continue

          await supabase
            .from('mensagens_whatsapp')
            .update({
              status: statusNovo,
              erro: s?.errors?.[0]?.title ?? null,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', (atual as any).id)
        }
      }
    }
    return { received: true, processed: true }
  } catch (err: any) {
    logEvento('error', 'webhook.whatsapp.processar_erro', { erro: erroParaLog(err) })
    throw createError({ statusCode: 500, statusMessage: 'process_failed' })
  }
})
