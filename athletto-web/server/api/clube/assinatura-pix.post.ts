import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { criarCobrancaPix, validapayConfigurada } from '~~/server/utils/validapay'
import { PLANOS } from '~/types'

/**
 * POST /api/clube/assinatura-pix
 * Gera o Pix da ASSINATURA do clube (clube paga o Athletto). Cobra na conta
 * MASTER ValidaPay (sem accountId → o Athletto recebe). Guarda o charge/EMV e
 * o plano pendente na `assinaturas`; a ativação ocorre no webhook payment.success.
 * Só o gestor principal. Serve para 1ª assinatura E upgrade.
 * Body: { plano: 'basico'|'intermediario'|'profissional', cpf?: string }
 *   cpf: fallback se o gestor não tiver CPF cadastrado no perfil
 */
export default defineEventHandler(async (event) => {
  if (!validapayConfigurada()) {
    throw createError({ statusCode: 503, statusMessage: 'Pagamentos ainda não configurados (ValidaPay).' })
  }
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Servidor sem credenciais Supabase.' })
  }
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // Auth: Bearer OU cookie (mesmo padrão dos outros endpoints de clube).
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) callerId = (await admin.auth.getUser(token)).data.user?.id ?? null
  if (!callerId) callerId = (await serverSupabaseUser(event).catch(() => null))?.id ?? null
  if (!callerId) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  const { data: caller } = await admin
    .from('gestores')
    .select('clube_id, role, ativo, nome, cpf, email, telefone')
    .eq('id', callerId)
    .maybeSingle()
  if (!caller || !caller.ativo || caller.role !== 'principal') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas o gestor principal pode assinar.' })
  }

  const body = await readBody<{ plano?: string; cpf?: string }>(event)
  const plano = body?.plano as keyof typeof PLANOS | undefined
  if (!plano || !PLANOS[plano]) {
    throw createError({ statusCode: 400, statusMessage: 'Plano inválido.' })
  }
  const valor = PLANOS[plano].preco

  // CPF: usa o do perfil se disponível; caso contrário aceita do body (coletado no checkout).
  const cpfPerfil = String(caller?.cpf ?? '').replace(/\D/g, '')
  const cpfBody = String(body?.cpf ?? '').replace(/\D/g, '')
  const cpfFinal = cpfPerfil.length === 11 ? cpfPerfil : cpfBody.length === 11 ? cpfBody : ''
  if (!cpfFinal) {
    throw createError({ statusCode: 400, statusMessage: 'CPF obrigatório para gerar o Pix.' })
  }

  // Persiste o CPF no perfil se ainda não estava cadastrado (evita pedir de novo).
  if (!cpfPerfil && cpfBody.length === 11) {
    try {
      await admin.from('gestores').update({ cpf: cpfBody }).eq('id', callerId)
    } catch { /* best-effort */ }
  }

  const { data: clube } = await admin
    .from('clubes').select('nome').eq('id', caller.clube_id).maybeSingle()

  try {
    // ValidaPay exige customer com documentNumber e email obrigatórios.
    const customerVP = {
      name: caller?.nome ?? 'Cliente',
      documentNumber: cpfFinal,
      email: caller?.email || 'financeiro@athletto.com.br',
      ...(caller?.telefone ? { cellphone: caller.telefone } : {}),
    }

    // Sem accountId → cobra na conta Master (Athletto recebe).
    const resp = await criarCobrancaPix({
      amount: Number(valor), // reais (ValidaPay espera reais, não centavos)
      title: `Assinatura Athletto — ${PLANOS[plano].nome}`,
      description: `Plano ${PLANOS[plano].nome} · ${(clube as any)?.nome ?? 'clube'}`,
      customer: customerVP,
    })

    // Log da resposta bruta para confirmar os nomes reais dos campos da ValidaPay.
    try {
      await admin.from('webhook_logs').insert({
        origem: 'validapay',
        evento: 'charge_create_response',
        payment_id: resp.chargeId || null,
        payload: resp.raw,
        hmac_valido: true,
        status: 'recebido',
        recebido_em: new Date().toISOString(),
      })
    } catch { /* log é best-effort */ }

    if (!resp.chargeId) {
      throw new Error(`Charge criada mas ID não encontrado na resposta. Resposta raw: ${JSON.stringify(resp.raw)}`)
    }

    const { error: updateErr } = await admin
      .from('assinaturas')
      .update({
        validapay_charge_id: resp.chargeId,
        validapay_emv: resp.emv,
        plano_pendente: plano,
      })
      .eq('clube_id', caller.clube_id)

    if (updateErr) {
      // Charge foi criada na ValidaPay mas não conseguimos guardar o ID.
      // Retorna erro para o frontend não iniciar polling com DB inconsistente.
      throw new Error(`Pix gerado (${resp.chargeId}) mas falha ao salvar no banco: ${updateErr.message}`)
    }

    return { ok: true, chargeId: resp.chargeId, emv: resp.emv, qrCodeBase64: resp.qrCodeBase64, plano, valor }
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: err?.data?.message ?? err?.message ?? 'Falha ao gerar Pix da assinatura.' })
  }
})
