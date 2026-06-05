import type { SupabaseClient } from '@supabase/supabase-js'
import type { AbacateCreatePixRequest, AbacatePixPayment } from '~/types/abacatepay'

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
 * Cria (ou regenera) um Pix no AbacatePay para uma cobrança específica e
 * atualiza `abacatepay_payment_id` / `abacatepay_link` no banco.
 *
 * Função compartilhada entre:
 *  • POST /api/cobrancas/:id/pix
 *  • POST /api/planejamentos/:id/ativar (batch — sem HTTP self-call)
 *
 * Sem ABACATEPAY_API_KEY: gera stub determinístico (modo dev).
 */
export async function criarPixParaCobranca(
  supabase: SupabaseClient,
  cobrancaId: string,
  opts: { apiUrl: string; apiKey?: string },
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

  // Stub se sem AbacatePay configurado
  if (!opts.apiKey) {
    const fakeId = `pay_stub_${Date.now()}_${cobrancaId.slice(0, 8)}`
    await supabase
      .from('cobrancas')
      .update({
        abacatepay_payment_id: fakeId,
        abacatepay_link: `https://abacatepay.com/pix/${fakeId}`,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cobrancaId)
    return { ok: true, mock: true, id: fakeId, link: `https://abacatepay.com/pix/${fakeId}` }
  }

  // Expiração: até a data de vencimento (último segundo) ou no mínimo 1h
  const venc = new Date(cb.data_vencimento + 'T23:59:59')
  const expiresIn = Math.max(3600, Math.floor((venc.getTime() - Date.now()) / 1000))

  const req: AbacateCreatePixRequest = {
    amount: Math.round(Number(cb.valor) * 100), // centavos
    description: `Athletto — ${caixinha?.nome ?? 'Cobrança'} (${atleta?.nome ?? ''})`.slice(0, 140),
    customer: {
      name: atleta?.nome ?? 'Cliente',
      tax_id: atleta?.cpf ?? null,
      email: atleta?.email ?? null,
      cellphone: atleta?.telefone_responsavel ?? null,
    },
    expires_in: expiresIn,
    metadata: { cobranca_id: cb.id, clube_id: cb.clube_id },
  }

  try {
    const pix = await $fetch<AbacatePixPayment>(`${opts.apiUrl}/pixQrCode/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: req,
    })

    await supabase
      .from('cobrancas')
      .update({
        abacatepay_payment_id: pix.id,
        abacatepay_link: pix.pix_qr_code_url ?? null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cobrancaId)

    return {
      ok: true,
      id: pix.id,
      qr_code: pix.pix_qr_code,
      qr_code_url: pix.pix_qr_code_url,
      copy_paste: pix.pix_copy_paste,
      expires_at: pix.expires_at,
    }
  } catch (err: any) {
    console.error('[abacatepay create pix] erro:', err)
    return { ok: false, status: 502, erro: 'Falha no gateway AbacatePay' }
  }
}
