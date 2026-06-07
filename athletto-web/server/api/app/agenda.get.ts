import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'
import { gerarOcorrenciasTreino, type TurmaAgenda } from '~~/server/utils/treinos'

/**
 * GET /api/app/agenda  (auth)
 *
 * Agenda do atleta = TREINOS RECORRENTES das turmas do atleta (expandidos a
 * partir de turmas.dias_semana + horario_inicio/fim, igual ao painel do gestor)
 * MESCLADOS com os eventos pontuais de eventos_calendario relevantes:
 *  • atleta_ids contém o atleta_id; OU
 *  • turma_ids intersecta as turmas do atleta; OU
 *  • turma_id (legado) está entre as turmas do atleta; OU
 *  • evento "geral" (sem turma_id, turma_ids e atleta_ids vazios).
 *
 * Janela: de (hoje - 30 dias) até (hoje + 120 dias), ordenado por data_inicio asc.
 * → [{id,titulo,descricao,tipo,data_inicio,data_fim,local}]
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  // Turmas ativas do atleta — com a configuração de horário para gerar treinos.
  const { data: vinculos } = await supabase
    .from('atleta_turma')
    .select(
      'turma_id, turma:turmas(id, clube_id, nome, descricao, dias_semana, horario_inicio, horario_fim, local, ativo)',
    )
    .eq('atleta_id', sessao.atleta_id)
    .eq('ativo', true)

  const turmas: TurmaAgenda[] = []
  const turmasDoAtleta = new Set<string>()
  for (const v of vinculos ?? []) {
    const t = (v as any).turma
    if (t?.id) {
      turmasDoAtleta.add(t.id)
      if (t.ativo !== false) turmas.push(t as TurmaAgenda)
    } else if ((v as any).turma_id) {
      turmasDoAtleta.add((v as any).turma_id)
    }
  }

  // Janela temporal
  const hoje = new Date()
  const inicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fim = new Date(hoje.getTime() + 120 * 24 * 60 * 60 * 1000)

  // 1) Treinos recorrentes das turmas (mesma lógica do gestor)
  const treinos = gerarOcorrenciasTreino(turmas, inicio, fim)

  // 2) Eventos pontuais do clube na janela
  const { data: eventos, error } = await supabase
    .from('eventos_calendario')
    .select(
      'id, titulo, descricao, tipo, data_inicio, data_fim, local, turma_id, turma_ids, atleta_ids',
    )
    .eq('clube_id', sessao.clube_id)
    .gte('data_inicio', inicio.toISOString())
    .lte('data_inicio', fim.toISOString())
    .order('data_inicio', { ascending: true })

  if (error) {
    console.error('[app/agenda] erro:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar agenda.' })
  }

  const eventosRelevantes = (eventos ?? [])
    .filter((ev: any) => {
      const atletaIds: string[] = ev.atleta_ids ?? []
      const turmaIds: string[] = ev.turma_ids ?? []
      const turmaIdLegado: string | null = ev.turma_id ?? null

      if (atletaIds.includes(sessao.atleta_id)) return true
      if (turmaIds.some((t) => turmasDoAtleta.has(t))) return true
      if (turmaIdLegado && turmasDoAtleta.has(turmaIdLegado)) return true
      if (atletaIds.length === 0 && turmaIds.length === 0 && !turmaIdLegado) return true
      return false
    })
    .map((ev: any) => ({
      id: ev.id,
      titulo: ev.titulo,
      descricao: ev.descricao ?? null,
      tipo: ev.tipo,
      data_inicio: ev.data_inicio,
      data_fim: ev.data_fim ?? null,
      local: ev.local ?? null,
    }))

  // 3) Mescla treinos + eventos e ordena por data_inicio asc
  const tudo = [
    ...treinos.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      tipo: t.tipo,
      data_inicio: t.data_inicio,
      data_fim: t.data_fim,
      local: t.local,
    })),
    ...eventosRelevantes,
  ]

  tudo.sort((a, b) => String(a.data_inicio).localeCompare(String(b.data_inicio)))

  return tudo
})
