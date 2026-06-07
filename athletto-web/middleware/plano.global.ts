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

  const supabase = useSupabaseClient()
  const { gestor } = useAuth()
  const clubeId = gestor.value?.clube_id
  if (!clubeId) return

  const { data: assin } = await supabase
    .from('assinaturas')
    .select('status, trial_fim')
    .eq('clube_id', clubeId)
    .maybeSingle()

  if (!assin) return

  if (assin.status === 'suspensa') {
    return navigateTo('/upgrade?motivo=suspensa')
  }

  if (assin.status === 'cancelada') {
    return navigateTo('/upgrade?motivo=cancelada')
  }

  if (assin.status === 'trial' && assin.trial_fim) {
    const expired = new Date(assin.trial_fim) < new Date()
    if (expired) {
      return navigateTo('/upgrade?motivo=trial_expirado')
    }
  }
})
