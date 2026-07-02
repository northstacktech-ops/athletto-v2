import { defineEventHandler, createError, getHeader, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { saldoSubconta, solicitarSaque, validapayConfigurada } from '~~/server/utils/validapay'

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) throw createError({ statusCode: 503, statusMessage: 'Sem credenciais Supabase.' })

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

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
  if (!callerId) throw createError({ statusCode: 401, statusMessage: 'Não autenticado.' })

  const { data: gestor } = await admin
    .from('gestores')
    .select('clube_id, role, ativo')
    .eq('id', callerId)
    .maybeSingle()
  if (!gestor?.ativo || gestor.role !== 'principal') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas o gestor principal pode solicitar saques.' })
  }

  const { data: cv } = await admin
    .from('clube_validapay')
    .select('account_number, status')
    .eq('clube_id', gestor.clube_id)
    .maybeSingle()

  if (!cv?.account_number || cv.status !== 'aprovado') {
    throw createError({ statusCode: 422, statusMessage: 'Subconta ValidaPay não aprovada.' })
  }

  if (!validapayConfigurada()) {
    throw createError({ statusCode: 503, statusMessage: 'ValidaPay não configurada.' })
  }

  const body = await readBody<{
    valor?: number
    tipo?: 'pix' | 'ted'
    chave_pix?: string
    banco?: string
    agencia?: string
    conta?: string
    tipo_conta?: string
  }>(event)

  const valor = Number(body?.valor ?? 0)
  const tipo = body?.tipo === 'ted' ? 'ted' : 'pix'

  if (!valor || valor <= 0) throw createError({ statusCode: 400, statusMessage: 'Valor inválido.' })
  if (tipo === 'pix' && !body?.chave_pix) throw createError({ statusCode: 400, statusMessage: 'Chave Pix obrigatória.' })
  if (tipo === 'ted' && (!body?.banco || !body?.agencia || !body?.conta)) {
    throw createError({ statusCode: 400, statusMessage: 'Dados bancários incompletos para TED.' })
  }

  // Verifica saldo antes de prosseguir
  try {
    const saldoResp = await saldoSubconta(cv.account_number)
    const saldoDisponivel =
      Number(saldoResp?.balance ?? saldoResp?.availableBalance ?? saldoResp?.available ?? saldoResp?.amount ?? 0)
    if (saldoDisponivel > 0 && valor > saldoDisponivel) {
      throw createError({ statusCode: 422, statusMessage: `Saldo insuficiente. Disponível: R$ ${saldoDisponivel.toFixed(2)}` })
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    // Se a consulta de saldo falhar, prossegue — a ValidaPay recusará se não houver saldo
  }

  // Grava registro pendente
  const { data: saqueRow } = await admin
    .from('saques')
    .insert({
      clube_id: gestor.clube_id,
      account_number: cv.account_number,
      valor,
      tipo,
      chave_pix: tipo === 'pix' ? body.chave_pix : null,
      banco: tipo === 'ted' ? body.banco : null,
      agencia: tipo === 'ted' ? body.agencia : null,
      conta: tipo === 'ted' ? body.conta : null,
      tipo_conta: tipo === 'ted' ? (body.tipo_conta ?? null) : null,
      status: 'processando',
    })
    .select('id')
    .single()

  const dadosVP: any = { amount: valor, description: 'Saque solicitado via Athletto' }
  if (tipo === 'pix') dadosVP.pixKey = body.chave_pix
  else {
    dadosVP.bankCode = body.banco
    dadosVP.agency = body.agencia
    dadosVP.accountNumber = body.conta
    if (body.tipo_conta) dadosVP.accountType = body.tipo_conta.toUpperCase()
  }

  try {
    const respVP = await solicitarSaque(cv.account_number, dadosVP)
    await admin
      .from('saques')
      .update({ status: 'pendente', resposta_vp: respVP, processado_em: new Date().toISOString() })
      .eq('id', saqueRow!.id)

    return { ok: true, saqueId: saqueRow!.id }
  } catch (err: any) {
    const erro = err?.data?.message ?? err?.message ?? 'Falha ao solicitar saque na ValidaPay.'
    await admin
      .from('saques')
      .update({ status: 'recusado', ultimo_erro: erro, processado_em: new Date().toISOString() })
      .eq('id', saqueRow!.id)
    throw createError({ statusCode: 502, statusMessage: erro })
  }
})
