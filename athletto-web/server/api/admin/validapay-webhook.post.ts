import { defineEventHandler, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { registrarWebhook, listarWebhooks, validapayConfigurada } from '~~/server/utils/validapay'

/**
 * POST /api/admin/validapay-webhook
 * Registra (ou re-registra) o webhook da ValidaPay apontando para este servidor.
 * Protegido: apenas superadmins.
 *
 * Requer env:
 *   VALIDAPAY_WEBHOOK_URL  → URL pública completa do endpoint (ex: https://app.athletto.com.br/api/webhooks/validapay)
 *   VALIDAPAY_WEBHOOK_SECRET → segredo adicionado como query param ?s=<secret> (opcional)
 */
export default defineEventHandler(async (event) => {
  if (!validapayConfigurada()) {
    throw createError({ statusCode: 503, statusMessage: 'ValidaPay não configurada.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) throw createError({ statusCode: 503, statusMessage: 'Servidor sem Supabase.' })
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // Apenas superadmins.
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Não autenticado.' })

  const { data: user } = await admin.auth.getUser(token)
  if (!user?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Token inválido.' })
  const { data: adm } = await admin.from('superadmins').select('id').eq('id', user.user.id).maybeSingle()
  if (!adm) throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a superadmins.' })

  // URL do webhook (sem ?s= — verificação é via HMAC no header x-webhook-signature).
  const segredo = process.env.VALIDAPAY_WEBHOOK_SECRET
  const webhookUrl = (process.env.VALIDAPAY_WEBHOOK_URL || '').trim()
  if (!webhookUrl) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDAPAY_WEBHOOK_URL não configurada no servidor.' })
  }

  // Eventos suportados pela ValidaPay (onboarding.* não existe como evento global; aprovação de subconta
  // chega via webhookUrl na própria proposta, não aqui).
  const eventos = ['payment.success', 'charge.paid']

  try {
    // Lista webhooks já registrados (para diagnóstico).
    let existentes: any = null
    try { existentes = await listarWebhooks() } catch { /* best-effort */ }

    const resultado = await registrarWebhook(webhookUrl, eventos, segredo)
    return { ok: true, webhookUrl, resultado, existentes }
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: err?.data?.message ?? err?.message ?? 'Falha ao registrar webhook na ValidaPay.' })
  }
})
