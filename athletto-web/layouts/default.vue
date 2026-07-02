<template>
  <div class="flex min-h-screen bg-surface-canvas dark:bg-surface-canvas-dark">

    <!-- Desktop sidebar -->
    <LayoutSidebar :expanded="expanded" @toggle="toggleSidebar" />

    <!-- Mobile drawer -->
    <LayoutMobileDrawer />

    <!-- Main area -->
    <div
      class="flex-1 flex flex-col min-h-screen transition-all duration-300"
      :class="expanded ? 'lg:pl-[280px]' : 'lg:pl-[64px]'"
    >
      <LayoutTopbar />

      <main class="flex-1">
        <!-- Banner de fallback se o perfil não carregou -->
        <div
          v-if="loadError"
          class="px-4 sm:px-6 pt-4 max-w-screen-2xl mx-auto"
        >
          <div class="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 flex items-start gap-3">
            <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <div class="flex-1 text-sm">
              <p class="font-semibold mb-0.5">Falha ao carregar seu perfil</p>
              <p class="text-rose-700">{{ loadError }}</p>
            </div>
            <button
              class="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
              @click="retryPerfil"
            >
              Tentar novamente
            </button>
          </div>
        </div>
        <div class="px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
          <slot />
        </div>
      </main>
    </div>

    <!-- Cmd+K palette (global) -->
    <LayoutCommandPalette />

    <!-- Tour guiado do sidebar (primeiro acesso) -->
    <LayoutSidebarTour />

    <!-- Toasts -->
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
const { carregarPerfil, loadError, perfilNaoEncontrado } = useAuth()
const { toggle: toggleCmdK } = useCommandPalette()
const { carregar: carregarNotifs, iniciarRealtime } = useNotifications()
const { carregarAssinatura } = useTrial()

const route = useRoute()

await carregarPerfil()

// Usuário autenticado sem perfil de gestor → ainda não fez onboarding.
// Redireciona automaticamente para a página de onboarding.
if (perfilNaoEncontrado.value && route.path !== '/onboarding') {
  await navigateTo('/onboarding')
}

onMounted(async () => {
  // Limpa cookie legado de modo demo (usado em vers\u00f5es anteriores) para
  // garantir que nenhuma sess\u00e3o mockada persista ap\u00f3s a migra\u00e7\u00e3o p/ Supabase real.
  const demo = useCookie('athletto_demo')
  if (demo.value) demo.value = null

  await Promise.all([carregarNotifs(), carregarAssinatura()])
  iniciarRealtime()
})

async function retryPerfil() {
  await carregarPerfil()
}

// ── Sidebar state ─────────────────────────────────────────────
const expanded = ref(true)

onMounted(() => {
  const stored = localStorage.getItem('sidebar_expanded')
  if (stored !== null) expanded.value = stored === 'true'
})

function toggleSidebar() {
  expanded.value = !expanded.value
  localStorage.setItem('sidebar_expanded', String(expanded.value))
}

// ── Keyboard shortcuts ────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  // Cmd+K / Ctrl+K → Command palette
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleCmdK()
  }
  // Cmd+B / Ctrl+B → Toggle sidebar
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>
