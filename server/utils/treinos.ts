/**
 * Geração de ocorrências de treino recorrente a partir da configuração da turma
 * (turmas.dias_semana + horario_inicio/horario_fim).
 *
 * Espelha EXATAMENTE a lógica do painel do gestor (composables/useCalendario.ts:
 * diaSemanaLocal + turmaParaEvento + gerarTreinos), para que o app do atleta
 * mostre os mesmos treinos. Convenção de dias_semana = Date.getDay()
 * (0=domingo, 1=segunda, …, 6=sábado).
 */

export interface TurmaAgenda {
  id: string
  clube_id?: string | null
  nome: string
  descricao?: string | null
  dias_semana?: number[] | null
  horario_inicio?: string | null // "HH:MM[:SS]"
  horario_fim?: string | null
  local?: string | null
  ativo?: boolean | null
}

export interface OcorrenciaTreino {
  id: string
  titulo: string
  descricao: string | null
  tipo: 'treino'
  data_inicio: string // "YYYY-MM-DDTHH:MM:SS" (local, sem timezone — igual ao gestor)
  data_fim: string | null
  local: string | null
  turma_id: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Expande as turmas em ocorrências de treino dentro da janela [inicio, fim]
 * (datas inclusivas). Ignora turmas inativas ou sem horário/dias configurados.
 */
export function gerarOcorrenciasTreino(
  turmas: TurmaAgenda[],
  inicio: Date,
  fim: Date,
): OcorrenciaTreino[] {
  const ocorrencias: OcorrenciaTreino[] = []

  // Normaliza para meia-noite local para iterar dia a dia com segurança.
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  const ultimo = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())

  while (cursor <= ultimo) {
    const data = ymd(cursor)
    const diaSemana = cursor.getDay()

    for (const t of turmas) {
      if (t.ativo === false) continue
      if (!t.horario_inicio) continue
      const dias = t.dias_semana ?? []
      if (!dias.includes(diaSemana)) continue

      ocorrencias.push({
        id: `treino-${t.id}-${data}`,
        titulo: t.nome,
        descricao: t.descricao ?? null,
        tipo: 'treino',
        data_inicio: `${data}T${t.horario_inicio}`,
        data_fim: t.horario_fim ? `${data}T${t.horario_fim}` : null,
        local: t.local ?? null,
        turma_id: t.id,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return ocorrencias
}
