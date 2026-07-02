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
    limite?: number
    offset?: number
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

    query = query.order('nome')

    // Paginação opcional (retrocompatível: sem os params traz tudo)
    if (filtros?.limite != null) {
      const offset = filtros.offset ?? 0
      query = query.range(offset, offset + filtros.limite - 1)
    }

    const { data, error } = await query
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

  // Só o `turma_id` é usado em todo o app (os 3 call-sites filtram a lista
  // de turmas já carregada por esse ID) — o join `turmas(*)` inteiro nunca
  // era lido, só pesava a resposta.
  async function listarTurmas(atleta_id: string) {
    const { data, error } = await supabase
      .from('atleta_turma')
      .select('turma_id')
      .eq('atleta_id', atleta_id)
      .eq('ativo', true)

    return { data, error }
  }

  // Vínculos alteram a contagem de atletas por turma → invalida o cache de turmas.
  function invalidarCacheTurmas() {
    useState<Record<string, unknown>>('turmas_cache', () => ({})).value = {}
  }

  async function vincularTurma(atleta_id: string, turma_id: string) {
    // onConflict explícito na PK composta: se já existir um vínculo (mesmo
    // inativo, de um desvincular anterior), ele é reativado em vez de gerar
    // erro de chave duplicada.
    const { error } = await supabase
      .from('atleta_turma')
      .upsert({ atleta_id, turma_id, ativo: true }, { onConflict: 'atleta_id,turma_id' })

    if (!error) invalidarCacheTurmas()
    return { error }
  }

  async function desvincularTurma(atleta_id: string, turma_id: string) {
    const { error } = await supabase
      .from('atleta_turma')
      .update({ ativo: false })
      .eq('atleta_id', atleta_id)
      .eq('turma_id', turma_id)

    if (!error) invalidarCacheTurmas()
    return { error }
  }

  // Total de atletas ativos (count exato no servidor) — usado p/ avaliar o
  // limite do plano sem depender da página carregada na lista.
  async function contarAtivos(): Promise<number> {
    const { count } = await supabase
      .from('atletas')
      .select('id', { count: 'exact', head: true })
      .eq('clube_id', getClubId())
      .eq('ativo', true)
    return count ?? 0
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
    contarAtivos,
  }
}
