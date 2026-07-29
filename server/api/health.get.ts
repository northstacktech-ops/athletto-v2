import { defineEventHandler } from 'h3'

/**
 * GET /api/health
 *
 * Endpoint público de healthcheck — útil para statuspage e load balancers.
 * Reporta o estado das integrações sem expor segredos.
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder'),
      supabase_admin: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      validapay: !!process.env.VALIDAPAY_CLIENT_ID && !!process.env.VALIDAPAY_CLIENT_SECRET,
      validapay_webhook: !!process.env.VALIDAPAY_WEBHOOK_SECRET,
      sentry: !!process.env.SENTRY_DSN,
    },
    environment: process.env.VALIDAPAY_ENV ?? 'sandbox',
  }
})
