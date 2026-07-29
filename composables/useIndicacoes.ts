import type { Indicacao, IndicacaoStatus } from '~/types'

export function useIndicacoes() {
  const supabase = useSupabaseClient()

  async function listar(filtros?: { status?: IndicacaoStatus; busca?: string }) {
    let query = supabase
      .from('indicacoes')
      .select('*, indicador:clube_indicador_id(id, nome, slug, logo_url), indicado:clube_indicado_id(id, nome, slug, logo_url)')
    if (filtros?.status) query = query.eq('status', filtros.status)
    const { data, error } = await query.order('criado_em', { ascending: false })
    return { data: data as Indicacao[] | null, error }
  }

  async function aprovar(id: string) {
    const { data, error } = await supabase
      .from('indicacoes')
      .update({
        status: 'aprovada',
        aprovada_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  async function rejeitar(id: string, motivo: string) {
    const { data, error } = await supabase
      .from('indicacoes')
      .update({
        status: 'rejeitada',
        rejeitada_em: new Date().toISOString(),
        motivo_rejeicao: motivo,
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  return { listar, aprovar, rejeitar }
}
