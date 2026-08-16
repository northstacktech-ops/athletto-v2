import { defineEventHandler, getHeader, createError } from 'h3'
import { getServiceClient } from '~~/server/utils/appAtleta'
import { enviarTemplateWhatsApp } from '~~/server/utils/whatsapp'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { formatCurrency, formatDate } from '~~/utils/format'

/**
 * GET /api/cron/regua-cobranca
 *
 * Cron diário (Vercel) que decide, via RPC `gerar_mensagens_regua_cobranca`
 * (idempotente — unique(cobranca_id, tipo) em mensagens_whatsapp), quais
 * lembretes vencem hoje, e tenta enviar cada um pelo WhatsApp oficial.
 *
 * Sem BSP configurado (`whatsappConfigurado() === false`): a linha em
 * mensagens_whatsapp já foi criada pela RPC com status 'pendente' — essa
 * rota só tenta o envio real quando há credenciais; sem elas, não marca erro
 * (fica 'pendente' esperando o BSP ser contratado, não é uma falha).
 *
 * SEGURANÇA: mesmo padrão dos demais crons — exige
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

  const { data: pendentes, error } = await supabase.rpc('gerar_mensagens_regua_cobranca')
  if (error) {
    logEvento('error', 'cron.regua_cobranca.rpc_erro', { erro: erroParaLog(error) })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao gerar mensagens da régua.' })
  }

  const linhas = ((pendentes ?? []) as {
    out_id: string; out_clube_id: string; out_cobranca_id: string; out_tipo: string; out_template_usado: string
  }[]).map((l) => ({
    id: l.out_id, clube_id: l.out_clube_id, cobranca_id: l.out_cobranca_id, tipo: l.out_tipo, template_usado: l.out_template_usado,
  }))

  let enviadas = 0
  const erros: { mensagem_id: string; erro: string }[] = []
  const batchSize = 5

  for (let i = 0; i < linhas.length; i += batchSize) {
    const batch = linhas.slice(i, i + batchSize)
    await Promise.allSettled(batch.map(async (linha) => {
      const { data: cb } = await supabase
        .from('cobrancas')
        .select('valor, data_vencimento, atletas(nome, telefone_responsavel), clubes(nome)')
        .eq('id', linha.cobranca_id)
        .single()

      const atleta: any = (cb as any)?.atletas
      const clube: any = (cb as any)?.clubes
      const telefone = atleta?.telefone_responsavel as string | undefined

      if (!cb || !telefone) {
        await supabase.from('mensagens_whatsapp')
          .update({ status: 'falhou', erro: 'Sem telefone do responsável cadastrado', atualizado_em: new Date().toISOString() })
          .eq('id', linha.id)
        erros.push({ mensagem_id: linha.id, erro: 'sem_telefone' })
        return
      }

      const parametros = [
        atleta?.nome ?? 'Atleta',
        clube?.nome ?? 'seu clube',
        formatCurrency(Number((cb as any).valor)),
        formatDate((cb as any).data_vencimento),
      ]

      const resultado = await enviarTemplateWhatsApp(telefone, linha.template_usado, parametros)

      if (resultado.ok) {
        enviadas++
        await supabase.from('mensagens_whatsapp')
          .update({ status: 'enviada', whatsapp_message_id: resultado.messageId, atualizado_em: new Date().toISOString() })
          .eq('id', linha.id)
      } else if (resultado.motivo !== 'nao_configurado') {
        // Sem BSP configurado: deixa 'pendente' (não é erro, é esperado até contratar).
        await supabase.from('mensagens_whatsapp')
          .update({ status: 'falhou', erro: resultado.erro ?? resultado.motivo, atualizado_em: new Date().toISOString() })
          .eq('id', linha.id)
        erros.push({ mensagem_id: linha.id, erro: resultado.erro ?? resultado.motivo ?? 'erro' })
      }
    }))
    if (i + batchSize < linhas.length) {
      await new Promise((res) => setTimeout(res, 250))
    }
  }

  return { ok: true, mensagensGeradas: linhas.length, enviadas, erros }
})
