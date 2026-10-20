const PUBLIC_ROUTES = ['/login', '/cadastro', '/primeiro-acesso', '/verificar-codigo', '/recuperar-senha', '/nova-senha', '/onboarding', '/privacidade', '/termos', '/suporte', '/upgrade', '/admin/login']
const PUBLIC_PREFIXES = ['/cadastro/'] // /cadastro/[slug-do-clube]

// Páginas informativas: públicas, mas também acessíveis por usuários logados
// (linkadas no painel). Não devem redirecionar quem já está autenticado.
const INFO_ROUTES = ['/privacidade', '/termos', '/suporte']

// Destino do middleware de plano (trial expirado/suspenso/cancelado) para
// usuários JÁ autenticados — não pode redirecionar de volta pra "/", ou forma
// loop infinito com plano.global.ts (que manda pra cá exatamente por causa do
// usuário estar logado). Mesmo motivo do /onboarding ficar de fora da regra.
// /nova-senha: o código de recuperação já cria a sessão, e a pessoa precisa
// chegar nessa tela logada para definir a nova senha.
const ROTAS_LOGADO_PERMITIDAS = ['/onboarding', '/upgrade', '/nova-senha', ...INFO_ROUTES]

function isPublic(path: string): boolean {
  if (PUBLIC_ROUTES.includes(path)) return true
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p))
}

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && !isPublic(to.path)) {
    return navigateTo('/login')
  }

  // Recuperação de senha: quem validou o código está logado, mas só sai da tela
  // de nova senha depois de salvá-la. O cookie guarda o id do usuário para não
  // travar outra conta que logue depois com um cookie antigo.
  const recuperacao = useCookie<string | null>('athletto_recovery')
  if (user.value && recuperacao.value && recuperacao.value === user.value.id && to.path !== '/nova-senha') {
    return navigateTo('/nova-senha')
  }

  // Usuários logados não devem ficar parados nas páginas de auth — exceto
  // onboarding, upgrade (trial/plano expirado) e páginas informativas.
  if (
    user.value &&
    PUBLIC_ROUTES.includes(to.path) &&
    !ROTAS_LOGADO_PERMITIDAS.includes(to.path)
  ) {
    return navigateTo('/')
  }
})
