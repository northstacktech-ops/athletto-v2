import type { SuperAdmin } from '~/types'

/**
 * Autenticação e contexto do superadmin.
 * Lê a tabela `superadmins` no Supabase (RLS garante acesso só ao próprio registro/owners).
 */
export function useAdminAuth() {
  const superadmin = useState<SuperAdmin | null>('superadmin', () => null)
  const loading = useState('superadmin_loading', () => false)

  const isSuperAdmin = computed(() => !!superadmin.value && superadmin.value.ativo)
  const isOwner = computed(() => superadmin.value?.role === 'owner')

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function carregarSuperAdmin() {
    if (!user.value) {
      superadmin.value = null
      return
    }
    // Evita recargas redundantes quando já temos o registro do mesmo usuário
    if (superadmin.value && superadmin.value.id === user.value.id) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('superadmins')
        .select('*')
        .eq('id', user.value.id)
        .eq('ativo', true)
        .maybeSingle()
      if (error) throw error
      superadmin.value = (data as SuperAdmin | null) ?? null
    } catch (err) {
      console.error('Erro ao carregar superadmin:', err)
      superadmin.value = null
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    superadmin.value = null
    await navigateTo('/admin/login')
  }

  async function listarSuperadmins() {
    const { data, error } = await supabase.from('superadmins').select('*').order('nome')
    return { data: data as SuperAdmin[] | null, error }
  }

  return {
    superadmin: readonly(superadmin),
    isSuperAdmin,
    isOwner,
    loading: readonly(loading),
    carregarSuperAdmin,
    signOut,
    listarSuperadmins,
  }
}
