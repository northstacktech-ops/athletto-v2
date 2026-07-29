import { defineEventHandler, getHeader, createError } from 'h3'
import { getServiceClient } from '~~/server/utils/appAtleta'
import { criarPixParaCobranca } from '~~/server/utils/pix'
import { logEvento, erroParaLog } from '~~/server/utils/logger'

/**
 * GET /api/cron/gerar-mensalidades
 *
 * Cron mensal (Vercel, dia 1) que gera a cobrança do ciclo corrente para
 * cada turma com mensalidade ativa, via RPC `gerar_cobrancas_mensalidade_mes_atual`
 * (idempotente), e cria o Pix de cada cobrança nova em batch — mesmo padrão
 * de server/api/planejamentos/[id]/ativar.post.ts.
 *
 * SEGURANÇA: mesmo padrão de processar-notificacoes.get.ts — exige
 * `Authorization: Bearer <CRON_SECRET>` quando a env está definida.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = getHeader(event, 'authorization') || ''
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Não autorizado.' })
    }
  }

  const supabase = getServiceClient(event)

  // RPC devolve os ids das cobranças recém-criadas — evita ter que buscar a
  // tabela inteira só pra descobrir o que é novo.
  const { data: novasIds, error } = await supabase.rpc('gerar_cobrancas_mensalidade_mes_atual')
  if (error) {
    logEvento('error', 'cron.gerar_mensalidades.rpc_erro', { erro: erroParaLog(error) })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao gerar cobranças de mensalidade.' })
  }

  const ids = (novasIds ?? []) as string[]
  let pixCriados = 0
  const erros: { cobranca_id: string; erro: string }[] = []
  const batchSize = 5

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map((id) => criarPixParaCobranca(supabase, id)),
    )
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value.ok) {
        pixCriados++
      } else {
        const motivo = r.status === 'fulfilled'
          ? (r.value.erro ?? 'erro')
          : String((r.reason as any)?.message ?? r.reason ?? 'erro')
        erros.push({ cobranca_id: batch[idx]!, erro: motivo })
      }
    })
    if (i + batchSize < ids.length) {
      await new Promise((res) => setTimeout(res, 250))
    }
  }

  return { ok: true, cobrancasGeradas: ids.length, pixCriados, erros }
})
