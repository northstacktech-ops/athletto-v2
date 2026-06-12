<template>
  <header
    class="sticky top-0 z-30 h-[64px] flex items-center shrink-0 px-5 bg-white dark:bg-surface-elevated-dark border-b border-slate-200 dark:border-white/[0.08]"
  >
    <!-- Mobile hamburger -->
    <button
      type="button"
      class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg mr-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
      data-hs-overlay="#mobile-nav"
      title="Menu"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- LEFT — Club logo or fallback icon + name -->
    <NuxtLink to="/" class="hidden lg:flex items-center gap-2 shrink-0 group">
      <NuxtImg
        v-if="logoUrl"
        :src="logoUrl"
        :alt="nomeClube"
        width="56"
        height="56"
        format="webp"
        class="w-7 h-7 rounded-md object-cover bg-slate-100 dark:bg-white/10 shrink-0 ring-1 ring-slate-200 dark:ring-white/10"
        @error="onLogoError"
      />
      <svg
        v-else
        class="w-[18px] h-[18px] text-brand-600 dark:text-brand-400 shrink-0"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6.9l3.7 2.7-1.4 4.3H9.7L8.3 9.6 12 6.9z"/>
        <line x1="12"   y1="6.9" x2="12"   y2="2"/>
        <line x1="15.7" y1="9.6" x2="20.2" y2="7.3"/>
        <line x1="14.3" y1="13.9" x2="17.9" y2="17.7"/>
        <line x1="9.7"  y1="13.9" x2="6.1"  y2="17.7"/>
        <line x1="8.3"  y1="9.6"  x2="3.8"  y2="7.3"/>
      </svg>
      <span class="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{{ nomeClube }}</span>
    </NuxtLink>

    <!-- CENTER — Search (flex-1, centered) -->
    <div class="flex-1 flex justify-center px-6 lg:px-10">
      <button
        type="button"
        class="hidden lg:flex items-center gap-2 h-9 px-4 rounded-full w-full max-w-[440px] text-left text-sm transition-all bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/[0.05] dark:hover:bg-white/[0.10] dark:text-slate-300"
        @click="openCmdK"
      >
        <svg class="w-4 h-4 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span class="flex-1 truncate">Buscar atletas, turmas, ações...</span>
        <kbd
          class="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium shrink-0 bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
        >
          <span>{{ isMac ? '⌘' : 'Ctrl' }}</span>K
        </kbd>
      </button>
    </div>

    <!-- Spacer mobile -->
    <div class="flex-1 lg:hidden" />

    <!-- RIGHT — Actions -->
    <div class="flex items-center gap-1 shrink-0">

      <!-- Mobile search -->
      <button
        type="button"
        class="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
        @click="openCmdK"
      >
        <svg class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </button>

      <!-- Trial badge -->
      <LayoutTrialBadge />

      <!-- Theme toggle -->
      <button
        type="button"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
        :title="isDark ? 'Modo claro' : 'Modo escuro'"
        @click="toggleTheme"
      >
        <svg v-if="isDark" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </button>

      <!-- Notifications -->
      <LayoutNotificationBell />

      <!-- Divider -->
      <div class="w-px h-5 mx-2 bg-slate-200 dark:bg-white/[0.12]" />

      <!-- User menu -->
      <LayoutUserMenu variant="topbar" />
    </div>
  </header>
</template>

<script setup lang="ts">
const { clube } = useAuth()
const { isDark, toggle: toggleTheme } = useTheme()
const { show: openCmdK } = useCommandPalette()

// localStorage só depois do mount — ler direto no computed fazia o HTML do
// client divergir do SSR (hydration mismatch).
const savedNomeClube = ref<string | null>(null)
onMounted(() => {
  try {
    const saved = localStorage.getItem('athletto_clube_data')
    if (saved) savedNomeClube.value = JSON.parse(saved).nomeClube ?? null
  } catch {}
})

const nomeClube = computed(() =>
  savedNomeClube.value || clube.value?.nome || 'Athletto',
)

const logoLoadFailed = ref(false)
const logoUrl = computed(() => {
  if (logoLoadFailed.value) return null
  return clube.value?.logo_url || null
})

function onLogoError() {
  logoLoadFailed.value = true
}

watch(() => clube.value?.logo_url, () => {
  logoLoadFailed.value = false
})

// Detectado após o mount pelo mesmo motivo (SSR renderizava "Ctrl" e o client
// "⌘" em Macs — hydration mismatch).
const isMac = ref(false)
onMounted(() => {
  isMac.value = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
})
</script>
