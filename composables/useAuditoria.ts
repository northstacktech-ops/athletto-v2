import type { LogAuditoria, AuditoriaAcao } from '~/types'

export function useAuditoria() {
  const supabase = useSupabaseClient()

  async function listar(filtros?: {
    acao?: AuditoriaAcao
    entidade?: string
    superadmin_id?: string
    desde?: string
    ate?: string
  }) {
    let query = supabase
      .from('logs_auditoria')
      .select('*, superadmin:superadmin_id(id, nome, foto_url)')
    if (filtros?.acao) query = query.eq('acao', filtros.acao)
    if (filtros?.entidade) query = query.eq('entidade', filtros.entidade)
    if (filtros?.superadmin_id) query = query.eq('superadmin_id', filtros.superadmin_id)
    if (filtros?.desde) query = query.gte('criado_em', filtros.desde)
    if (filtros?.ate) query = query.lte('criado_em', filtros.ate)
    const { data, error } = await query.order('criado_em', { ascending: false }).limit(500)
    return { data: data as LogAuditoria[] | null, error }
  }

  /** Registra ação de superadmin no audit log. */
  async function registrar(payload: {
    acao: AuditoriaAcao
    entidade: string
    entidade_id?: string | null
    detalhes?: Record<string, unknown>
  }) {
    const { data, error } = await supabase.from('logs_auditoria').insert({
      acao: payload.acao,
      entidade: payload.entidade,
      entidade_id: payload.entidade_id ?? null,
      detalhes: payload.detalhes ?? {},
      user_agent: process.client ? navigator.userAgent : null,
    }).select().single()
    return { data, error }
  }

  return { listar, registrar }
}
