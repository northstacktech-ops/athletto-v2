export interface SaqueHistorico {
  id: string
  valor: number
  tipo: 'pix' | 'ted'
  chave_pix: string | null
  banco: string | null
  status: 'pendente' | 'processando' | 'concluido' | 'recusado'
  solicitado_em: string
  processado_em: string | null
  ultimo_erro: string | null
}

export interface SaqueForm {
  valor: number
  tipo: 'pix' | 'ted'
  chave_pix?: string
  banco?: string
  agencia?: string
  conta?: string
  tipo_conta?: string
}

export function useCarteira() {
  const saldo = ref<number | null>(null)
  const subcontaAprovada = ref<boolean | null>(null)
  const erroSaldo = ref<string | null>(null)
  const carregandoSaldo = ref(false)

  const extrato = ref<any[]>([])
  const erroExtrato = ref<string | null>(null)
  const carregandoExtrato = ref(false)
  const paginaExtrato = ref(1)

  const saques = ref<SaqueHistorico[]>([])
  const carregandoSaques = ref(false)

  async function carregarSaldo() {
    carregandoSaldo.value = true
    erroSaldo.value = null
    try {
      const resp = await $fetch<any>('/api/clube/carteira/saldo')
      subcontaAprovada.value = resp.subconta_aprovada
      saldo.value = resp.saldo ?? null
      if (resp.erro) erroSaldo.value = resp.erro
    } catch (err: any) {
      erroSaldo.value = err?.data?.statusMessage ?? 'Erro ao carregar saldo.'
    } finally {
      carregandoSaldo.value = false
    }
  }

  async function carregarExtrato(pagina = 1) {
    carregandoExtrato.value = true
    erroExtrato.value = null
    paginaExtrato.value = pagina
    try {
      const resp = await $fetch<any>(`/api/clube/carteira/extrato?pagina=${pagina}`)
      extrato.value = resp.transacoes ?? []
      if (resp.erro) erroExtrato.value = resp.erro
    } catch (err: any) {
      erroExtrato.value = err?.data?.statusMessage ?? 'Extrato indisponível.'
      extrato.value = []
    } finally {
      carregandoExtrato.value = false
    }
  }

  async function carregarSaques() {
    carregandoSaques.value = true
    try {
      const resp = await $fetch<any>('/api/clube/carteira/saques')
      saques.value = resp.saques ?? []
    } catch {
      saques.value = []
    } finally {
      carregandoSaques.value = false
    }
  }

  async function enviarSaque(form: SaqueForm): Promise<{ ok: boolean; erro?: string }> {
    try {
      await $fetch('/api/clube/carteira/saque', { method: 'POST', body: form })
      return { ok: true }
    } catch (err: any) {
      return { ok: false, erro: err?.data?.statusMessage ?? 'Falha ao solicitar saque.' }
    }
  }

  return {
    saldo,
    subcontaAprovada,
    erroSaldo,
    carregandoSaldo,
    extrato,
    erroExtrato,
    carregandoExtrato,
    paginaExtrato,
    saques,
    carregandoSaques,
    carregarSaldo,
    carregarExtrato,
    carregarSaques,
    enviarSaque,
  }
}
