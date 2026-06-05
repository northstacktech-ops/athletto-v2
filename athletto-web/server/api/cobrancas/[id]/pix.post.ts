import { defineEventHandler, getRouterParam, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { criarPixParaCobranca } from '~~/server/utils/pix'

/**
 * POST /api/cobrancas/:id/pix
 *
 * Cria (ou regenera) um Pix no AbacatePay para uma cobrança específica,
 * atualiza `abacatepay_payment_id` e `abacatepay_link` no banco.
 *
 * Requer:
 *  • SUPABASE_SERVICE_ROLE_KEY (server-only)
 *  • ABACATEPAY_API_KEY
 *
 * Em modo dev sem AbacatePay, devolve um stub determinístico.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'cobranca_id ausente' })

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiUrl = process.env.ABACATEPAY_API_URL ?? 'https://api.abacatepay.com/v1'
  const apiKey = process.env.ABACATEPAY_API_KEY

  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Server sem Supabase service role configurado' })
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  const result = await criarPixParaCobranca(supabase, id, { apiUrl, apiKey })

  if (!result.ok) {
    throw createError({ statusCode: result.status ?? 500, statusMessage: result.erro ?? 'Falha ao criar Pix' })
  }

  return result
})
