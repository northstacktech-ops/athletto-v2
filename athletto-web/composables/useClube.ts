import type { Clube } from '~/types'

/**
 * CRUD do próprio clube logado + helpers de upload de logo.
 */
export function useClube() {
  const { clube, carregarPerfil } = useAuth()
  const supabase = useSupabaseClient()
  const { uploadToBucket } = useImageUpload()

  async function atualizar(patch: Partial<Clube>) {
    if (!clube.value) return { data: null, error: new Error('Sem clube no contexto') }

    const { data, error } = await supabase
      .from('clubes')
      .update({ ...patch, atualizado_em: new Date().toISOString() })
      .eq('id', clube.value.id)
      .select()
      .single()
    return { data: data as Clube | null, error }
  }

  /**
   * Sobe um arquivo de logo para o bucket `logos` e retorna a URL pública
   * com cache-bust. O caminho é fixo (`{clubeId}/logo.png`) para evitar
   * arquivos órfãos, e o cache-bust garante que o navegador re-baixe a
   * versão nova.
   */
  async function uploadLogo(file: File): Promise<{ url: string | null; error: Error | null }> {
    if (!clube.value) return { url: null, error: new Error('Sem clube no contexto') }
    const path = `${clube.value.id}/logo.png`
    return uploadToBucket('logos', path, file)
  }

  /**
   * Fluxo completo: upload + persistência no banco + recarga do perfil global.
   * É o que o componente `AvatarUploader` consome — depois disso o `useAuth().clube`
   * já está com a nova `logo_url`, então sidebar/menus atualizam sozinhos.
   */
  async function salvarLogo(file: File): Promise<{ url: string | null; error: Error | null }> {
    const { url, error } = await uploadLogo(file)
    if (error || !url) return { url: null, error: error ?? new Error('URL vazia após upload') }

    const { error: updErr } = await atualizar({ logo_url: url })
    if (updErr) return { url: null, error: updErr as unknown as Error }

    // Recarrega o perfil global para que topbar/sidebar/menus
    // reflitam a nova logo imediatamente.
    await carregarPerfil()
    return { url, error: null }
  }

  return { atualizar, uploadLogo, salvarLogo }
}
