/**
 * Log estruturado em JSON (uma linha por evento) para operações críticas
 * (login, pagamento, foto, webhook, cron).
 *
 * Cada chamada emite um único objeto JSON com `ts`, `nivel` e `evento`, mais
 * os campos extras passados em `dados`.
 *
 * REGRA: NUNCA passe PII em `dados` (CPF, telefone, e-mail, senha, nome).
 * Use apenas ids (atleta_id, clube_id, cobranca_id), códigos de status e flags.
 */

type Nivel = 'info' | 'warn' | 'error'

export function logEvento(
  nivel: Nivel,
  evento: string,
  dados: Record<string, unknown> = {},
): void {
  let linha: string
  try {
    linha = JSON.stringify({ ts: new Date().toISOString(), nivel, evento, ...dados })
  } catch {
    linha = JSON.stringify({ ts: new Date().toISOString(), nivel, evento, _erro: 'dados-nao-serializaveis' })
  }
  if (nivel === 'error') console.error(linha)
  else if (nivel === 'warn') console.warn(linha)
  else console.log(linha)
}

/**
 * Normaliza um erro qualquer para um objeto seguro de log (sem stack gigante,
 * sem PII). Útil para passar como campo `erro` no logEvento.
 */
export function erroParaLog(err: unknown): Record<string, unknown> {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string; statusCode?: number }
    return {
      message: e.message ?? String(err),
      ...(e.code ? { code: e.code } : {}),
      ...(e.statusCode ? { statusCode: e.statusCode } : {}),
    }
  }
  return { message: String(err) }
}
