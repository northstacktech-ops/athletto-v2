import { defineEventHandler, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { saldoSubconta, validapayConfigurada } from '~~/server/utils/validapay'

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
    .select('clube_id, ativo')
    .eq('id', callerId)
    .maybeSingle()
  if (!gestor?.ativo) throw createError({ statusCode: 403, statusMessage: 'Sem acesso.' })

  const { data: cv } = await admin
    .from('clube_validapay')
    .select('account_number, status')
    .eq('clube_id', gestor.clube_id)
    .maybeSingle()

  if (!cv?.account_number || cv.status !== 'aprovado') {
    return { saldo: null, subconta_aprovada: false }
  }

  if (!validapayConfigurada()) {
    return { saldo: null, subconta_aprovada: true, erro: 'ValidaPay não configurada.' }
  }

  try {
    const resp = await saldoSubconta(cv.account_number)
    // Parsing defensivo — logar resposta crua na primeira chamada para confirmar campos
    await admin.from('webhook_logs').insert({
      origem: 'validapay',
      evento: 'carteira_saldo_response',
      payload: resp,
      status: 'processado',
      recebido_em: new Date().toISOString(),
    }).then(() => {}).catch(() => {}) // best-effort, não bloqueia

    const saldo =
      resp?.balance ?? resp?.availableBalance ?? resp?.available ?? resp?.amount ??
      resp?.data?.balance ?? resp?.data?.availableBalance ?? null

    return {
      subconta_aprovada: true,
      saldo: saldo !== null ? Number(saldo) : null,
      atualizado_em: new Date().toISOString(),
      _raw: resp,
    }
  } catch (err: any) {
    return {
      subconta_aprovada: true,
      saldo: null,
      erro: err?.data?.message ?? err?.message ?? 'Erro ao consultar saldo.',
    }
  }
})
