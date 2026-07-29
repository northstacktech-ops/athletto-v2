import type { Assinatura, AssinaturaStatus, Clube } from '~/types'

export function useAssinaturas() {
  const supabase = useSupabaseClient()

  async function listar(filtros?: { status?: AssinaturaStatus; plano?: Clube['plano'] }) {
    let query = supabase
      .from('assinaturas')
      .select('*, clube:clube_id(id, nome, slug, logo_url, plano)')
    if (filtros?.status) query = query.eq('status', filtros.status)
    if (filtros?.plano) query = query.eq('plano', filtros.plano)
    const { data, error } = await query.order('criado_em', { ascending: false })
    return { data: data as Assinatura[] | null, error }
  }

  async function buscarPorClube(clubeId: string) {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*, clube:clube_id(id, nome, slug, logo_url, plano)')
      .eq('clube_id', clubeId)
      .single()
    return { data, error }
  }

  async function alterarStatus(id: string, status: AssinaturaStatus, motivo?: string) {
    const updates: Partial<Assinatura> = {
      status,
      atualizado_em: new Date().toISOString(),
    }
    if (status === 'cancelada') {
      updates.cancelada_em = new Date().toISOString()
      updates.motivo_cancelamento = motivo ?? null
    }
    const { data, error } = await supabase
      .from('assinaturas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  return { listar, buscarPorClube, alterarStatus }
}
