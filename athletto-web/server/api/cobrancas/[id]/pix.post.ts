import { defineEventHandler, getRouterParam, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { criarPixParaCobranca } from '~~/server/utils/pix'

/**
 * POST /api/cobrancas/:id/pix
 *
 * Cria (ou regenera) um Pix na ValidaPay (subconta do clube) para uma
 * cobrança específica, atualiza `validapay_charge_id` e `validapay_emv`.
 *
 * Requer:
 *  • SUPABASE_SERVICE_ROLE_KEY (server-only)
 *  • Subconta ValidaPay aprovada para o clube
 *
 * Sem subconta aprovada, devolve um stub determinístico (modo dev/pendente).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'cobranca_id ausente' })

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Server sem Supabase service role configurado' })
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  const result = await criarPixParaCobranca(supabase, id)

  if (!result.ok) {
    throw createError({ statusCode: result.status ?? 500, statusMessage: result.erro ?? 'Falha ao criar Pix' })
  }

  return result
})
