import { defineEventHandler, readMultipartFormData, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * POST /api/app/foto  (auth, multipart)
 *
 * Upload da foto do atleta da sessão. FOTO ÚNICA: usa o MESMO caminho
 * determinístico que o gestor (Tarefa D), garantindo uma só imagem por atleta:
 *   `{clube_id}/atletas/{atleta_id}.png` no bucket `avatares`.
 *
 * Valida tipo (png/jpeg/webp) e tamanho (≤ 2 MB). Grava a URL pública com
 * cache-bust em atletas.foto_url.
 * → { ok: true, url }
 */
const TIPOS_OK = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const form = await readMultipartFormData(event)
  const arquivo = form?.find((p) => p.data && (p.filename || p.type))

  if (!arquivo || !arquivo.data) {
    throw createError({ statusCode: 400, statusMessage: 'Arquivo de imagem ausente.' })
  }

  const contentType = arquivo.type || ''
  if (!TIPOS_OK.includes(contentType)) {
    throw createError({ statusCode: 400, statusMessage: 'Formato inválido. Use PNG, JPEG ou WEBP.' })
  }
  if (arquivo.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Imagem muito grande (máx. 2 MB).' })
  }

  const path = `${sessao.clube_id}/atletas/${sessao.atleta_id}.png`

  const { error: upErr } = await supabase.storage
    .from('avatares')
    .upload(path, arquivo.data, { upsert: true, contentType })
  if (upErr) {
    console.error('[app/foto] erro upload:', upErr)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao enviar a imagem.' })
  }

  const { data: pub } = supabase.storage.from('avatares').getPublicUrl(path)
  const url = `${pub.publicUrl}?v=${Date.now()}`

  const { error: updErr } = await supabase
    .from('atletas')
    .update({ foto_url: url })
    .eq('id', sessao.atleta_id)
  if (updErr) {
    console.error('[app/foto] erro update foto_url:', updErr)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao salvar a foto.' })
  }

  return { ok: true, url }
})
