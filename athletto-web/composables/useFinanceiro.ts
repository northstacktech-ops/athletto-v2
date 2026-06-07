import type {
  Planejamento,
  Caixinha,
  Cobranca,
  Transacao,
} from '~/types'

export function useFinanceiro() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  function getClubId() {
    return gestor.value?.clube_id ?? ''
  }

  async function listarPlanejamentos(status?: 'inativo' | 'ativo' | 'encerrado') {
    let query = supabase
      .from('planejamentos')
      .select('*')
      .eq('clube_id', getClubId())

    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('criado_em', { ascending: false })
    return { data: data as Planejamento[] | null, error }
  }

  async function criarPlanejamento(
    payload: Omit<Planejamento, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>,
  ) {
    const { data, error } = await supabase
      .from('planejamentos')
      .insert({ ...payload, clube_id: getClubId(), criado_por: user.value?.id })
      .select()
      .single()

    return { data: data as Planejamento | null, error }
  }

  async function atualizarPlanejamento(
    id: string,
    payload: Partial<Pick<Planejamento, 'nome' | 'descricao' | 'valor' | 'dia_vencimento' | 'data_vencimento' | 'periodicidade'>>,
  ) {
    const { data, error } = await supabase
      .from('planejamentos')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('clube_id', getClubId())
      .select()
      .single()

    return { data: data as Planejamento | null, error }
  }

  async function ativarPlanejamento(id: string) {
    // A ativação é feita pela server route que:
    //  1) chama o RPC ativar_planejamento
    //  2) gera Pix no AbacatePay em batch
    //  3) devolve contadores (cobrancasGeradas, pixCriados, erros[])
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const data = await $fetch(`/api/planejamentos/${id}/ativar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  async function encerrarPlanejamento(id: string) {
    const { error } = await supabase
      .from('planejamentos')
      .update({ status: 'encerrado', encerrado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('clube_id', getClubId())

    return { error }
  }

  async function excluirPlanejamento(id: string) {
    const { error } = await supabase
      .from('planejamentos')
      .delete()
      .eq('id', id)
      .eq('clube_id', getClubId())
      .eq('status', 'inativo')

    return { error }
  }

  async function listarAtletasPlanejamento(planejamento_id: string) {
    const { data, error } = await supabase
      .from('planejamento_atletas')
      .select('atleta_id, valor_customizado, isento, atletas(*)')
      .eq('planejamento_id', planejamento_id)

    return { data, error }
  }

  async function vincularAtletas(
    planejamento_id: string,
    atleta_ids: string[],
    customizacoes?: { atleta_id: string; valor_customizado: number | null; isento: boolean }[],
  ) {
    const rows = atleta_ids.map((atleta_id) => {
      const custom = customizacoes?.find((c) => c.atleta_id === atleta_id)
      return { planejamento_id, atleta_id, valor_customizado: custom?.valor_customizado ?? null, isento: custom?.isento ?? false }
    })
    const { error } = await supabase
      .from('planejamento_atletas')
      .upsert(rows, { onConflict: 'planejamento_id,atleta_id' })
    return { error }
  }

  async function listarCaixinhas() {
    const { data, error } = await supabase
      .from('caixinhas')
      .select('*, planejamentos(*)')
      .eq('clube_id', getClubId())
      .order('criada_em', { ascending: false })

    return { data: data as Caixinha[] | null, error }
  }

  async function buscarCaixinha(id: string) {
    const { data, error } = await supabase
      .from('caixinhas')
      .select('*, planejamentos(*)')
      .eq('id', id)
      .eq('clube_id', getClubId())
      .single()

    return { data: data as Caixinha | null, error }
  }

  async function encerrarCaixinha(id: string, cancelar_pendentes = true) {
    if (cancelar_pendentes) {
      await supabase
        .from('cobrancas')
        .update({ status: 'cancelado' })
        .eq('caixinha_id', id)
        .eq('status', 'pendente')
        .eq('clube_id', getClubId())
    }

    // `id` é o id da CAIXINHA. Buscamos o planejamento vinculado para encerrá-lo.
    const { data: caixinha, error: caixinhaErr } = await supabase
      .from('caixinhas')
      .select('planejamento_id')
      .eq('id', id)
      .eq('clube_id', getClubId())
      .single()

    if (caixinhaErr) return { error: caixinhaErr }
    const planejamentoId = (caixinha as any)?.planejamento_id
    if (!planejamentoId) return { error: null }

    const { error } = await supabase
      .from('planejamentos')
      .update({ status: 'encerrado', encerrado_em: new Date().toISOString() })
      .eq('id', planejamentoId)
      .eq('clube_id', getClubId())

    return { error }
  }

  async function listarCobranças(filtros?: {
    caixinha_id?: string
    status?: string
    atleta_id?: string
    limite?: number
    offset?: number
  }) {
    let query = supabase
      .from('cobrancas')
      .select('*, atleta:atletas(id, nome, apelido, foto_url, telefone_responsavel), caixinha:caixinhas(id, nome)')
      .eq('clube_id', getClubId())

    if (filtros?.caixinha_id) query = query.eq('caixinha_id', filtros.caixinha_id)
    if (filtros?.status) query = query.eq('status', filtros.status)
    if (filtros?.atleta_id) query = query.eq('atleta_id', filtros.atleta_id)

    query = query.order('data_vencimento')
    if (filtros?.limite != null) {
      const offset = filtros.offset ?? 0
      query = query.range(offset, offset + filtros.limite - 1)
    }

    const { data, error } = await query
    return { data: data as Cobranca[] | null, error }
  }

  async function marcarComoPago(id: string) {
    const { error } = await supabase.rpc('marcar_cobranca_paga', {
      p_cobranca_id: id,
      p_gestor_id: user.value?.id,
    })

    return { error }
  }

  async function regenerarLink(id: string) {
    // Limpa o link antigo no banco e dispara nova criação via AbacatePay
    const { error: rpcErr } = await supabase.rpc('regenerar_link_pix', { p_cobranca_id: id })
    if (rpcErr) return { error: rpcErr }

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      await $fetch(`/api/cobrancas/${id}/pix`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  async function listarTransacoes(filtros?: {
    tipo?: 'entrada' | 'saida'
    de?: string
    ate?: string
    caixinha_id?: string
  }) {
    let query = supabase
      .from('transacoes')
      .select('*, atletas(nome), caixinhas(nome)')
      .eq('clube_id', getClubId())

    if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
    if (filtros?.de) query = query.gte('data', filtros.de)
    if (filtros?.ate) query = query.lte('data', filtros.ate)
    if (filtros?.caixinha_id) query = query.eq('caixinha_id', filtros.caixinha_id)

    const { data, error } = await query.order('data', { ascending: false })
    return { data: data as Transacao[] | null, error }
  }

  async function registrarEntrada(payload: {
    valor: number
    data: string
    descricao?: string
    cobranca_id?: string
    caixinha_id?: string
    atleta_id?: string
  }) {
    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...payload, clube_id: getClubId(), tipo: 'entrada', origem: 'manual', registrado_por: user.value?.id })
      .select()
      .single()

    return { data: data as Transacao | null, error }
  }

  async function registrarSaida(payload: {
    valor: number
    data: string
    categoria: string
    descricao?: string
  }) {
    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...payload, clube_id: getClubId(), tipo: 'saida', origem: 'manual', registrado_por: user.value?.id })
      .select()
      .single()

    return { data: data as Transacao | null, error }
  }

  async function transferirEntreCaixinhas(payload: {
    origem_caixinha_id: string
    destino_caixinha_id: string
    valor: number
    data: string
    descricao?: string
  }) {
    if (payload.origem_caixinha_id === payload.destino_caixinha_id) {
      return { error: new Error('Caixinha de origem e destino não podem ser iguais') }
    }
    const descBase = payload.descricao || 'Transferência entre caixinhas'
    const { error: errSaida } = await registrarSaida({
      valor: payload.valor,
      data: payload.data,
      categoria: 'Transferência',
      descricao: `${descBase} (saída)`,
    })
    if (errSaida) return { error: errSaida }
    const { error: errEntrada } = await registrarEntrada({
      valor: payload.valor,
      data: payload.data,
      descricao: `${descBase} (entrada)`,
      caixinha_id: payload.destino_caixinha_id,
    })
    return { error: errEntrada }
  }

  return {
    listarPlanejamentos,
    criarPlanejamento,
    atualizarPlanejamento,
    ativarPlanejamento,
    encerrarPlanejamento,
    excluirPlanejamento,
    listarAtletasPlanejamento,
    vincularAtletas,
    listarCaixinhas,
    buscarCaixinha,
    encerrarCaixinha,
    listarCobranças,
    marcarComoPago,
    regenerarLink,
    listarTransacoes,
    registrarEntrada,
    registrarSaida,
    transferirEntreCaixinhas,
  }
}
