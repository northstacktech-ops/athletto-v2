/**
 * Helper de upload de imagens para o Supabase Storage.
 *
 * - Sempre usa upsert + cacheControl curto (60s) para que trocas sucessivas
 *   apareçam rapidamente.
 * - Devolve a URL pública já com cache-bust (?v=timestamp), eliminando o
 *   problema de "troquei o arquivo e o navegador continua mostrando a imagem
 *   antiga" causado por path estável (clubeId/logo.png).
 */
export function useImageUpload() {
  const supabase = useSupabaseClient()

  function withCacheBust(url: string): string {
    if (!url) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}v=${Date.now()}`
  }

  async function uploadToBucket(
    bucket: string,
    path: string,
    file: File | Blob,
  ): Promise<{ url: string | null; error: Error | null }> {
    const supa = supabase
    const { error: upErr } = await supa.storage
      .from(bucket)
      .upload(path, file, { upsert: true, cacheControl: '60', contentType: 'image/png' })
    if (upErr) return { url: null, error: upErr as unknown as Error }

    const { data } = supa.storage.from(bucket).getPublicUrl(path)
    return { url: withCacheBust(data.publicUrl), error: null }
  }

  return { uploadToBucket, withCacheBust }
}
