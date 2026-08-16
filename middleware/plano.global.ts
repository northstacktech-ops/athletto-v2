/**
 * Middleware de plano — não redireciona mais (isso causava o loop /  ↔
 * /upgrade quando o trial vencia: /upgrade estava na lista de páginas
 * "de auth" do auth.global.ts, que mandava de volta pra / o usuário logado).
 * O bloqueio de trial/plano vencido agora é o modal `LayoutPlanoBloqueadoModal`
 * (renderizado em layouts/default.vue), não uma rota.
 *
 * Este middleware só garante que o estado de trial já esteja carregado o mais
 * cedo possível (antes do 1º paint), evitando o modal "piscar" fechado por um
 * instante em hard reload — layouts/default.vue também chama
 * carregarAssinatura() no onMounted, então isso aqui é redundante na maioria
 * das navegações client-side (a guarda em useTrial() evita refetch).
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

  const trial = useTrial()
  await trial.carregarAssinatura()
})
