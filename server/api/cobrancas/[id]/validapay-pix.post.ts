import { defineEventHandler, getRouterParam, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { criarCobrancaPix, validapayConfigurada } from '~~/server/utils/validapay'

/**
 * POST /api/cobrancas/:id/validapay-pix
 * Gera o Pix de uma cobrança NA SUBCONTA do clube (clube recebe direto) e
 * salva validapay_charge_id + EMV (copia-e-cola). Idempotente: se já tem
 * charge id, retorna o existente.
 */
export default defineEventHandler(async (event) => {
  if (!validapayConfigurada()) {
    throw createError({ statusCode: 503, statusMessage: 'ValidaPay não configurada.' })
  }
  const cobrancaId = getRouterParam(event, 'id')
  if (!cobrancaId) throw createError({ statusCode: 400, statusMessage: 'cobranca_id ausente' })

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) throw createError({ statusCode: 503, statusMessage: 'Servidor sem Supabase.' })
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // Auth: Bearer ou cookie.
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) callerId = (await admin.auth.getUser(token)).data.user?.id ?? null
  if (!callerId) callerId = (await serverSupabaseUser(event).catch(() => null))?.id ?? null
  if (!callerId) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  const { data: caller } = await admin
    .from('gestores').select('clube_id, ativo').eq('id', callerId).maybeSingle()
  if (!caller || !caller.ativo) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })

  // Cobrança precisa ser do clube do caller e estar pendente.
  const { data: cb } = await admin
    .from('cobrancas')
    .select('id, clube_id, valor, status, validapay_charge_id, validapay_emv, atletas(nome, cpf, email, telefone_responsavel)')
    .eq('id', cobrancaId)
    .maybeSingle()
  if (!cb || cb.clube_id !== caller.clube_id) throw createError({ statusCode: 404, statusMessage: 'Cobrança não encontrada.' })
  if (cb.validapay_charge_id) {
    return { ok: true, chargeId: cb.validapay_charge_id, emv: cb.validapay_emv, jaExistia: true }
  }
  if (cb.status !== 'pendente') throw createError({ statusCode: 409, statusMessage: 'Cobrança não está pendente.' })

  // Subconta aprovada do clube (recebe direto).
  const { data: sub } = await admin
    .from('clube_validapay')
    .select('account_number, status')
    .eq('clube_id', cb.clube_id)
    .maybeSingle()
  if (!sub || sub.status !== 'aprovado' || !sub.account_number) {
    throw createError({ statusCode: 409, statusMessage: 'Subconta ValidaPay do clube ainda não aprovada.' })
  }

  const atleta: any = (cb as any)?.atletas
  const cpfVP = String(atleta?.cpf ?? '').replace(/\D/g, '')
  const customerVP = cpfVP.length === 11
    ? {
        name: atleta?.nome ?? 'Cliente',
        documentNumber: cpfVP,
        email: atleta?.email ?? undefined,
        phone: atleta?.telefone_responsavel ?? undefined
      }
    : undefined

  try {
    const masterAccount = process.env.VALIDAPAY_MASTER_ACCOUNT || process.env.VALIDAPAY_MASTER_ACCOUNT_NUMBER
    let split: any[] | undefined = undefined
    if (masterAccount) {
      const splitPct = Number(process.env.VALIDAPAY_SPLIT_PERCENTAGE ?? '0')
      const splitAmt = Number(process.env.VALIDAPAY_SPLIT_AMOUNT ?? '0')
      if (splitPct > 0) {
        split = [{
          type: 'percentage',
          accountNumber: masterAccount,
          amount: splitPct
        }]
      } else if (splitAmt > 0) {
        split = [{
          type: 'fixed',
          accountNumber: masterAccount,
          amount: splitAmt // em reais
        }]
      }
    }

    const resp = await criarCobrancaPix({
      amount: Number(cb.valor), // reais (ValidaPay espera reais, não centavos)
      accountId: sub.account_number,
      title: 'Athletto — mensalidade',
      customer: customerVP,
      split,
    })
    await admin
      .from('cobrancas')
      .update({ validapay_charge_id: resp.chargeId, validapay_emv: resp.emv, atualizado_em: new Date().toISOString() })
      .eq('id', cb.id)
    return { ok: true, chargeId: resp.chargeId, emv: resp.emv }
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: err?.data?.message ?? err?.message ?? 'Falha ao gerar Pix na ValidaPay.' })
  }
})
