import type { Clube, Assinatura } from '~/types'

export function useAdminClubes() {
  const supabase = useSupabaseClient()

  async function listar(filtros?: {
    plano?: Clube['plano']
    status?: Assinatura['status']
    busca?: string
  }) {
    let query = supabase
      .from('clubes')
      .select('*, assinatura:assinaturas(*)')
    if (filtros?.plano) query = query.eq('plano', filtros.plano)
    if (filtros?.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,slug.ilike.%${filtros.busca}%`)
    }
    const { data, error } = await query.order('criado_em', { ascending: false })
    return { data, error }
  }

  async function buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('clubes')
      .select('*, assinatura:assinaturas(*), gestores(*), atletas(count)')
      .eq('id', id)
      .single()
    return { data, error }
  }

  async function suspender(id: string, motivo: string) {
    const { data, error } = await supabase.rpc('suspender_clube', {
      p_clube_id: id,
      p_motivo: motivo,
    })
    return { data, error }
  }

  async function reativar(id: string) {
    const { data, error } = await supabase.rpc('reativar_clube', {
      p_clube_id: id,
    })
    return { data, error }
  }

  async function excluir(id: string, motivo: string) {
    // Soft delete: suspende em vez de deletar fisicamente
    const { data, error } = await supabase.rpc('suspender_clube', {
      p_clube_id: id,
      p_motivo: motivo,
    })
    return { data, error }
  }

  async function alterarPlano(id: string, plano: Clube['plano']) {
    const { data, error } = await supabase.rpc('alterar_plano_clube', {
      p_clube_id: id,
      p_novo_plano: plano,
    })
    return { data, error }
  }

  return { listar, buscarPorId, suspender, reativar, excluir, alterarPlano }
}
