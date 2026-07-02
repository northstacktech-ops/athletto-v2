import { PLANO_LIMITES, nomePlano, type Clube, type Voucher } from '~/types'

/**
 * Limites do plano vs uso atual. Os vouchers ativos podem adicionar atletas
 * (futuro: outros tipos de cota também), por enquanto seu efeito principal é
 * estender prazo de trial — refletido no useTrial via assinatura.
 *
 * Retorna info para a UI decidir entre:
 *   - liberar a ação;
 *   - mostrar "X/Y" (perto do limite);
 *   - bloquear com mensagem "Você atingiu o limite — faça upgrade".
 */
export function usePlanoLimites() {
  const { clube } = useAuth()
  const supabase = useSupabaseClient()

  const limites = computed(() => {
    const plano = (clube.value?.plano ?? 'basico') as Clube['plano']
    return PLANO_LIMITES[plano]
  })

  async function vouchersAtivosDoClube(): Promise<Voucher[]> {
    if (!clube.value) return []
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .eq('clube_id', clube.value.id)
      .eq('status', 'ativo')
    return (data as Voucher[]) ?? []
  }

  function avaliar(uso: number, limite: number | null): {
    usado: number
    limite: number | null
    percentual: number
    podeCriar: boolean
    perto: boolean
    mensagem: string | null
  } {
    if (limite === null) {
      return { usado: uso, limite: null, percentual: 0, podeCriar: true, perto: false, mensagem: null }
    }
    const restante = limite - uso
    const percentual = limite > 0 ? Math.round((uso / limite) * 100) : 0
    return {
      usado: uso,
      limite,
      percentual,
      podeCriar: restante > 0,
      perto: restante <= Math.max(1, Math.ceil(limite * 0.1)) && restante > 0,
      mensagem: restante <= 0
        ? `Você atingiu o limite de ${limite} do plano ${nomePlano(clube.value?.plano)}. Faça upgrade para liberar mais.`
        : restante <= Math.max(1, Math.ceil(limite * 0.1))
          ? `Restam apenas ${restante} ${restante === 1 ? 'vaga' : 'vagas'} no plano atual.`
          : null,
    }
  }

  function avaliarAtletas(totalAtletasAtivos: number) {
    return avaliar(totalAtletasAtivos, limites.value.atletas)
  }
  function avaliarTurmas(totalTurmasAtivas: number) {
    return avaliar(totalTurmasAtivas, limites.value.turmas)
  }
  // Gestores: limite é TOTAL (inclui o principal), igual ao banco.
  function avaliarGestores(totalGestores: number) {
    return avaliar(totalGestores, limites.value.gestores)
  }

  return {
    limites,
    vouchersAtivosDoClube,
    avaliarAtletas,
    avaliarTurmas,
    avaliarGestores,
  }
}
