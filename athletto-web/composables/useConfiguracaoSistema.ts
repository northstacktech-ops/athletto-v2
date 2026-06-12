import type { ConfiguracaoSistema } from '~/types'

export function useConfiguracaoSistema() {
  const supabase = useSupabaseClient()

  async function buscar(): Promise<{ data: ConfiguracaoSistema | null; error: Error | null }> {
    // maybeSingle: a RLS só permite leitura por superadmin — para gestores a
    // query retorna 0 linhas e `.single()` estourava 406 no console.
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .select('*')
      .maybeSingle()
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
