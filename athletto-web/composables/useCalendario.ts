import type { EventoCalendario, Turma } from '~/types'

export function useCalendario() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  async function turmasAtivas(): Promise<Turma[]> {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .eq('clube_id', getClubId())
      .eq('ativo', true)
    return (data ?? []) as Turma[]
  }

  async function listarPorMes(ano: number, mes: number) {
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim = new Date(ano, mes, 0).toISOString().slice(0, 10)

    // Eventos e turmas em paralelo (antes era sequencial = 2 round-trips em série).
    const [{ data, error }, turmas] = await Promise.all([
      supabase
        .from('eventos_calendario')
        .select('*')
        .eq('clube_id', getClubId())
        .gte('data_inicio', inicio)
        .lte('data_inicio', fim + 'T23:59:59')
        .order('data_inicio'),
      turmasAtivas(),
    ])

    const treinos = gerarTreinos(ano, mes, turmas)
    return {
      data: [...treinos, ...((data ?? []) as EventoCalendario[])] as EventoCalendario[],
      error,
    }
  }

  async function listarPorDia(data: string) {
    const [{ data: rows, error }, turmas] = await Promise.all([
      supabase
        .from('eventos_calendario')
        .select('*')
        .eq('clube_id', getClubId())
        .gte('data_inicio', `${data}T00:00:00`)
        .lte('data_inicio', `${data}T23:59:59`)
        .order('data_inicio'),
      turmasAtivas(),
    ])

    const diaSemana = diaSemanaLocal(data)
    const treinos = turmas
      .filter((t) => t.dias_semana?.includes(diaSemana))
      .map((t) => turmaParaEvento(t, data))

    return {
      data: [...treinos, ...((rows ?? []) as EventoCalendario[])] as EventoCalendario[],
      error,
    }
  }

  async function criar(payload: Omit<EventoCalendario, 'id' | 'criado_em' | 'criado_por'>) {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .insert({ ...payload, clube_id: getClubId(), criado_por: user.value?.id })
      .select()
      .single()

    return { data: data as EventoCalendario | null, error }
  }

  async function atualizar(id: string, payload: Partial<EventoCalendario>) {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .update(payload)
      .eq('id', id)
      .eq('clube_id', getClubId())
      .select()
      .single()

    return { data: data as EventoCalendario | null, error }
  }

  async function excluir(id: string) {
    const { error } = await supabase
      .from('eventos_calendario')
      .delete()
      .eq('id', id)
      .eq('clube_id', getClubId())

    return { error }
  }

  return { listarPorMes, listarPorDia, criar, atualizar, excluir }
}

/** Dia da semana de uma data 'YYYY-MM-DD' interpretada no fuso local (evita off-by-one em UTC-3). */
function diaSemanaLocal(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano!, (mes ?? 1) - 1, dia ?? 1).getDay()
}

function turmaParaEvento(turma: any, data: string): EventoCalendario {
  return {
    id: `treino-${turma.id}-${data}`,
    clube_id: turma.clube_id,
    titulo: turma.nome,
    descricao: turma.descricao ?? null,
    tipo: 'treino',
    data_inicio: `${data}T${turma.horario_inicio}`,
    data_fim: `${data}T${turma.horario_fim}`,
    turma_id: turma.id,
    turma_ids: [turma.id],
    criado_por: null,
    criado_em: '',
  }
}

function gerarTreinos(ano: number, mes: number, turmas: Turma[]): EventoCalendario[] {
  const treinos: EventoCalendario[] = []
  const diasNoMes = new Date(ano, mes, 0).getDate()

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const diaSemana = new Date(ano, mes - 1, dia).getDay()
    turmas.filter((t) => t.dias_semana?.includes(diaSemana)).forEach(
      (t) => treinos.push(turmaParaEvento(t, data)),
    )
  }

  return treinos
}
