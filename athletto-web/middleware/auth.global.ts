const PUBLIC_ROUTES = ['/login', '/cadastro', '/verificar-codigo', '/recuperar-senha', '/nova-senha', '/onboarding', '/privacidade', '/termos', '/upgrade', '/admin/login']
const PUBLIC_PREFIXES = ['/cadastro/'] // /cadastro/[slug-do-clube]

function isPublic(path: string): boolean {
  if (PUBLIC_ROUTES.includes(path)) return true
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p))
}

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && !isPublic(to.path)) {
    return navigateTo('/login')
  }

  // Usuários logados não devem ficar parados nas páginas de auth
  if (user.value && PUBLIC_ROUTES.includes(to.path) && to.path !== '/onboarding') {
    return navigateTo('/')
  }
})
