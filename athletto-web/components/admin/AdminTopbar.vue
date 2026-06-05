<template>
  <header class="sticky top-0 z-30 bg-white dark:bg-surface-elevated-dark border-b border-gray-200 dark:border-white/[0.06]">
    <div class="flex items-center h-[64px] px-4 sm:px-6 gap-4">

      <!-- Mobile menu -->
      <button
        class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05]"
        @click="drawerOpen = true"
        aria-label="Abrir menu"
      >
        <svg class="w-5 h-5 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <!-- Title + breadcrumb -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider"
                style="background-color: #0b0d12; color: #ccff00;">
            ADMIN
          </span>
          <h1 class="text-base font-bold text-gray-900 dark:text-white truncate">{{ titulo }}</h1>
        </div>
        <p v-if="subtitulo" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {{ subtitulo }}
        </p>
      </div>

      <!-- Ambiente badge -->
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg" :class="ambienteBg">
        <span class="w-2 h-2 rounded-full" :class="ambienteDot"/>
        <span class="text-xs font-bold uppercase tracking-wider" :class="ambienteTexto">
          {{ ambiente }}
        </span>
      </div>

      <!-- Notificações admin -->
      <NotificationBell variant="light" />

      <!-- Sign out -->
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
        title="Sair"
        @click="handleSignOut"
      >
        <svg class="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const drawerOpen = useState('admin_drawer_open', () => false)
const route = useRoute()
const { signOut } = useAdminAuth()
const config = useRuntimeConfig()

const ambiente = computed(() =>
  config.public.abacatepayConfigurado ? 'Produção' : 'Sandbox',
)
const ambienteBg = computed(() =>
  config.public.abacatepayConfigurado
    ? 'bg-red-50 dark:bg-red-900/20'
    : 'bg-amber-50 dark:bg-amber-900/20',
)
const ambienteDot = computed(() =>
  config.public.abacatepayConfigurado ? 'bg-red-500' : 'bg-amber-400',
)
const ambienteTexto = computed(() =>
  config.public.abacatepayConfigurado
    ? 'text-red-700 dark:text-red-300'
    : 'text-amber-700 dark:text-amber-300',
)

const TITULOS: Record<string, { titulo: string; subtitulo?: string }> = {
  '/admin':                { titulo: 'Visão geral',   subtitulo: 'Saúde da plataforma e métricas globais' },
  '/admin/clubes':         { titulo: 'Clubes',        subtitulo: 'Todos os clubes da plataforma' },
  '/admin/assinaturas':    { titulo: 'Assinaturas',   subtitulo: 'Status e ciclo das assinaturas' },
  '/admin/vouchers':       { titulo: 'Vouchers',      subtitulo: 'Conceder e gerenciar acesso por tempo' },
  '/admin/indicacoes':     { titulo: 'Indicações',    subtitulo: 'Convide e Ganhe — pendentes de aprovação' },
  '/admin/financeiro':     { titulo: 'Financeiro',    subtitulo: 'Receita do sistema Athletto' },
  '/admin/webhooks':       { titulo: 'Webhooks',      subtitulo: 'Eventos do AbacatePay' },
  '/admin/auditoria':      { titulo: 'Auditoria',     subtitulo: 'Trilha de ações dos superadmins' },
  '/admin/configuracoes':  { titulo: 'Configurações', subtitulo: 'Parâmetros globais do sistema' },
}

const meta = computed(() => {
  const path = route.path
  if (TITULOS[path]) return TITULOS[path]
  // detalhes
  if (path.startsWith('/admin/clubes/')) return { titulo: 'Detalhe do clube', subtitulo: route.params.id as string }
  return { titulo: 'Admin' }
})

const titulo = computed(() => meta.value.titulo)
const subtitulo = computed(() => meta.value.subtitulo)

async function handleSignOut() {
  await signOut()
}
</script>
