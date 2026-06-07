import { defineEventHandler, getHeader, createError } from 'h3'
import { getServiceClient } from '~~/server/utils/appAtleta'

/**
 * GET /api/cron/processar-notificacoes
 *
 * Cron diário (Vercel) que gera os lembretes de pagamento chamando a RPC
 * `app_gerar_lembretes_pagamento`. Agendado em vercel.json para 0 12 * * *
 * (UTC) = 09:00 BRT.
 *
 * SEGURANÇA: quando a env CRON_SECRET estiver definida, exige o header
 * `Authorization: Bearer <CRON_SECRET>` (o Vercel Cron envia esse header
 * automaticamente). Sem a env, roda sem checagem (útil em dev).
 *
 * → { ok: true, lembretes: data }
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = getHeader(event, 'authorization') || ''
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Não autorizado.' })
    }
  }

  const supabase = getServiceClient(event)

  const { data, error } = await supabase.rpc('app_gerar_lembretes_pagamento')
  if (error) {
    console.error('[cron/processar-notificacoes] erro rpc:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao gerar lembretes.' })
  }

  return { ok: true, lembretes: data }
})
