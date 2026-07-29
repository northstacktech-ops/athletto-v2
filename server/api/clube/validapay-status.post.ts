import { defineEventHandler, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { statusSubconta, validapayConfigurada } from '~~/server/utils/validapay'

/**
 * POST /api/clube/validapay-status
 * Consulta a ValidaPay (GET /v1/proposals/:formId) o status atual da subconta
 * do clube e ATUALIZA clube_validapay — útil quando o webhook de aprovação não
 * chegou/processou. Registra a resposta crua em webhook_logs para conferência.
 */
export default defineEventHandler(async (event) => {
  if (!validapayConfigurada()) {
    throw createError({ statusCode: 503, statusMessage: 'ValidaPay não configurada.' })
  }
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) throw createError({ statusCode: 503, statusMessage: 'Servidor sem Supabase.' })
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) callerId = (await admin.auth.getUser(token)).data.user?.id ?? null
  if (!callerId) callerId = (await serverSupabaseUser(event).catch(() => null))?.id ?? null
  if (!callerId) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  const { data: caller } = await admin.from('gestores').select('clube_id, ativo').eq('id', callerId).maybeSingle()
  if (!caller || !caller.ativo) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })

  const { data: sub } = await admin
    .from('clube_validapay').select('form_id, status').eq('clube_id', caller.clube_id).maybeSingle()
  if (!sub || !(sub as any).form_id) {
    throw createError({ statusCode: 404, statusMessage: 'Nenhuma subconta para consultar.' })
  }
  const formId = (sub as any).form_id

  let raw: any
  try {
    raw = await statusSubconta(formId)
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: err?.data?.message ?? err?.message ?? 'Falha ao consultar a ValidaPay.' })
  }

  // Loga a resposta crua p/ travar os nomes de campo reais (best-effort).
  // Obs.: queries do supabase-js NÃO têm .catch() — usar try/catch.
  try {
    await admin.from('webhook_logs').insert({
      origem: 'validapay', evento: 'proposal_status_check', payload: raw,
      hmac_valido: true, status: 'recebido',
    })
  } catch { /* log é best-effort */ }

  // Parsing dos campos REAIS da ValidaPay (confirmados via webhook_logs):
  //   proposalStatus.proposal  : PENDING | APPROVED | REJECTED...
  //   proposalStatus.sendStatus: FAILED quando o envio nem entrou na análise
  //   onboardingError.message  : motivo da falha
  const ps = raw?.proposalStatus ?? {}
  const proposal = String(ps.proposal ?? '').toUpperCase()
  const sendStatus = String(ps.sendStatus ?? '').toUpperCase()
  const onbErr = raw?.onboardingError
  const acc = raw?.account ?? {}
  const accountNumber = acc.account ?? acc.accountNumber ?? raw?.accountNumber ?? (typeof raw?.account === 'string' ? raw.account : null) ?? null

  const aprovado = proposal === 'APPROVED' || proposal === 'APROVADO' || !!accountNumber
  const recusado = ['REJECTED', 'REFUSED', 'DENIED', 'REPROVED'].includes(proposal)
  const falhou = !aprovado && (sendStatus === 'FAILED' || !!onbErr)

  let novoStatus = (sub as any).status as string
  let erroMsg: string | null = null
  if (aprovado) novoStatus = 'aprovado'
  else if (recusado || falhou) {
    novoStatus = 'recusado'
    erroMsg = onbErr?.message ?? 'A ValidaPay recusou o cadastro. Revise os dados e envie novamente.'
  } else {
    novoStatus = 'pendente'
  }

  await admin.from('clube_validapay').update({
    status: novoStatus,
    account_number: accountNumber ?? undefined,
    branch: acc.branch ?? undefined,
    ispb: acc.ispb ?? undefined,
    ultimo_erro: erroMsg,
    atualizado_em: new Date().toISOString(),
  }).eq('clube_id', caller.clube_id)

  return { ok: true, status: novoStatus, erro: erroMsg }
})
