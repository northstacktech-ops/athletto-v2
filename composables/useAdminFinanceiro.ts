import type { MovimentacaoFinanceiraSistema, SistemaMovTipo, WebhookLog } from '~/types'

export function useAdminFinanceiro() {
  const supabase = useSupabaseClient()

  async function listarMovimentacoes(filtros?: {
    tipo?: SistemaMovTipo
    clube_id?: string
    desde?: string
    ate?: string
  }) {
    let query = supabase
      .from('movimentacoes_sistema')
      .select('*, clube:clube_id(id, nome, slug)')
    if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
    if (filtros?.clube_id) query = query.eq('clube_id', filtros.clube_id)
    if (filtros?.desde) query = query.gte('data', filtros.desde)
    if (filtros?.ate) query = query.lte('data', filtros.ate)
    const { data, error } = await query.order('data', { ascending: false })
    return { data: data as MovimentacaoFinanceiraSistema[] | null, error }
  }

  async function registrar(payload: {
    tipo: SistemaMovTipo
    valor: number
    descricao: string
    data: string
    clube_id?: string | null
    assinatura_id?: string | null
    payment_id?: string | null
  }) {
    const { data, error } = await supabase
      .from('movimentacoes_sistema')
      .insert(payload)
      .select()
      .single()
    return { data, error }
  }

  async function resumoFinanceiro(mes?: string) {
    const referencia = mes ?? new Date().toISOString().slice(0, 7)
    const inicio = `${referencia}-01`
    const fim = `${referencia}-31`

    const { data: movs } = await listarMovimentacoes({ desde: inicio, ate: fim })
    const lista = movs ?? []

    const receita = lista
      .filter((m) => m.tipo === 'mensalidade_recebida')
      .reduce((s, m) => s + m.valor, 0)
    const taxas = lista
      .filter((m) => m.tipo === 'taxa_gateway')
      .reduce((s, m) => s + m.valor, 0)
    const reembolsos = lista
      .filter((m) => m.tipo === 'reembolso')
      .reduce((s, m) => s + m.valor, 0)
    const despesas = lista
      .filter((m) => m.tipo === 'despesa_operacional')
      .reduce((s, m) => s + m.valor, 0)
    const liquido = receita - taxas - reembolsos - despesas

    return { receita, taxas, reembolsos, despesas, liquido }
  }

  async function listarWebhooks(filtros?: { status?: WebhookLog['status'] }) {
    let query = supabase.from('webhook_logs').select('*')
    if (filtros?.status) query = query.eq('status', filtros.status)
    const { data, error } = await query.order('recebido_em', { ascending: false })
    return { data: data as WebhookLog[] | null, error }
  }

  return { listarMovimentacoes, registrar, resumoFinanceiro, listarWebhooks }
}
