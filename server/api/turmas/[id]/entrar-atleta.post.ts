import { defineEventHandler, getRouterParam, readBody, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { criarPixParaCobranca } from '~~/server/utils/pix'

/**
 * POST /api/turmas/:id/entrar-atleta
 *
 * Vincula um atleta à turma via RPC `atleta_entrar_turma` (que já cuida de
 * gerar a cobrança do ciclo atual, sem retroativo, se a turma tiver
 * mensalidade ativa) e, se uma cobrança foi gerada, cria o Pix na hora —
 * mesmo padrão de server/api/planejamentos/[id]/ativar.post.ts.
 *
 * Body: { atleta_id: string }
 */
export default defineEventHandler(async (event) => {
  const turmaId = getRouterParam(event, 'id')
  if (!turmaId) {
    throw createError({ statusCode: 400, statusMessage: 'turma_id ausente' })
  }

  const body = await readBody<{ atleta_id?: string }>(event)
  const atletaId = body?.atleta_id
  if (!atletaId) {
    throw createError({ statusCode: 400, statusMessage: 'atleta_id ausente' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Server sem Supabase service role configurado' })
  }

  const authHeader = getHeader(event, 'authorization')
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  })

  let userId: string | null = null
  if (accessToken) {
    const { data: userData } = await supabase.auth.getUser(accessToken)
    userId = userData.user?.id ?? null
  }
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

  const { data: turma, error: tErr } = await supabase
    .from('turmas')
    .select('id, clube_id')
    .eq('id', turmaId)
    .single()

  if (tErr || !turma) {
    throw createError({ statusCode: 404, statusMessage: 'Turma não encontrada' })
  }

  const { data: gestor } = await supabase
    .from('gestores')
    .select('id, clube_id, ativo')
    .eq('id', userId)
    .single()

  if (!gestor || gestor.clube_id !== turma.clube_id || !gestor.ativo) {
    throw createError({ statusCode: 403, statusMessage: 'Sem permissão para vincular atletas nesta turma' })
  }

  const { data: rpcResult, error: rpcErr } = await supabase.rpc('atleta_entrar_turma', {
    p_atleta_id: atletaId,
    p_turma_id: turmaId,
  })

  if (rpcErr) {
    throw createError({ statusCode: 500, statusMessage: 'Falha ao vincular atleta: ' + rpcErr.message })
  }

  const cobrancaId = (rpcResult as any)?.cobranca_id as string | undefined
  if (!cobrancaId) {
    return { vinculado: true, cobrancaGerada: false, pixCriado: false }
  }

  const pix = await criarPixParaCobranca(supabase, cobrancaId)
  return {
    vinculado: true,
    cobrancaGerada: true,
    pixCriado: pix.ok,
    erro: pix.ok ? null : pix.erro,
  }
})
