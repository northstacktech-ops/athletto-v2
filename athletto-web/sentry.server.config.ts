// Sentry (server) — captura erros nas rotas /api/* (Nitro/Vercel functions).
// Sem SENTRY_DSN configurado (env), não inicializa nada.
import * as Sentry from '@sentry/nuxt'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  })
}
