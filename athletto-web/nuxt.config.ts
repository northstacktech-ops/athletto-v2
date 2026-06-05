// https://nuxt.com/docs/api/configuration/nuxt-config


/** Credenciais públicas Supabase lidas na build (ex.: CI/Vercel). Aceita vários nomes porque o dashboard às vezes só injeta `NUXT_PUBLIC_*`. */
const supabasePublicUrl =
  process.env.SUPABASE_URL?.trim()
  || process.env.NUXT_PUBLIC_SUPABASE_URL?.trim()
  || ''

const supabasePublicKey =
  process.env.SUPABASE_KEY?.trim()
  || process.env.NUXT_PUBLIC_SUPABASE_KEY?.trim()
  || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || ''

// Sem credenciais Supabase o app não funciona — falhe alto na build em vez de
// entrar silenciosamente em modo quebrado. (`nuxt prepare`/typecheck local seguem ok.)
if (!supabasePublicUrl || !supabasePublicKey) {
  throw new Error(
    '[athletto] SUPABASE_URL e SUPABASE_KEY (ou NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY) '
    + 'são obrigatórias. Configure as variáveis de ambiente antes de buildar/rodar.',
  )
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  /** Sempre gere saída Build Output API da Vercel (evita preset `node-server` e 404 em produção). */
  nitro: {
    preset: 'vercel',
  },

  devServer: {
    port: 4000,
    /** Se 4000 estiver ocupada, falha com erro em vez de usar outra porta (evita confusão com localhost:4000 recusando). */
    strictPort: true,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],

  supabase: {
    redirect: false,
    url: supabasePublicUrl,
    key: supabasePublicKey,
  },

  tailwindcss: {
    exposeConfig: true,
    viewer: true,
    cssPath: '~/assets/css/main.css',
  },

  typescript: {
    strict: true,
    shim: false,
  },

  runtimeConfig: {
    // ── Server-only (não vaza para o client) ──────────────────────────────────
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    abacatepayApiUrl: process.env.ABACATEPAY_API_URL ?? 'https://api.abacatepay.com/v1',
    abacatepayApiKey: process.env.ABACATEPAY_API_KEY,
    abacatepayWebhookSecret: process.env.ABACATEPAY_WEBHOOK_SECRET,
    abacatepayEnv: process.env.ABACATEPAY_ENV ?? 'sandbox',
    // ── Público (exposto ao client) ───────────────────────────────────────────
    public: {
      supabaseUrl: supabasePublicUrl,
      supabaseKey: supabasePublicKey,
      abacatepayConfigurado:
        !!process.env.ABACATEPAY_API_KEY && !!process.env.ABACATEPAY_WEBHOOK_SECRET,
      sentryDsn: process.env.SENTRY_DSN,
    },
  },

  app: {
    head: {
      title: 'Athletto — Gestão Esportiva',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistema de gestão para clubes e escolinhas esportivas' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      script: [],
    },
  },
})
