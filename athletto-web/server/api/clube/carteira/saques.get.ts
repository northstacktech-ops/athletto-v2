import { defineEventHandler, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

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

  const { data: saques } = await admin
    .from('saques')
    .select('id, valor, tipo, chave_pix, banco, status, solicitado_em, processado_em, ultimo_erro')
    .eq('clube_id', gestor.clube_id)
    .order('solicitado_em', { ascending: false })
    .limit(50)

  return { saques: saques ?? [] }
})
