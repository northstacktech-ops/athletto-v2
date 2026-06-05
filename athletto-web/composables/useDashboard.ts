import type { DashboardMetrics, GraficoFinanceiro } from '~/types'

export function useDashboard() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  async function buscarMetricas(): Promise<{
    data: DashboardMetrics | null
    error: Error | null
  }> {
    const { data, error } = await supabase.rpc('dashboard_metricas', {
      p_clube_id: getClubId(),
    })

    return { data: data as DashboardMetrics | null, error: error as Error | null }
  }

  async function buscarGrafico(meses = 6): Promise<{
    data: GraficoFinanceiro[]
    error: Error | null
  }> {
    const { data, error } = await supabase.rpc('grafico_financeiro', {
      p_clube_id: getClubId(),
      p_meses: meses,
    })

    return { data: (data as GraficoFinanceiro[]) ?? [], error: error as Error | null }
  }

  async function atletasRecentes(limite = 5) {
    const { data, error } = await supabase
      .from('atletas')
      .select('id, nome, apelido, foto_url, status, saude, criado_em')
      .eq('clube_id', getClubId())
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(limite)

    return { data, error }
  }

  async function turmasHoje() {
    const diaSemana = new Date().getDay()
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('clube_id', getClubId())
      .eq('ativo', true)
      .contains('dias_semana', [diaSemana])
      .order('horario_inicio')

    return { data, error }
  }

  async function alertasEvasao(limite = 10) {
    const { data, error } = await supabase
      .from('alertas_evasao')
      .select('*, atleta:atletas(id, nome, apelido, foto_url, telefone_responsavel), turma:turmas(id, nome)')
      .eq('clube_id', getClubId())
      .eq('dispensado', false)
      .order('data_deteccao', { ascending: false })
      .limit(limite)

    return { data, error }
  }

  return {
    buscarMetricas,
    buscarGrafico,
    atletasRecentes,
    turmasHoje,
    alertasEvasao,
  }
}
