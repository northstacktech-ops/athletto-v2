import { defineEventHandler, readBody, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/gestores/definir-senha
 * Primeiro acesso do gestor convidado: informa e-mail + senha. Se houver um
 * convite pendente (precisa_definir_senha=true), define a senha e libera o
 * login. Sem e-mail/SMS. Body: { email, senha }
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Servidor sem credenciais Supabase.' })
  }

  const body = await readBody<{ email?: string; senha?: string }>(event)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const senha = String(body?.senha ?? '')
  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, statusMessage: 'E-mail inválido.' })
  if (senha.length < 8 || senha.length > 72) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter entre 8 e 72 caracteres.' })
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  const { data: g } = await admin
    .from('gestores')
    .select('id, precisa_definir_senha, ativo')
    .eq('email', email)
    .maybeSingle()

  if (!g || !g.ativo || !g.precisa_definir_senha) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nenhum convite pendente para este e-mail. Se já tem senha, use o login normal.',
    })
  }

  const { error: upErr } = await admin.auth.admin.updateUserById(g.id, { password: senha })
  if (upErr) throw createError({ statusCode: 500, statusMessage: 'Falha ao definir a senha.' })

  await admin.from('gestores').update({ precisa_definir_senha: false }).eq('id', g.id)

  return { ok: true }
})
