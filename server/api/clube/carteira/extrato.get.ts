import { defineEventHandler, createError, getHeader, getQuery } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { extratoSubconta, validapayConfigurada } from '~~/server/utils/validapay'

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
    return { transacoes: [], subconta_aprovada: false }
  }

  if (!validapayConfigurada()) {
    return { transacoes: [], subconta_aprovada: true, erro: 'ValidaPay não configurada.' }
  }

  const pagina = Number(getQuery(event).pagina ?? 1)

  try {
    const resp = await extratoSubconta(cv.account_number, pagina)

    // Parsing defensivo — a estrutura real será confirmada no primeiro retorno
    const lista: any[] = resp?.data ?? resp?.transactions ?? resp?.items ?? resp?.content ?? (Array.isArray(resp) ? resp : [])

    const transacoes = lista.map((t: any) => ({
      id: t.id ?? t.transactionId ?? t.referenceId,
      tipo: t.type ?? t.transactionType ?? 'entrada',
      valor: Number(t.amount ?? t.value ?? 0),
      descricao: t.description ?? t.title ?? t.reason ?? '',
      data: t.date ?? t.createdAt ?? t.processedAt ?? null,
      status: t.status ?? 'concluido',
    }))

    return { subconta_aprovada: true, transacoes, pagina, _raw: resp }
  } catch (err: any) {
    return {
      subconta_aprovada: true,
      transacoes: [],
      erro: err?.data?.message ?? err?.message ?? 'Extrato indisponível.',
    }
  }
})
