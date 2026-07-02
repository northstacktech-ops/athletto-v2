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

  /**
   * Sem transição de página de propósito: com `out-in` a tela antiga precisava
   * sumir (~150ms) ANTES do skeleton da nova aparecer, atrasando o feedback;
   * sem `mode` as telas se sobrepõem e "pulam". Swap instantâneo = skeleton
   * aparece no mesmo instante do clique. O feedback de navegação fica por conta
   * da barra de progresso no topo (NuxtLoadingIndicator).
   */
  app: {
    pageTransition: false,
    layoutTransition: false,
  },

  /** Sempre gere saída Build Output API da Vercel (evita preset `node-server` e 404 em produção). */
  nitro: {
    preset: 'vercel',
  },

  /** Páginas públicas 100% estáticas servidas do CDN — sem SSR nem cold start. */
  routeRules: {
    '/termos': { prerender: true },
    '/privacidade': { prerender: true },
  },

  devServer: {
    port: 4000,
    /** Se 4000 estiver ocupada, falha com erro em vez de usar outra porta (evita confusão com localhost:4000 recusando). */
    strictPort: true,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/image',
    // Sem SENTRY_DSN o módulo carrega mas fica inerte (sentry.client/server
    // config.ts abaixo só chamam Sentry.init quando o DSN existe).
    '@sentry/nuxt/module',
  ],

  sentry: {
    // Upload de source maps é opcional (precisa de SENTRY_AUTH_TOKEN/org/
    // project) — deixado de fora até vocês terem uma conta Sentry criada.
    autoInjectServerSentry: 'top-level-import',
  },

  sourcemap: {
    client: process.env.SENTRY_DSN ? 'hidden' : false,
  },

  /** Otimização de imagens (fotos de atletas/gestores e logos no Supabase Storage). */
  image: {
    domains: [
      ...(supabasePublicUrl ? [new URL(supabasePublicUrl).host] : []),
      'images.pexels.com',
    ],
  },

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
    validapayClientId: process.env.VALIDAPAY_CLIENT_ID,
    validapayClientSecret: process.env.VALIDAPAY_CLIENT_SECRET,
    validapayWebhookSecret: process.env.VALIDAPAY_WEBHOOK_SECRET,
    validapayEnv: process.env.VALIDAPAY_ENV ?? 'sandbox',
    // ── Público (exposto ao client) ───────────────────────────────────────────
    public: {
      supabaseUrl: supabasePublicUrl,
      supabaseKey: supabasePublicKey,
      validapayConfigurado:
        !!process.env.VALIDAPAY_CLIENT_ID && !!process.env.VALIDAPAY_CLIENT_SECRET,
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
