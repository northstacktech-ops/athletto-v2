import type { ConfiguracaoSistema } from '~/types'

export function useConfiguracaoSistema() {
  const supabase = useSupabaseClient()

  async function buscar(): Promise<{ data: ConfiguracaoSistema | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .select('*')
      .single()
    return { data: data as ConfiguracaoSistema | null, error: error as Error | null }
  }

  async function atualizar(patch: Partial<ConfiguracaoSistema>) {
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .update({
        ...patch,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', 'cfg-singleton')
      .select()
      .single()
    return { data, error }
  }

  return { buscar, atualizar }
}
