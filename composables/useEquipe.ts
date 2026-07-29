import type { Gestor } from '~/types'

export interface LogGestao {
  id: string
  clube_id: string
  gestor_id: string | null
  gestor_nome: string | null
  acao: string
  entidade: string | null
  entidade_id: string | null
  dados: Record<string, unknown> | null
  criado_em: string
}

export function useEquipe() {
  const { gestor } = useAuth()
  const supabase = useSupabaseClient()

  function clubeId() {
    return gestor.value?.clube_id ?? ''
  }

  async function token() {
    let session = (await supabase.auth.getSession()).data.session
    // getSession() não força refresh; se vier vazio, tenta renovar antes de
    // desistir (o endpoint ainda tem fallback por cookie no servidor).
    if (!session?.access_token) {
      session = (await supabase.auth.refreshSession()).data.session
    }
    return session?.access_token ?? ''
  }

  async function listarGestores() {
    const { data, error } = await supabase
      .from('gestores')
      .select('*')
      .eq('clube_id', clubeId())
      .order('role', { ascending: true })
      .order('criado_em', { ascending: true })
    return { data: data as Gestor[] | null, error }
  }

  async function convidar(payload: { email: string; nome: string; permissoes: Record<string, string> }) {
    try {
      const t = await token()
      const data = await $fetch('/api/gestores/convidar', {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: payload,
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err?.data?.statusMessage ?? err?.message ?? 'Falha ao convidar' }
    }
  }

  async function remover(gestor_id: string) {
    try {
      const t = await token()
      await $fetch('/api/gestores/remover', {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: { gestor_id },
      })
      return { error: null }
    } catch (err: any) {
      return { error: err?.data?.statusMessage ?? err?.message ?? 'Falha ao remover' }
    }
  }

  async function listarLogs(limite = 50) {
    const { data, error } = await supabase
      .from('logs_gestao')
      .select('*')
      .eq('clube_id', clubeId())
      .order('criado_em', { ascending: false })
      .limit(limite)
    return { data: data as LogGestao[] | null, error }
  }

  // Registra uma ação no log de gestão (chamado pela UI em ações relevantes).
  async function registrarLog(acao: string, entidade?: string, entidade_id?: string, dados?: Record<string, unknown>) {
    await supabase.from('logs_gestao').insert({
      clube_id: clubeId(),
      gestor_id: gestor.value?.id ?? null,
      gestor_nome: gestor.value?.nome ?? null,
      acao,
      entidade: entidade ?? null,
      entidade_id: entidade_id ?? null,
      dados: dados ?? null,
    })
  }

  // ── ValidaPay (cada clube = subconta; recebe direto) ──────────────────────
  async function statusValidapay() {
    const { data, error } = await supabase
      .from('clube_validapay')
      .select('status, account_number, tipo, document_number, ultimo_erro, atualizado_em')
      .eq('clube_id', clubeId())
      .maybeSingle()
    return { data: data as { status: string; account_number: string | null; tipo: string; document_number: string | null; ultimo_erro: string | null; atualizado_em: string } | null, error }
  }

  async function criarSubcontaValidapay(payload: { tipo: 'pf' | 'pj'; dados: Record<string, unknown> }) {
    try {
      const t = await token()
      const data = await $fetch('/api/clube/validapay-subconta', {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: payload,
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err?.data?.statusMessage ?? err?.message ?? 'Falha ao criar subconta' }
    }
  }

  // Consulta a ValidaPay o status real da subconta e atualiza o banco.
  async function verificarStatusValidapay() {
    try {
      const t = await token()
      const data = await $fetch('/api/clube/validapay-status', {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err?.data?.statusMessage ?? err?.message ?? 'Falha ao consultar status' }
    }
  }

  // Gera o Pix da assinatura do clube (paga o Athletto, conta Master).
  // cpf: fallback se o gestor não tiver CPF no perfil (coletado no checkout).
  async function gerarPixAssinatura(plano: string, cpf?: string) {
    try {
      const t = await token()
      const data = await $fetch('/api/clube/assinatura-pix', {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: { plano, ...(cpf ? { cpf } : {}) },
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err?.data?.statusMessage ?? err?.message ?? 'Falha ao gerar Pix' }
    }
  }

  // Lê a assinatura do clube (para acompanhar a confirmação do pagamento).
  async function lerAssinatura() {
    const { data } = await supabase
      .from('assinaturas')
      .select('status, plano, proxima_cobranca, validapay_charge_id, plano_pendente')
      .eq('clube_id', clubeId())
      .maybeSingle()
    return data as { status: string; plano: string; proxima_cobranca: string | null; validapay_charge_id: string | null; plano_pendente: string | null } | null
  }

  return {
    listarGestores, convidar, remover, listarLogs, registrarLog,
    statusValidapay, criarSubcontaValidapay, verificarStatusValidapay,
    gerarPixAssinatura, lerAssinatura,
  }
}
