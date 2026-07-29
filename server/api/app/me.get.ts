import { defineEventHandler, createError, getMethod } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'

/**
 * GET /api/app/me  (auth)
 * → { atleta:{id,nome,apelido,foto_url,posicao,numero_camisa,status}, clube:{id,nome,logo_url} }
 */
export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  const sessao = await validarSessao(event)
  const supabase = getServiceClient(event)

  const [{ data: atleta }, { data: clube }] = await Promise.all([
    supabase
      .from('atletas')
      .select('id, nome, apelido, foto_url, posicao, numero_camisa, status')
      .eq('id', sessao.atleta_id)
      .maybeSingle(),
    supabase.from('clubes').select('id, nome, logo_url').eq('id', sessao.clube_id).maybeSingle(),
  ])

  if (!atleta) {
    throw createError({ statusCode: 404, statusMessage: 'Atleta não encontrado.' })
  }

  return {
    atleta: {
      id: atleta.id,
      nome: atleta.nome,
      apelido: atleta.apelido,
      foto_url: atleta.foto_url,
      posicao: atleta.posicao,
      numero_camisa: atleta.numero_camisa,
      status: atleta.status,
    },
    clube: clube ? { id: clube.id, nome: clube.nome, logo_url: clube.logo_url } : null,
  }
})
