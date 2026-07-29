/**
 * Middleware de plano — bloqueia acesso a rotas do app quando:
 *   • Trial expirado → redireciona para /upgrade?motivo=trial_expirado
 *   • Plano suspenso → redireciona para /upgrade?motivo=suspensa
 *   • Plano cancelado → redireciona para /upgrade?motivo=cancelada
 *
 * Não se aplica a: /upgrade, /login, /admin/*, /onboarding, páginas públicas.
 */

const BYPASS = ['/upgrade', '/login', '/onboarding', '/privacidade', '/termos', '/suporte']
const BYPASS_PREFIX = ['/admin', '/cadastro/']

function isBypassed(path: string) {
  if (BYPASS.includes(path)) return true
  return BYPASS_PREFIX.some((p) => path.startsWith(p))
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (isBypassed(to.path)) return

  const user = useSupabaseUser()
  if (!user.value) return // auth.global.ts já trata este caso

  const { gestor } = useAuth()
  if (!gestor.value?.clube_id) return

  // Usa o estado em cache do useTrial (busca no Supabase apenas 1x por clube)
  // em vez de consultar `assinaturas` a CADA navegação — isso bloqueava a troca
  // de tela com um round-trip de ~150-200ms toda vez.
  const trial = useTrial()
  await trial.carregarAssinatura()

  const status = trial.status.value
  if (status === 'suspensa') return navigateTo('/upgrade?motivo=suspensa')
  if (status === 'cancelada') return navigateTo('/upgrade?motivo=cancelada')
  if (status === 'trial' && trial.trialExpired.value) {
    return navigateTo('/upgrade?motivo=trial_expirado')
  }
})
