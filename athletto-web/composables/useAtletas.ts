import type { Atleta } from '~/types'

export function useAtletas() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  async function listar(filtros?: {
    status?: string
    saude?: string
    turma_id?: string
    busca?: string
    incluir_inativos?: boolean
  }) {
    // Filtro por turma: busca os atletas vinculados àquela turma antes
    let idsDaTurma: string[] | null = null
    if (filtros?.turma_id) {
      const { data: vinculos } = await supabase
        .from('atleta_turma')
        .select('atleta_id')
        .eq('turma_id', filtros.turma_id)
        .eq('ativo', true)
      idsDaTurma = (vinculos ?? []).map((v: any) => v.atleta_id)
      if (idsDaTurma.length === 0) return { data: [] as Atleta[], error: null }
    }

    let query = supabase
      .from('atletas')
      .select('*')
      .eq('clube_id', getClubId())

    if (!filtros?.incluir_inativos) query = query.eq('ativo', true)
    if (filtros?.status) query = query.eq('status', filtros.status)
    if (filtros?.saude) query = query.eq('saude', filtros.saude)
    if (idsDaTurma) query = query.in('id', idsDaTurma)
    if (filtros?.busca) {
      query = query.or(
        `nome.ilike.%${filtros.busca}%,apelido.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%`,
      )
    }

    const { data, error } = await query.order('nome')
    return { data: data as Atleta[] | null, error }
  }

  /**
   * Lista atletas de várias turmas de uma vez (usado em filtros e UIs que
   * precisam mostrar o vínculo). Retorna um Map<turma_id, atleta_id[]>.
   */
  async function listarVinculosPorTurmas(turma_ids: string[]) {
    if (turma_ids.length === 0) return new Map<string, string[]>()
    const { data } = await supabase
      .from('atleta_turma')
      .select('atleta_id, turma_id')
      .eq('ativo', true)
      .in('turma_id', turma_ids)
    const map = new Map<string, string[]>()
    ;(data ?? []).forEach((row: any) => {
      const arr = map.get(row.turma_id) ?? []
      arr.push(row.atleta_id)
      map.set(row.turma_id, arr)
    })
    return map
  }

  async function buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('atletas')
      .select('*')
      .eq('id', id)
      .eq('clube_id', getClubId())
      .single()

    return { data: data as Atleta | null, error }
  }

  async function criar(payload: Omit<Atleta, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('atletas')
      .insert({ ...payload, clube_id: getClubId() })
      .select()
      .single()

    return { data: data as Atleta | null, error }
  }

  async function atualizar(id: string, payload: Partial<Atleta>) {
    const { data, error } = await supabase
      .from('atletas')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('clube_id', getClubId())
      .select()
      .single()

    return { data: data as Atleta | null, error }
  }

  async function desativar(id: string) {
    return atualizar(id, { ativo: false })
  }

  async function listarTurmas(atleta_id: string) {
    const { data, error } = await supabase
      .from('atleta_turma')
      .select('*, turmas(*)')
      .eq('atleta_id', atleta_id)
      .eq('ativo', true)

    return { data, error }
  }

  async function vincularTurma(atleta_id: string, turma_id: string) {
    const { error } = await supabase
      .from('atleta_turma')
      .upsert({ atleta_id, turma_id, ativo: true })

    return { error }
  }

  async function desvincularTurma(atleta_id: string, turma_id: string) {
    const { error } = await supabase
      .from('atleta_turma')
      .update({ ativo: false })
      .eq('atleta_id', atleta_id)
      .eq('turma_id', turma_id)

    return { error }
  }

  return {
    listar,
    listarVinculosPorTurmas,
    buscarPorId,
    criar,
    atualizar,
    desativar,
    listarTurmas,
    vincularTurma,
    desvincularTurma,
  }
}
