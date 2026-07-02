// Sentry (client) — captura erros de JS no navegador do gestor.
// Sem SENTRY_DSN configurado (env), não inicializa nada — zero custo/risco
// em dev ou enquanto a conta Sentry não existir.
import * as Sentry from '@sentry/nuxt'

const dsn = useRuntimeConfig().public.sentryDsn as string | undefined

if (dsn) {
  Sentry.init({
    dsn,
    // Ambiente ajuda a separar prod/preview/dev no dashboard do Sentry.
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    // 10% das transações — ajuste depois de ver o volume real de erros/tráfego.
    tracesSampleRate: 0.1,
    // Não captura replay de sessão por padrão (custo extra, dado sensível
    // de gestor/financeiro na tela) — ligar depois se fizer sentido.
  })
}
