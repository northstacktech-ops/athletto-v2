import type { Gestor } from '~/types'

/**
 * Operações sobre o próprio gestor logado (foto, dados pessoais).
 */
export function useGestor() {
  const { gestor, user, carregarPerfil } = useAuth()
  const supabase = useSupabaseClient()
  const { uploadToBucket } = useImageUpload()

  async function atualizar(patch: Partial<Gestor>) {
    if (!gestor.value) return { data: null, error: new Error('Sem gestor no contexto') }

    const { data, error } = await supabase
      .from('gestores')
      .update({ ...patch, atualizado_em: new Date().toISOString() })
      .eq('id', gestor.value.id)
      .select()
      .single()
    return { data: data as Gestor | null, error }
  }

  /**
   * Sobe a foto do responsável para o bucket `avatares`. Path fixo
   * (`{userId}/avatar.png`) + cache-bust na URL retornada.
   */
  async function uploadFoto(file: File): Promise<{ url: string | null; error: Error | null }> {
    const uid = user.value?.id ?? gestor.value?.id
    if (!uid) return { url: null, error: new Error('Sem usuário autenticado') }
    const path = `${uid}/avatar.png`
    return uploadToBucket('avatares', path, file)
  }

  /**
   * Fluxo completo: upload + persistência no banco + recarga do perfil global,
   * deixando o avatar do `UserMenu`/topbar atualizado imediatamente.
   */
  async function salvarFoto(file: File): Promise<{ url: string | null; error: Error | null }> {
    const { url, error } = await uploadFoto(file)
    if (error || !url) return { url: null, error: error ?? new Error('URL vazia após upload') }

    const { error: updErr } = await atualizar({ foto_url: url })
    if (updErr) return { url: null, error: updErr as unknown as Error }

    // Recarrega o perfil → avatar do topbar/UserMenu atualiza na hora.
    await carregarPerfil()
    return { url, error: null }
  }

  async function removerFoto(): Promise<{ error: Error | null }> {
    const { error } = await atualizar({ foto_url: null })
    if (error) return { error: error as unknown as Error }
    await carregarPerfil()
    return { error: null }
  }

  return { atualizar, uploadFoto, salvarFoto, removerFoto }
}
