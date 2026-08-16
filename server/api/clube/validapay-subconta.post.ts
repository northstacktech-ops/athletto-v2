import { defineEventHandler, readBody, createError, getHeader, getRequestURL } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { criarSubcontaPF, criarSubcontaPJ, validapayConfigurada, type SubcontaPF, type SubcontaPJ } from '~~/server/utils/validapay'
import { mensagemErroGateway } from '~~/server/utils/erroAmigavel'

/**
 * POST /api/clube/validapay-subconta
 * Cria a SUBCONTA ValidaPay do clube (cada clube recebe direto). Só o gestor
 * PRINCIPAL pode. A aprovação chega depois via webhook (account_approved).
 * Body: { tipo: 'pf'|'pj', dados: <payload ValidaPay sem webhookUrl> }
 */
export default defineEventHandler(async (event) => {
  if (!validapayConfigurada()) {
    throw createError({ statusCode: 503, statusMessage: 'ValidaPay não configurada (env VALIDAPAY_*).' })
  }
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Servidor sem credenciais Supabase.' })
  }
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // Auth: Bearer OU cookie (mesmo padrão dos endpoints de gestores).
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const { data } = await admin.auth.getUser(token)
    callerId = data.user?.id ?? null
  }
  if (!callerId) {
    const cookieUser = await serverSupabaseUser(event).catch(() => null)
    callerId = cookieUser?.id ?? null
  }
  if (!callerId) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  const { data: caller } = await admin
    .from('gestores')
    .select('id, clube_id, role, ativo')
    .eq('id', callerId)
    .maybeSingle()
  if (!caller || !caller.ativo || caller.role !== 'principal') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas o gestor principal pode conectar pagamentos.' })
  }

  const body = await readBody<{ tipo?: 'pf' | 'pj'; dados?: any }>(event)
  const tipo = body?.tipo === 'pj' ? 'pj' : 'pf'
  const dados = body?.dados
  if (!dados || typeof dados !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Dados da subconta ausentes.' })
  }

  // Normaliza telefone para E.164 (+55XXXXXXXXXX), conforme exigido pela ValidaPay.
  function normalizarTelefone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    const semDDI = (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
      ? digits.slice(2)
      : digits
    return '+55' + semDDI
  }

  if (tipo === 'pf') {
    if (typeof dados.phoneNumber === 'string') dados.phoneNumber = normalizarTelefone(dados.phoneNumber)
    delete dados.contactNumber
  } else {
    // PJ usa contactNumber (não phoneNumber)
    const rawTel = (dados.contactNumber ?? dados.phoneNumber) as string | undefined
    if (rawTel) dados.contactNumber = normalizarTelefone(rawTel)
    delete dados.phoneNumber
  }

  // Limpa formatação (R$, pontos, vírgulas) e devolve como STRING numérica
  // ("5000", não 5000) — a ValidaPay recusa esses campos como number
  // (confirmado via webhook: "Expected string, received number" em
  // financialDetails.declaredIncome/netWorth). A versão anterior convertia
  // pra Number, exatamente o formato que a ValidaPay rejeita.
  function paraStringNumerica(v: unknown): string {
    return String(Number(String(v).replace(/\D/g, '')) || 0)
  }

  // financialDetails (PF).
  if (tipo === 'pf' && dados.financialDetails && typeof dados.financialDetails === 'object') {
    const fd = dados.financialDetails as any
    if (fd.declaredIncome !== undefined) fd.declaredIncome = paraStringNumerica(fd.declaredIncome)
    if (fd.netWorth !== undefined)       fd.netWorth       = paraStringNumerica(fd.netWorth)
  }
  // financialCompanyDetails (PJ).
  if (tipo === 'pj' && dados.financialCompanyDetails && typeof dados.financialCompanyDetails === 'object') {
    const fcd = dados.financialCompanyDetails as any
    if (fcd.declaredCompanyRevenue !== undefined)
      fcd.declaredCompanyRevenue = paraStringNumerica(fcd.declaredCompanyRevenue)
  }
  // financialOwnerDetails dos owners PJ (campos opcionais).
  if (tipo === 'pj' && Array.isArray(dados.owner)) {
    for (const owner of dados.owner as any[]) {
      if (owner.financialOwnerDetails && typeof owner.financialOwnerDetails === 'object') {
        const fo = owner.financialOwnerDetails
        if (fo.ownerDeclaredIncome !== undefined)
          fo.ownerDeclaredIncome = paraStringNumerica(fo.ownerDeclaredIncome)
        if (fo.ownerDeclaredRevenue !== undefined)
          fo.ownerDeclaredRevenue = paraStringNumerica(fo.ownerDeclaredRevenue)
      }
    }
  }

  // webhookUrl: usa VALIDAPAY_WEBHOOK_URL (env var já configurada na Vercel).
  // Verificação agora é via HMAC no header x-webhook-signature, não por ?s= na query.
  dados.webhookUrl = process.env.VALIDAPAY_WEBHOOK_URL
    ?? `${getRequestURL(event).origin}/api/webhooks/validapay`

  let resp: any
  try {
    resp = tipo === 'pj'
      ? await criarSubcontaPJ(dados as SubcontaPJ)
      : await criarSubcontaPF(dados as SubcontaPF)
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: mensagemErroGateway(err, 'Não foi possível criar a conta de recebimento agora. Tente novamente mais tarde ou fale com o suporte.'),
    })
  }

  // Persiste o vínculo (status pendente até o webhook aprovar).
  await admin.from('clube_validapay').upsert({
    clube_id: caller.clube_id,
    tipo,
    form_id: resp.formId,
    document_number: dados.documentNumber ?? null,
    status: 'pendente',
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'clube_id' })

  return { ok: true, formId: resp.formId, status: resp.status }
})
