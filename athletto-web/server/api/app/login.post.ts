import { defineEventHandler, readBody, createError, getMethod } from 'h3'
import {
  getServiceClient,
  aplicarCorsApp,
  rateLimited,
  gerarToken,
  hashToken,
} from '~~/server/utils/appAtleta'

/**
 * POST /api/app/login
 * Body: { cpf, clube_id, senha, device? }
 *
 * Chama a RPC app_login. Se ok=false → 401 { erro }. Se ok:
 *  • gera token opaco, persiste hash em app_atleta_sessoes (expira em 90 dias);
 *  • retorna { token, atleta:{...}, clube:{...} }.
 */
const SESSAO_DIAS = 90

export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  if (getMethod(event) === 'OPTIONS') return ''

  if (rateLimited(event, 'login', 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde um minuto.' })
  }

  const body = await readBody<{
    cpf?: string
    clube_id?: string
    senha?: string
    device?: string
  }>(event)

  const cpf = String(body?.cpf ?? '').replace(/\D/g, '')
  const clubeId = String(body?.clube_id ?? '').trim()
  const senha = String(body?.senha ?? '')
  const device = body?.device ? String(body.device).slice(0, 200) : null

  if (cpf.length !== 11) {
    throw createError({ statusCode: 400, statusMessage: 'CPF inválido.' })
  }
  if (!clubeId) {
    throw createError({ statusCode: 400, statusMessage: 'clube_id ausente.' })
  }
  if (!senha) {
    throw createError({ statusCode: 400, statusMessage: 'Senha ausente.' })
  }

  const supabase = getServiceClient(event)

  const { data, error } = await supabase.rpc('app_login', {
    p_cpf: cpf,
    p_clube_id: clubeId,
    p_senha: senha,
  })
  if (error) {
    console.error('[app/login] erro rpc:', error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao autenticar.' })
  }

  if (!data || data.ok !== true) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado',
      data: { erro: data?.erro ?? 'credenciais' },
    })
  }

  const atletaId: string = data.atleta_id
  const clubeIdOk: string = data.clube_id

  // Cria a sessão
  const token = gerarToken()
  const tokenHash = hashToken(token)
  const expiraEm = new Date(Date.now() + SESSAO_DIAS * 24 * 60 * 60 * 1000).toISOString()

  const { error: sessErr } = await supabase.from('app_atleta_sessoes').insert({
    atleta_id: atletaId,
    clube_id: clubeIdOk,
    token_hash: tokenHash,
    device,
    expira_em: expiraEm,
    revogado: false,
  })
  if (sessErr) {
    console.error('[app/login] erro ao criar sessão:', sessErr)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao criar sessão.' })
  }

  // Dados do atleta e clube
  const [{ data: atleta }, { data: clube }] = await Promise.all([
    supabase
      .from('atletas')
      .select('id, nome, apelido, foto_url, posicao, numero_camisa, status')
      .eq('id', atletaId)
      .maybeSingle(),
    supabase.from('clubes').select('id, nome, logo_url').eq('id', clubeIdOk).maybeSingle(),
  ])

  return {
    token,
    atleta: atleta
      ? {
          id: atleta.id,
          nome: atleta.nome,
          apelido: atleta.apelido,
          foto_url: atleta.foto_url,
          posicao: atleta.posicao,
          numero_camisa: atleta.numero_camisa,
          status: atleta.status,
        }
      : null,
    clube: clube ? { id: clube.id, nome: clube.nome, logo_url: clube.logo_url } : null,
  }
})
