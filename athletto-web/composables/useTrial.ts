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
    if (trialCarregado.value) return
    const clubeId = gestor.value?.clube_id
    if (!clubeId) return

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
    }
  }

  return { isTrial, daysLeft, trialExpired, planoAtivo, carregarAssinatura }
}
