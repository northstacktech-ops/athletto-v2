import type { Voucher, VoucherTipo, VoucherStatus, Clube } from '~/types'

export function useVouchers() {
  const supabase = useSupabaseClient()

  async function listar(filtros?: {
    status?: VoucherStatus
    tipo?: VoucherTipo
    clube_id?: string
    busca?: string
  }) {
    let query = supabase
      .from('vouchers')
      .select('*, clube:clube_id(id, nome, slug, logo_url), emissor:emitido_por(id, nome)')
    if (filtros?.status) query = query.eq('status', filtros.status)
    if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
    if (filtros?.clube_id) query = query.eq('clube_id', filtros.clube_id)
    const { data, error } = await query.order('criado_em', { ascending: false })
    return { data: data as Voucher[] | null, error }
  }

  async function aplicar(payload: {
    clube_id: string
    tipo: VoucherTipo
    dias_concedidos: number
    plano_concedido?: Clube['plano'] | null
    motivo: string
    observacoes?: string | null
  }) {
    const { data, error } = await supabase
      .from('vouchers')
      .insert({
        clube_id: payload.clube_id,
        tipo: payload.tipo,
        dias_concedidos: payload.dias_concedidos,
        plano_concedido: payload.plano_concedido ?? null,
        motivo: payload.motivo,
        observacoes: payload.observacoes ?? null,
        status: 'ativo',
        aplicado_em: new Date().toISOString(),
      })
      .select('*, clube:clube_id(id, nome, slug, logo_url), emissor:emitido_por(id, nome)')
      .single()
    return { data: data as Voucher | null, error }
  }

  async function revogar(id: string, motivo: string) {
    const { data, error } = await supabase
      .from('vouchers')
      .update({
        status: 'revogado',
        revogado_em: new Date().toISOString(),
        motivo_revogacao: motivo,
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  return { listar, aplicar, revogar }
}
