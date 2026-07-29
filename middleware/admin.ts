/**
 * Middleware admin — protege todas as rotas /admin/*.
 *
 * Regras:
 *  - Exige user autenticado no Supabase E presente na tabela `superadmins` ativa.
 *  - Não-superadmin (ou não autenticado) é redirecionado para /admin/login.
 *  - Popula o estado do useAdminAuth para layout/pages não recarregarem em duplicata
 *    (evita falsos-negativos de isSuperAdmin/isOwner).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // A própria página /admin/login não precisa proteger-se (caso contrário, loop)
  if (to.path === '/admin/login') return

  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  const { superadmin, carregarSuperAdmin } = useAdminAuth()
  await carregarSuperAdmin()

  if (!superadmin.value || !superadmin.value.ativo) {
    return navigateTo('/admin/login?denied=1')
  }
})
