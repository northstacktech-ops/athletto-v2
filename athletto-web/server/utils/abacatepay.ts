import crypto from 'node:crypto'

/**
 * Valida a assinatura HMAC enviada pelo AbacatePay no header
 * `x-abacatepay-signature` (formato: sha256 hex do body cru com o webhook secret).
 *
 * Se o secret não estiver configurado, retorna `false` por padrão — o
 * handler decide o que fazer (em dev, com `ABACATEPAY_ENV=sandbox`, pode
 * aceitar mesmo assim, registrando o fato em `webhook_logs`).
 */
export function verificarHmacAbacatePay(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !signatureHeader) return false
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // timing-safe compare
  try {
    const a = Buffer.from(computed, 'hex')
    const b = Buffer.from(signatureHeader.replace(/^sha256=/, ''), 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
