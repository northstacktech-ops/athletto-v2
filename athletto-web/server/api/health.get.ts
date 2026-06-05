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
      abacatepay: !!process.env.ABACATEPAY_API_KEY,
      abacatepay_webhook: !!process.env.ABACATEPAY_WEBHOOK_SECRET,
      sentry: !!process.env.SENTRY_DSN,
    },
    environment: process.env.ABACATEPAY_ENV ?? 'sandbox',
  }
})
