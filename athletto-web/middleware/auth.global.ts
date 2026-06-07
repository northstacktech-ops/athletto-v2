const PUBLIC_ROUTES = ['/login', '/cadastro', '/verificar-codigo', '/recuperar-senha', '/nova-senha', '/onboarding', '/privacidade', '/termos', '/suporte', '/upgrade', '/admin/login']
const PUBLIC_PREFIXES = ['/cadastro/'] // /cadastro/[slug-do-clube]

// Páginas informativas: públicas, mas também acessíveis por usuários logados
// (linkadas no painel). Não devem redirecionar quem já está autenticado.
const INFO_ROUTES = ['/privacidade', '/termos', '/suporte']

function isPublic(path: string): boolean {
  if (PUBLIC_ROUTES.includes(path)) return true
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p))
}

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && !isPublic(to.path)) {
    return navigateTo('/login')
  }

  // Usuários logados não devem ficar parados nas páginas de auth — exceto
  // onboarding e páginas informativas (privacidade/termos/suporte).
  if (
    user.value &&
    PUBLIC_ROUTES.includes(to.path) &&
    to.path !== '/onboarding' &&
    !INFO_ROUTES.includes(to.path)
  ) {
    return navigateTo('/')
  }
})
