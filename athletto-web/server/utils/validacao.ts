import { createError, readBody, getQuery } from 'h3'
import type { H3Event } from 'h3'
import type { ZodTypeAny, infer as ZodInfer } from 'zod'

/**
 * Helpers de validação com Zod para os endpoints do servidor.
 *
 * Padroniza a resposta de erro de validação como 400 com uma mensagem
 * legível ("campo — motivo"), sem vazar o stack do Zod.
 */

function primeiroErro(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  const issue = error.issues[0]
  const campo = issue?.path?.length ? issue.path.join('.') : 'corpo'
  return `${campo}: ${issue?.message ?? 'valor inválido'}`
}

/** Lê e valida o corpo da requisição contra um schema Zod. Lança 400 se inválido. */
export async function lerBodyValidado<S extends ZodTypeAny>(
  event: H3Event,
  schema: S,
): Promise<ZodInfer<S>> {
  const body = await readBody(event).catch(() => undefined)
  const parsed = schema.safeParse(body ?? {})
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: `Dados inválidos — ${primeiroErro(parsed.error)}` })
  }
  return parsed.data
}

/** Lê e valida a query string contra um schema Zod. Lança 400 se inválido. */
export function lerQueryValidada<S extends ZodTypeAny>(
  event: H3Event,
  schema: S,
): ZodInfer<S> {
  const parsed = schema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: `Query inválida — ${primeiroErro(parsed.error)}` })
  }
  return parsed.data
}
