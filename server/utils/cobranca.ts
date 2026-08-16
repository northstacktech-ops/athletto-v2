import type { SupabaseClient } from '@supabase/supabase-js'
import { enviarTemplateWhatsApp } from '~~/server/utils/whatsapp'
import { formatCurrency } from '~~/utils/format'

export interface BaixaCobrancaInput {
  /** Valor efetivamente pago, se vier do gateway; senão usa o valor da própria cobrança. */
  valor?: number
  /** YYYY-MM-DD; padrão hoje. */
  paidAt?: string
  origem?: 'webhook' | 'reconciliacao'
}

/**
 * Dá baixa numa cobrança pendente: marca paga, cria a transação de entrada,
 * recalcula a caixinha (se houver) e manda a confirmação via WhatsApp
 * (best-effort). Compartilhada entre o webhook da ValidaPay
 * (server/api/webhooks/validapay.post.ts) e o cron de reconciliação
 * (server/api/cron/reconciliar-cobrancas.get.ts) — mesma lógica, duas
 * origens diferentes de "o pagamento foi confirmado".
 *
 * Idempotente: não faz nada se a cobrança já estiver 'pago' (`cb.status`
 * checado ANTES de chamar esta função pelo caller, que já tem a linha em mãos).
 */
export async function baixarCobrancaPaga(
  supabase: SupabaseClient,
  cobrancaId: string,
  input: BaixaCobrancaInput = {},
): Promise<void> {
  const { data: cb } = await supabase
    .from('cobrancas')
    .select('id, clube_id, atleta_id, caixinha_id, valor, status, atletas(nome, telefone_responsavel)')
    .eq('id', cobrancaId)
    .maybeSingle()

  if (!cb || cb.status === 'pago') return

  const paidAt = input.paidAt ?? new Date().toISOString().slice(0, 10)
  const valorPago = input.valor || cb.valor

  await supabase
    .from('cobrancas')
    .update({ status: 'pago', data_pagamento: paidAt, atualizado_em: new Date().toISOString() })
    .eq('id', cb.id)

  await supabase.from('transacoes').insert({
    clube_id: cb.clube_id,
    tipo: 'entrada',
    valor: valorPago,
    descricao: input.origem === 'reconciliacao'
      ? 'Pagamento recebido via Pix (ValidaPay) — reconciliado'
      : 'Pagamento recebido via Pix (ValidaPay)',
    data: paidAt,
    cobranca_id: cb.id,
    caixinha_id: cb.caixinha_id,
    atleta_id: cb.atleta_id,
    origem: 'webhook',
  })

  if (cb.caixinha_id) {
    try { await supabase.rpc('recalcular_caixinha', { p_caixinha_id: cb.caixinha_id }) } catch { /* best-effort */ }
  }

  // Confirmação via WhatsApp — best-effort, nunca deve travar a baixa da cobrança.
  try {
    const atleta: any = (cb as any).atletas
    if (atleta?.telefone_responsavel) {
      const { data: msg } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          clube_id: cb.clube_id,
          cobranca_id: cb.id,
          tipo: 'confirmacao',
          template_usado: 'confirmacao_pagamento',
          status: 'pendente',
        })
        .select('id')
        .single()

      const resultado = await enviarTemplateWhatsApp(
        atleta.telefone_responsavel,
        'confirmacao_pagamento',
        [atleta.nome ?? 'Atleta', formatCurrency(valorPago)],
      )

      if (msg) {
        if (resultado.ok) {
          await supabase.from('mensagens_whatsapp')
            .update({ status: 'enviada', whatsapp_message_id: resultado.messageId, atualizado_em: new Date().toISOString() })
            .eq('id', (msg as any).id)
        } else if (resultado.motivo !== 'nao_configurado') {
          await supabase.from('mensagens_whatsapp')
            .update({ status: 'falhou', erro: resultado.erro ?? resultado.motivo, atualizado_em: new Date().toISOString() })
            .eq('id', (msg as any).id)
        }
      }
    }
  } catch { /* best-effort */ }
}
