import { defineEventHandler, getRouterParam, createError, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { criarPixParaCobranca } from '~~/server/utils/pix'

/**
 * POST /api/planejamentos/:id/ativar
 *
 * Ativa um planejamento e dispara a criação dos Pix de TODAS as cobranças
 * geradas, em batches, respeitando rate limit da ValidaPay.
 *
 * Fluxo:
 *  1. Valida que o caller é o gestor do clube dono do planejamento
 *  2. Chama RPC ativar_planejamento (cria caixinha + cobranças no banco)
 *  3. Lista todas as cobranças geradas (status = 'pendente')
 *  4. Pra cada cobrança: chama criarPixParaCobranca (função compartilhada,
 *     sem HTTP self-call — funciona em serverless) em batches de 5
 *     com 250ms entre batches (margem de rate limit da ValidaPay).
 *  5. Retorna contadores e lista de eventuais erros (não trava o batch).
 *
 * Sem service-role: 503.
 */
export default defineEventHandler(async (event) => {
  const planejamentoId = getRouterParam(event, 'id')
  if (!planejamentoId) {
    throw createError({ statusCode: 400, statusMessage: 'planejamento_id ausente' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRole) {
    throw createError({ statusCode: 503, statusMessage: 'Server sem Supabase service role configurado' })
  }

  const authHeader = getHeader(event, 'authorization')
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

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

  const { data: planej, error: pErr } = await supabase
    .from('planejamentos')
    .select('id, clube_id, status, nome, valor')
    .eq('id', planejamentoId)
    .single()

  if (pErr || !planej) {
    throw createError({ statusCode: 404, statusMessage: 'Planejamento não encontrado' })
  }
  if (planej.status !== 'inativo') {
    throw createError({ statusCode: 409, statusMessage: 'Planejamento já foi ativado' })
  }

  const { data: gestor } = await supabase
    .from('gestores')
    .select('id, clube_id, ativo')
    .eq('id', userId)
    .single()

  if (!gestor || gestor.clube_id !== planej.clube_id || !gestor.ativo) {
    throw createError({ statusCode: 403, statusMessage: 'Sem permissão para ativar este planejamento' })
  }

  const { data: rpcResult, error: rpcErr } = await supabase.rpc('ativar_planejamento', {
    p_planejamento_id: planejamentoId,
    p_gestor_id: userId,
  })

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao ativar: ' + rpcErr.message,
    })
  }

  const caixinhaId = (rpcResult as any)?.caixinha_id as string | undefined
  if (!caixinhaId) {
    return { activated: true, cobrancasGeradas: 0, pixCriados: 0, erros: [] }
  }

  const { data: cobrancas, error: cErr } = await supabase
    .from('cobrancas')
    .select('id')
    .eq('caixinha_id', caixinhaId)
    .eq('status', 'pendente')

  if (cErr || !cobrancas) {
    return {
      activated: true,
      cobrancasGeradas: 0,
      pixCriados: 0,
      erros: [cErr?.message ?? 'falha ao listar cobranças'],
    }
  }

  const erros: { cobranca_id: string; erro: string }[] = []
  let pixCriados = 0
  let pixPendentes = 0

  // Orçamento de tempo: serverless (Vercel) corta a request em ~10s. Paramos
  // antes (~8s) e devolvemos sucesso PARCIAL — as cobranças sem Pix ficam
  // pendentes e podem ser geradas depois (botão "regerar Pix" / cron), em vez
  // de estourar 500/timeout e deixar o gestor sem resposta.
  const TIME_BUDGET_MS = 8000
  const inicio = Date.now()

  const batchSize = 5
  for (let i = 0; i < cobrancas.length; i += batchSize) {
    if (Date.now() - inicio > TIME_BUDGET_MS) {
      pixPendentes = cobrancas.length - i
      break
    }
    const batch = cobrancas.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map((cb) => criarPixParaCobranca(supabase, cb.id)),
    )

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value.ok) {
        pixCriados++
      } else {
        const motivo = r.status === 'fulfilled'
          ? (r.value.erro ?? 'erro')
          : String((r.reason as any)?.message ?? r.reason ?? 'erro')
        erros.push({ cobranca_id: batch[idx]!.id, erro: motivo })
      }
    })

    if (i + batchSize < cobrancas.length) {
      await new Promise((res) => setTimeout(res, 250))
    }
  }

  return {
    activated: true,
    cobrancasGeradas: cobrancas.length,
    pixCriados,
    pixPendentes,
    erros,
  }
})
