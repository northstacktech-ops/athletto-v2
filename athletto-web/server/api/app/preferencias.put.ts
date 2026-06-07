import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'
import { lerBodyValidado } from '~~/server/utils/validacao'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { z } from 'zod'

const prefsSchema = z.object({
  notif_avisos: z.boolean().optional(),
  notif_pagamento: z.boolean().optional(),
})

/**
 * PUT /api/app/preferencias  (auth)
 * Body: { notif_avisos?: boolean, notif_pagamento?: boolean }
 *
 * Faz upsert em app_atleta_prefs (PK atleta_id), atualizando atualizado_em.
 * → { notif_avisos, notif_pagamento } (estado final)
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const body = await lerBodyValidado(event, prefsSchema)

  // Lê o estado atual para preservar campos não enviados (default true).
  const { data: atual } = await supabase
    .from('app_atleta_prefs')
    .select('notif_avisos, notif_pagamento')
    .eq('atleta_id', sessao.atleta_id)
    .maybeSingle()

  const notifAvisos =
    typeof body?.notif_avisos === 'boolean'
      ? body.notif_avisos
      : (atual?.notif_avisos ?? true)
  const notifPagamento =
    typeof body?.notif_pagamento === 'boolean'
      ? body.notif_pagamento
      : (atual?.notif_pagamento ?? true)

  const { data, error } = await supabase
    .from('app_atleta_prefs')
    .upsert(
      {
        atleta_id: sessao.atleta_id,
        notif_avisos: notifAvisos,
        notif_pagamento: notifPagamento,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'atleta_id' },
    )
    .select('notif_avisos, notif_pagamento')
    .single()

  if (error) {
    logEvento('error', 'app.preferencias.upsert_erro', { atleta_id: sessao.atleta_id, erro: erroParaLog(error) })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao salvar preferências.' })
  }

  return {
    notif_avisos: data?.notif_avisos ?? notifAvisos,
    notif_pagamento: data?.notif_pagamento ?? notifPagamento,
  }
})
