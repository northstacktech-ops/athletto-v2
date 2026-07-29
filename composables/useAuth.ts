import type { Gestor, Clube } from '~/types'

export function useAuth() {
  const gestor = useState<Gestor | null>('gestor', () => null)
  const clube = useState<Clube | null>('clube', () => null)
  const loading = ref(false)
  // Mantém o último erro de carregamento — usado em telas/middleware
  // para mostrar uma mensagem de fallback amigável.
  const loadError = useState<string | null>('auth_load_error', () => null)
  // Sinaliza que o usuário está autenticado mas ainda não criou seu gestor/clube
  // (estado esperado para usuário recém-cadastrado que precisa fazer onboarding).
  const perfilNaoEncontrado = useState<boolean>('auth_perfil_nao_encontrado', () => false)

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function carregarPerfil() {
    if (!user.value) return
    loading.value = true
    loadError.value = null
    perfilNaoEncontrado.value = false
    try {
      const { data: gestorData, error } = await supabase
        .from('gestores')
        .select('*, clubes(*)')
        .eq('id', user.value.id)
        .maybeSingle()

      if (error) throw error

      if (!gestorData) {
        // Não é um erro: usuário novo que ainda não concluiu o onboarding.
        gestor.value = null
        clube.value = null
        perfilNaoEncontrado.value = true
        loadError.value = null
        return
      }

      gestor.value = gestorData as Gestor
      clube.value = (gestorData as any).clubes as Clube
      loadError.value = null
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err)
      const msg = err?.message ?? 'Falha ao carregar perfil. Tente novamente.'
      loadError.value = msg
      try {
        const toast = useToast()
        toast.error('Falha ao carregar perfil', msg)
      } catch {
        // useToast indisponível em alguns contextos (SSR/teste)
      }
    } finally {
      loading.value = false
    }
  }

  // Permissão por módulo. Gestor principal tem acesso total. Adicional segue
  // o mapa `permissoes` ({ modulo: 'ver' | 'editar' }). 'editar' implica 'ver'.
  function temPermissao(modulo: string, nivel: 'ver' | 'editar' = 'ver') {
    const g = gestor.value
    if (!g) return false
    if (g.role === 'principal') return true
    const p = (g.permissoes ?? {})[modulo]
    if (!p) return false
    if (nivel === 'ver') return p === 'ver' || p === 'editar'
    return p === 'editar'
  }

  async function signOut() {
    await supabase.auth.signOut()
    gestor.value = null
    clube.value = null
    loadError.value = null
    perfilNaoEncontrado.value = false
    await navigateTo('/login')
  }

  return {
    user,
    gestor: readonly(gestor),
    clube: readonly(clube),
    loading: readonly(loading),
    loadError: readonly(loadError),
    perfilNaoEncontrado: readonly(perfilNaoEncontrado),
    carregarPerfil,
    temPermissao,
    signOut,
  }
}
