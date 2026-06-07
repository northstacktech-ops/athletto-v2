import type { Turma } from '~/types'

export function useTurmas() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  async function listar(
    incluir_inativas = false,
    opts?: { limite?: number; offset?: number },
  ) {
    let query = supabase
      .from('turmas')
      .select('*, atleta_turma(count)')
      .eq('clube_id', getClubId())

    if (!incluir_inativas) query = query.eq('ativo', true)

    query = query.order('nome')
    if (opts?.limite != null) {
      const offset = opts.offset ?? 0
      query = query.range(offset, offset + opts.limite - 1)
    }

    const { data, error } = await query
    const mapeado = (data ?? []).map((t: any) => ({
      ...t,
      total_atletas: Number(t.atleta_turma?.[0]?.count ?? 0),
    }))
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

    return { data: data as Turma | null, error }
  }

  async function atualizar(id: string, payload: Partial<Turma>) {
    const { data, error } = await supabase
      .from('turmas')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('clube_id', getClubId())
      .select()
      .single()

    return { data: data as Turma | null, error }
  }

  async function desativar(id: string) {
    await supabase.from('atleta_turma').update({ ativo: false }).eq('turma_id', id)
    return atualizar(id, { ativo: false })
  }

  return { listar, buscarPorId, listarPorDia, criar, atualizar, desativar }
}
