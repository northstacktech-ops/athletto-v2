import type { SupabaseClient } from '@supabase/supabase-js'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { criarCobrancaPix as criarPixValidaPay, validapayConfigurada, type SplitItem } from '~~/server/utils/validapay'
import { mensagemErroGateway } from '~~/server/utils/erroAmigavel'

export interface CriarPixResult {
  ok: boolean
  mock?: boolean
  id?: string
  link?: string | null
  qr_code?: string
  qr_code_url?: string | null
  copy_paste?: string
  expires_at?: string
  erro?: string
  status?: number
}

/**
 * Cria (ou regenera) um Pix na ValidaPay (subconta do clube) para uma
 * cobrança específica e atualiza `validapay_charge_id` / `validapay_emv`.
 *
 * Função compartilhada entre:
 *  • POST /api/cobrancas/:id/pix
 *  • POST /api/planejamentos/:id/ativar (batch — sem HTTP self-call)
 *
 * Sem subconta ValidaPay aprovada para o clube: gera stub determinístico
 * (modo dev/pendente) em vez de falhar — o gestor consegue regerar o Pix
 * depois de conectar a conta de pagamento.
 */
export async function criarPixParaCobranca(
  supabase: SupabaseClient,
  cobrancaId: string,
): Promise<CriarPixResult> {
  // Buscar cobrança + dados do atleta para popular customer
  const { data: cb, error } = await supabase
    .from('cobrancas')
    .select(`
      id, clube_id, valor, status, data_vencimento, caixinha_id,
      atletas(nome, cpf, email, telefone_responsavel),
      caixinhas(nome)
    `)
    .eq('id', cobrancaId)
    .single()

  if (error || !cb) {
    return { ok: false, status: 404, erro: 'Cobrança não encontrada' }
  }
  if (cb.status !== 'pendente') {
    return { ok: false, status: 409, erro: 'Cobrança não está pendente' }
  }

  const atleta: any = (cb as any).atletas
  const caixinha: any = (cb as any).caixinhas

  // ── ValidaPay ────────────────────────────────────────────────────────────
  // O clube precisa ter subconta ValidaPay APROVADA (ver
  // POST /api/clube/validapay-subconta) para receber o Pix direto.
  if (validapayConfigurada()) {
    const { data: vp } = await supabase
      .from('clube_validapay')
      .select('account_number, status')
      .eq('clube_id', cb.clube_id)
      .maybeSingle()

    if ((vp as any)?.status === 'aprovado' && (vp as any)?.account_number) {
      const cpfVP = String(atleta?.cpf ?? '').replace(/\D/g, '')
      // ValidaPay exige customer com documentNumber e email obrigatórios.
      const customerVP = {
        name: atleta?.nome ?? 'Cliente',
        documentNumber: cpfVP.length === 11 ? cpfVP : '00000000000',
        email: atleta?.email || 'financeiro@athletto.com.br',
        ...(atleta?.telefone_responsavel ? { cellphone: atleta.telefone_responsavel } : {}),
      }
      try {
        // Taxa Athletto: percentual + fixo (ex.: 2,5% + R$1,50), calculados
        // aqui e mandados como UM item de split só ('fixed', valor já
        // somado) — confirmado por erro real da ValidaPay ("Recebedor
        // duplicado no split") que ela recusa duas entradas de split pra
        // mesma accountNumber, mesmo com type diferente (percentage+fixed).
        const masterAccount = process.env.VALIDAPAY_MASTER_ACCOUNT || process.env.VALIDAPAY_MASTER_ACCOUNT_NUMBER
        const splitPct = Number(process.env.VALIDAPAY_SPLIT_PERCENTAGE ?? '0')
        const splitAmtCentavos = Number(process.env.VALIDAPAY_SPLIT_AMOUNT ?? '0')
        let split: SplitItem[] | undefined
        let taxaAthletto: number | null = null
        if (masterAccount && (splitPct > 0 || splitAmtCentavos > 0)) {
          taxaAthletto = Number(cb.valor) * (splitPct / 100) + splitAmtCentavos / 100
          const taxaCentavos = Math.round(taxaAthletto * 100)
          if (taxaCentavos > 0) {
            split = [{ type: 'fixed', accountNumber: masterAccount, amount: taxaCentavos }]
          }
        }

        const resp = await criarPixValidaPay({
          amount: Math.round(Number(cb.valor) * 100), // centavos
          accountId: (vp as any).account_number,
          title: `Athletto — ${caixinha?.nome ?? 'Cobrança'}`.slice(0, 140),
          customer: customerVP,
          split,
        })
        await supabase
          .from('cobrancas')
          .update({
            validapay_charge_id: resp.chargeId,
            validapay_emv: resp.emv,
            taxa_athletto: taxaAthletto,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', cobrancaId)
        return { ok: true, id: resp.chargeId, copy_paste: resp.emv || undefined, qr_code: resp.qrCodeBase64 }
      } catch (err: any) {
        logEvento('error', 'pix.criar.validapay_erro', { cobranca_id: cobrancaId, erro: erroParaLog(err) })
        // Mesmo padrão do caminho de sucesso (linha ~104): guarda a resposta
        // crua da ValidaPay pra investigação — hoje só erro de sucesso era
        // logado, falha ficava só no console (inacessível fora da Vercel).
        try {
          await supabase.from('webhook_logs').insert({
            origem: 'validapay',
            evento: 'charge_create_error',
            payment_id: null,
            payload: { cobranca_id: cobrancaId, erro: erroParaLog(err), data: (err as any)?.data ?? null },
            hmac_valido: true,
            status: 'erro',
            recebido_em: new Date().toISOString(),
          })
        } catch { /* log é best-effort */ }
        return { ok: false, status: 502, erro: mensagemErroGateway(err, 'Não foi possível gerar o Pix agora. Tente novamente em instantes.') }
      }
    }
  }

  // Stub: ValidaPay não configurada no env OU o clube ainda não tem subconta
  // aprovada. Devolvemos um Pix "mock" pra não travar o fluxo — o gestor
  // pode regerar depois de conectar a conta de pagamento em Configurações.
  const fakeId = `pay_stub_${Date.now()}_${cobrancaId.slice(0, 8)}`
  logEvento('warn', 'pix.criar.stub_sem_validapay', { cobranca_id: cobrancaId, clube_id: cb.clube_id })
  return { ok: true, mock: true, id: fakeId, link: null }
}
