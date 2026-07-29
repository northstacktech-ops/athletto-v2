import type { Turma } from '~/types'

export function useTurmas() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()

  // Cache da lista completa (não paginada) entre navegações — turmas mudam pouco
  // e a lista é lida em Atletas/Frequência/Calendário/Turmas. Invalidado em
  // qualquer mutação de turma e nos vínculos atleta⇄turma (que alteram a contagem).
  const cache = useState<Record<string, (Turma & { total_atletas: number })[]>>('turmas_cache', () => ({}))

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  function invalidarCache() {
    cache.value = {}
  }

  async function listar(
    incluir_inativas = false,
    opts?: { limite?: number; offset?: number },
  ) {
    const paginado = opts?.limite != null
    const chave = `${getClubId()}:${incluir_inativas}`
    // Só a lista completa é cacheada (paginação sempre busca fresco).
    if (!paginado && cache.value[chave]) {
      return { data: cache.value[chave], error: null }
    }

    let query = supabase
      .from('turmas')
      .select('*, atleta_turma(count)')
      .eq('clube_id', getClubId())

    if (!incluir_inativas) query = query.eq('ativo', true)

    query = query.order('nome')
    if (paginado) {
      const offset = opts!.offset ?? 0
      query = query.range(offset, offset + opts!.limite! - 1)
    }

    const { data, error } = await query
    const mapeado = (data ?? []).map((t: any) => ({
      ...t,
      total_atletas: Number(t.atleta_turma?.[0]?.count ?? 0),
    }))
    if (!paginado && !error) cache.value[chave] = mapeado as (Turma & { total_atletas: number })[]
    return { data: mapeado as (Turma & { total_atletas: number })[], error }
  }

  async function buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .eq('clube_id', getClubId())
      .single()

    return { data: data as Turma | null, error }
  }

  async function listarPorDia(diaSemana: number) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('clube_id', getClubId())
      .eq('ativo', true)
      .contains('dias_semana', [diaSemana])
      .order('horario_inicio')

    return { data: data as Turma[] | null, error }
  }

  async function criar(payload: Omit<Turma, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('turmas')
      .insert({ ...payload, clube_id: getClubId() })
      .select()
      .single()

    if (error || !data) return { data: data as Turma | null, error, mensalidadeError: null }

    invalidarCache()

    // Mensalidade nasce junto com a turma. Não bloqueia a criação se falhar
    // (a turma já existe) — o chamador decide como avisar o gestor.
    const { error: mensalidadeError } = await supabase.rpc('criar_planejamento_mensalidade_turma', {
      p_turma_id: data.id,
    })

    return { data: data as Turma, error: null, mensalidadeError }
  }

  async function atualizar(id: string, payload: Partial<Turma>) {
    const { data, error } = await supabase
      .from('turmas')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('clube_id', getClubId())
      .select()
      .single()

    if (!error) invalidarCache()
    return { data: data as Turma | null, error }
  }

  async function desativar(id: string) {
    await supabase.from('atleta_turma').update({ ativo: false }).eq('turma_id', id)

    // Encerra a mensalidade vinculada (se existir): cancela cobranças
    // pendentes futuras e marca o planejamento como encerrado — mesma regra
    // de useFinanceiro().encerrarCaixinha, resolvida aqui a partir da turma
    // (o encerramento da caixinha de mensalidade é consequência de desativar
    // a turma, não uma ação solta em Financeiro).
    const { data: planejamento } = await supabase
      .from('planejamentos')
      .select('id')
      .eq('turma_id', id)
      .eq('status', 'ativo')
      .maybeSingle()

    if (planejamento) {
      const { data: caixinha } = await supabase
        .from('caixinhas')
        .select('id')
        .eq('planejamento_id', planejamento.id)
        .maybeSingle()

      if (caixinha) {
        await supabase
          .from('cobrancas')
          .update({ status: 'cancelado' })
          .eq('caixinha_id', caixinha.id)
          .eq('status', 'pendente')
      }

      await supabase
        .from('planejamentos')
        .update({ status: 'encerrado', encerrado_em: new Date().toISOString() })
        .eq('id', planejamento.id)
    }

    return atualizar(id, { ativo: false })
  }

  return { listar, buscarPorId, listarPorDia, criar, atualizar, desativar, invalidarCache }
}
