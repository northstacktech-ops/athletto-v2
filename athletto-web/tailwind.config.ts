import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    'node_modules/preline/dist/*.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Semânticas de Texto e Ícone ──────────────────────────────
        ink: {
          DEFAULT: '#11358B', // Dark Blue - Títulos, valores, ancoragem
          light: '#6192FC',   // Light Blue - Ícones, tags, destaques secundários
        },
        // ── Primária — Athletto Blue (Baseado no Dark Blue #11358B) ──
        brand: {
          50:  '#eff2fe',
          100: '#e1e8fd',
          200: '#c6d6fc',
          300: '#9bbaf8',
          400: '#6192fc', // ink-light
          500: '#4171f1',
          600: '#264edb',
          700: '#11358b', // base ink
          800: '#183072',
          900: '#192b5b',
          950: '#111a36',
        },
        // ── Destaque — Lime Green (CTAs e conversão) ─────────────────
        accent: {
          DEFAULT: '#c7ef66',
          light:   '#dcf494',
          dark:    '#a8d438',
        },
        // ── Surfaces (semânticos) ────────────────────────────────────
        surface: {
          canvas:   '#eff0f4',     // body bg light
          'canvas-dark':   '#0d0f14',     // body bg dark
          elevated: '#ffffff',     // cards light
          'elevated-dark': '#1a1d26',     // cards dark  (clearly above canvas)
          overlay:  '#ffffff',     // modals light
          'overlay-dark':  '#1e2130',     // modals dark
          sidebar:  '#ffffff',     // sidebar light
          'sidebar-hover': '#f1f5f9', // sidebar hover light
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Refined scale
        'display': ['28px', { lineHeight: '32px', fontWeight: '700' }],
        'h1':      ['20px', { lineHeight: '26px', fontWeight: '700' }],
        'h2':      ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'value':   ['24px', { lineHeight: '28px', fontWeight: '700' }],
      },
      spacing: {
        // Aliases para densidade calibrada
        'card':    '20px',
        'card-lg': '24px',
        'gutter':  '20px',
      },
      backgroundImage: {
        'auth-panel': "linear-gradient(135deg, rgba(29,41,200,0.88) 0%, rgba(61,90,254,0.82) 50%, rgba(29,41,200,0.92) 100%), url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=85&auto=format&fit=crop')",
      },
      boxShadow: {
        'input-focus': '0 0 0 3px rgba(61,90,254,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)', // Sombra super difusa pra interfaces densas
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.35s ease-out both',
        'fade-in':    'fade-in 0.2s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'scale-in':   'scale-in 0.18s ease-out both',
      },
      transitionTimingFunction: {
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
