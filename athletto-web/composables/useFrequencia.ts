import type { Frequencia, AlertaEvasao } from '~/types'

export function useFrequencia() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  async function buscarPorTurmaData(turma_id: string, data: string) {
    const { data: rows, error } = await supabase
      .from('frequencias')
      .select('*')
      .eq('clube_id', getClubId())
      .eq('turma_id', turma_id)
      .eq('data', data)

    return { data: rows as Frequencia[] | null, error }
  }

  async function historicoPorAtleta(atleta_id: string, de?: string, ate?: string) {
    let query = supabase
      .from('frequencias')
      .select('*')
      .eq('clube_id', getClubId())
      .eq('atleta_id', atleta_id)

    if (de) query = query.gte('data', de)
    if (ate) query = query.lte('data', ate)

    const { data, error } = await query.order('data', { ascending: false })
    return { data: data as Frequencia[] | null, error }
  }

  async function calcularPresenca(atleta_id: string, turma_id?: string) {
    let query = supabase
      .from('frequencias')
      .select('presente')
      .eq('clube_id', getClubId())
      .eq('atleta_id', atleta_id)

    if (turma_id) query = query.eq('turma_id', turma_id)

    const { data, error } = await query
    if (error || !data?.length) return { data: 0, error }
    return { data: Math.round((data.filter((f) => f.presente).length / data.length) * 100), error: null }
  }

  interface RegistroItem { atleta_id: string; presente: boolean }

  async function registrar(turma_id: string, data: string, registros: RegistroItem[]) {
    const gestorId = user.value?.id ?? null
    const rows = registros.map(({ atleta_id, presente }) => ({
      clube_id: getClubId(),
      turma_id,
      atleta_id,
      data,
      presente,
      registrado_por: gestorId,
    }))

    const { error } = await supabase
      .from('frequencias')
      .upsert(rows, { onConflict: 'turma_id,atleta_id,data' })

    return { error }
  }

  async function historicoPorTurma(turma_id: string, de?: string, ate?: string) {
    let query = supabase
      .from('frequencias')
      .select('*')
      .eq('clube_id', getClubId())
      .eq('turma_id', turma_id)

    if (de) query = query.gte('data', de)
    if (ate) query = query.lte('data', ate)

    const { data, error } = await query.order('data', { ascending: false })
    return { data: data as Frequencia[] | null, error }
  }

  async function atletasDaTurma(turma_id: string) {
    const { data, error } = await supabase
      .from('atleta_turma')
      .select('atletas(*)')
      .eq('turma_id', turma_id)
      .eq('ativo', true)
      .neq('atletas.status', 'afastado')
      .eq('atletas.ativo', true)

    return { data, error }
  }

  async function listarAlertas(incluir_dispensados = false) {
    let query = supabase
      .from('alertas_evasao')
      .select('*, atleta:atletas(*), turma:turmas(*)')
      .eq('clube_id', getClubId())

    if (!incluir_dispensados) query = query.eq('dispensado', false)

    const { data, error } = await query.order('data_deteccao', { ascending: false })
    return { data: data as AlertaEvasao[] | null, error }
  }

  async function dispensarAlerta(id: string) {
    const { error } = await supabase
      .from('alertas_evasao')
      .update({ dispensado: true, dispensado_por: user.value?.id, dispensado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('clube_id', getClubId())

    return { error }
  }

  async function ranking(limite = 20) {
    const { data, error } = await supabase.rpc('ranking_frequencia', {
      p_clube_id: getClubId(),
      p_limite: limite,
    })

    return { data, error }
  }

  return { buscarPorTurmaData, historicoPorAtleta, historicoPorTurma, calcularPresenca, registrar, atletasDaTurma, listarAlertas, dispensarAlerta, ranking }
}
