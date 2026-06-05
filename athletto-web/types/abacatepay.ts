/**
 * Tipos relacionados à integração AbacatePay (gateway Pix).
 * Refs:
 *  - https://docs.abacatepay.com
 *  - Webhook events: pix.created, pix.paid, pix.expired, pix.cancelled
 *
 * Mantemos estes types isolados em /types/abacatepay.ts para deixar claro
 * o que é "shape do gateway" vs "shape interno do Athletto".
 */

export type AbacatePixStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'

export interface AbacatePixPayment {
  id: string
  status: AbacatePixStatus
  amount: number // em centavos
  description: string | null
  customer: {
    name: string
    cellphone: string | null
    email: string | null
    tax_id: string | null // CPF/CNPJ
  } | null
  pix_qr_code: string | null
  pix_qr_code_url: string | null
  pix_copy_paste: string | null
  expires_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

export type AbacateWebhookEvent =
  | 'pix.created'
  | 'pix.paid'
  | 'pix.expired'
  | 'pix.cancelled'
  | 'pix.refunded'

export interface AbacateWebhookPayload {
  event: AbacateWebhookEvent
  data: AbacatePixPayment
  /** Athletto adiciona este campo no envio do "regenerate link", para casar com `cobrancas.id` */
  metadata?: {
    cobranca_id?: string
    assinatura_id?: string
  }
}

export interface AbacateCreatePixRequest {
  amount: number // em centavos
  description: string
  customer: {
    name: string
    cellphone?: string | null
    email?: string | null
    tax_id?: string | null
  }
  expires_in?: number // segundos
  metadata?: Record<string, unknown>
}
