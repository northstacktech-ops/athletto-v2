import { defineEventHandler, createError, getHeader, getRequestIP } from 'h3'
import { getServiceClient, aplicarCorsApp, validarSessao } from '~~/server/utils/appAtleta'
import { lerBodyValidado } from '~~/server/utils/validacao'
import { logEvento, erroParaLog } from '~~/server/utils/logger'
import { z } from 'zod'

/**
 * POST /api/app/consentimento  (LGPD — registro de consentimento)
 *
 * Autenticado pela sessão do atleta. Registra o aceite dos documentos legais
 * na tabela `consentimentos` (uma linha por tipo aceito), guardando versão do
 * documento, IP e user-agent — prova do consentimento.
 */

/** Versão vigente dos documentos legais (alinhar com privacidade.vue / termos.vue). */
const VERSAO_DOCUMENTOS = '2026-06-06'

const schema = z.object({
  termos_uso: z.boolean().optional().default(false),
  politica_privacidade: z.boolean().optional().default(false),
  marketing: z.boolean().optional().default(false),
  versao: z.string().min(1).max(40).optional(),
})

export default defineEventHandler(async (event) => {
  aplicarCorsApp(event)
  const sessao = await validarSessao(event)
  const body = await lerBodyValidado(event, schema)

  const versao = body.versao ?? VERSAO_DOCUMENTOS
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? null
  const userAgent = getHeader(event, 'user-agent')?.slice(0, 400) ?? null

  const tipos: string[] = []
  if (body.termos_uso) tipos.push('termos_uso')
  if (body.politica_privacidade) tipos.push('politica_privacidade')
  if (body.marketing) tipos.push('marketing')

  if (tipos.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum consentimento informado.' })
  }

  const linhas = tipos.map((tipo) => ({
    atleta_id: sessao.atleta_id,
    clube_id: sessao.clube_id,
    tipo,
    versao,
    aceito: true,
    ip_address: ip,
    user_agent: userAgent,
  }))

  const supabase = getServiceClient(event)
  const { error } = await supabase.from('consentimentos').insert(linhas)
  if (error) {
    logEvento('error', 'app.consentimento.erro', {
      atleta_id: sessao.atleta_id,
      clube_id: sessao.clube_id,
      tipos,
      versao,
      erro: erroParaLog(error),
    })
    throw createError({ statusCode: 500, statusMessage: 'Falha ao registrar consentimento.' })
  }

  logEvento('info', 'app.consentimento.ok', {
    atleta_id: sessao.atleta_id,
    clube_id: sessao.clube_id,
    tipos,
    versao,
  })
  return { ok: true }
})
