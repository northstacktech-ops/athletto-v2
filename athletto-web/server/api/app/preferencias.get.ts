import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/preferencias  (auth)
 *
 * Preferências de notificação do atleta da sessão (tabela app_atleta_prefs).
 * Se ainda não houver linha, retorna ambos `true` (padrão).
 * → { notif_avisos, notif_pagamento }
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const { data, error } = await supabase
    .from('app_atleta_prefs')
    .select('notif_avisos, notif_pagamento')
    .eq('atleta_id', sessao.atleta_id)
    .maybeSingle()

  if (error) {
    console.error('[app/preferencias] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar preferências.' })
  }

  return {
    notif_avisos: data?.notif_avisos ?? true,
    notif_pagamento: data?.notif_pagamento ?? true,
  }
})
