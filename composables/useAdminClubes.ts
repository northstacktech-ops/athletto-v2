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
      .select('*, assinatura:assinaturas(id, status, plano, trial_fim, proxima_cobranca, valor_mensal)')
    if (filtros?.plano) query = query.eq('plano', filtros.plano)
    if (filtros?.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,slug.ilike.%${filtros.busca}%`)
    }
    const { data, error } = await query.order('criado_em', { ascending: false })
    let normalizado = (data ?? []).map((c: any) => ({
      ...c,
      assinatura: Array.isArray(c.assinatura) ? c.assinatura[0] ?? null : c.assinatura ?? null,
    }))
    // status vive na assinatura embutida — filtrar aqui em vez de na query
    // (embed sem !inner não filtra do jeito esperado no PostgREST).
    if (filtros?.status) {
      normalizado = normalizado.filter((c) => c.assinatura?.status === filtros.status)
    }
    return { data: normalizado, error }
  }

  async function buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('clubes')
      .select('*, assinatura:assinaturas(id, status, plano, trial_inicio, trial_fim, proxima_cobranca, valor_mensal), gestores(id), atletas(id)')
      .eq('id', id)
      .single()
    if (error || !data) return { data: null, error }

    // A página espera { clube, assinatura, gestores, atletas } separados —
    // o select acima traz tudo embutido num único objeto (e `assinatura`
    // pode vir como array de 1 item ou objeto, dependendo de como o
    // PostgREST resolve a relação).
    const { assinatura, gestores, atletas, ...clube } = data as any
    return {
      data: {
        clube,
        assinatura: (Array.isArray(assinatura) ? assinatura[0] : assinatura) ?? null,
        gestores: gestores ?? [],
        atletas: atletas ?? [],
      },
      error: null,
    }
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
