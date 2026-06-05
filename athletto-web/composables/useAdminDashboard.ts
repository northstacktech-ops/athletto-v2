import type { AdminMetrics, AdminGraficoCrescimento, Indicacao, WebhookLog, Assinatura } from '~/types'

export function useAdminDashboard() {
  const supabase = useSupabaseClient()

  async function buscarMetricas(): Promise<{ data: AdminMetrics | null; error: Error | null }> {
    const { data, error } = await supabase.rpc('admin_metricas')
    return { data: data as AdminMetrics | null, error: error as Error | null }
  }

  async function buscarCrescimento(meses = 6): Promise<{
    data: AdminGraficoCrescimento[]
    error: Error | null
  }> {
    const { data, error } = await supabase.rpc('admin_crescimento', { p_meses: meses })
    return { data: (data as AdminGraficoCrescimento[]) ?? [], error: error as Error | null }
  }

  async function indicacoesPendentes(limite = 5): Promise<{
    data: Indicacao[]
    error: Error | null
  }> {
    const { data, error } = await supabase
      .from('indicacoes')
      .select('*, indicador:clube_indicador_id(*), indicado:clube_indicado_id(*)')
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false })
      .limit(limite)
    return { data: (data as Indicacao[]) ?? [], error: error as Error | null }
  }

  async function webhooksFalhos(limite = 5): Promise<{
    data: WebhookLog[]
    error: Error | null
  }> {
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('status', 'erro')
      .order('recebido_em', { ascending: false })
      .limit(limite)
    return { data: (data as WebhookLog[]) ?? [], error: error as Error | null }
  }

  async function trialsAVencer(diasJanela = 7): Promise<{
    data: Assinatura[]
    error: Error | null
  }> {
    const hoje = new Date().toISOString().slice(0, 10)
    const limite = new Date(Date.now() + diasJanela * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*, clube:clube_id(id, nome, slug, logo_url, plano)')
      .eq('status', 'trial')
      .gte('trial_fim', hoje)
      .lte('trial_fim', limite)
      .order('trial_fim')
    return { data: (data as Assinatura[]) ?? [], error: error as Error | null }
  }

  return {
    buscarMetricas,
    buscarCrescimento,
    indicacoesPendentes,
    webhooksFalhos,
    trialsAVencer,
  }
}
