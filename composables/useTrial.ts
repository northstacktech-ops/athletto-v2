/**
 * Estado de trial do clube logado.
 * Lê assinaturas.trial_fim + assinaturas.status do Supabase.
 */
export function useTrial() {
  const { gestor } = useAuth()

  // Estado persistido para evitar re-fetch a cada componente
  const trialFim = useState<string | null>('trial_fim', () => null)
  const assinaturaStatus = useState<string | null>('assinatura_status', () => null)
  const trialCarregado = useState('trial_carregado', () => false)
  // Guarda o último clube carregado para invalidar o cache ao trocar de usuário/clube.
  const trialClubeId = useState<string | null>('trial_clube_id', () => null)

  const isTrial = computed(() => assinaturaStatus.value === 'trial')

  const daysLeft = computed(() => {
    if (!trialFim.value) return null
    const fim = new Date(trialFim.value).getTime()
    const remaining = fim - Date.now()
    if (remaining <= 0) return 0
    return Math.ceil(remaining / (24 * 60 * 60 * 1000))
  })

  const trialExpired = computed(
    () => daysLeft.value !== null && daysLeft.value <= 0,
  )

  const planoAtivo = computed(() =>
    assinaturaStatus.value !== 'suspensa'
    && assinaturaStatus.value !== 'cancelada',
  )

  async function carregarAssinatura() {
    const clubeId = gestor.value?.clube_id
    if (!clubeId) return

    // Recarrega se ainda não carregou OU se o clube mudou (troca de usuário).
    if (trialCarregado.value && trialClubeId.value === clubeId) return

    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('assinaturas')
      .select('status, trial_fim')
      .eq('clube_id', clubeId)
      .maybeSingle()

    if (data) {
      assinaturaStatus.value = data.status
      trialFim.value = data.trial_fim ?? null
      trialCarregado.value = true
      trialClubeId.value = clubeId
    }
  }

  return {
    isTrial,
    daysLeft,
    trialExpired,
    planoAtivo,
    // status bruto (trial | ativa | suspensa | cancelada) — usado pelo
    // middleware de plano para decidir o motivo do redirect sem re-consultar.
    status: readonly(assinaturaStatus),
    trialFim: readonly(trialFim),
    carregarAssinatura,
  }
}
