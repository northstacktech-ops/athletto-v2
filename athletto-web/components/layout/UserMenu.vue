<template>
  <div class="relative" ref="rootRef">
    <!-- Trigger -->
    <button
      type="button"
      class="flex items-center gap-2.5 rounded-xl transition-colors w-full"
      :class="[
        variant === 'sidebar' ? 'px-2 py-2 hover:bg-white/10' : 'px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10',
      ]"
      @click="open = !open"
    >
      <div
        class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
        :class="variant === 'sidebar' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700 dark:bg-white/15 dark:text-white'"
      >
        <NuxtImg v-if="gestor?.foto_url" :src="gestor.foto_url" width="72" height="72" format="webp" class="w-full h-full object-cover" alt="" />
        <span v-else>{{ iniciais }}</span>
      </div>

      <div class="min-w-0 flex-1 text-left leading-tight" :class="variant === 'topbar' ? 'hidden lg:block' : 'block'">
        <p
          class="text-sm font-semibold truncate"
          :class="variant === 'sidebar' ? 'text-white' : 'text-slate-900 dark:text-white'"
        >{{ nomeCurto }}</p>
        <p
          class="text-xs truncate"
          :class="variant === 'sidebar' ? 'text-white/60' : 'text-slate-500 dark:text-white/60'"
        >
          {{ subtitulo }}
        </p>
      </div>

      <svg
        class="w-4 h-4 shrink-0 transition-transform"
        :class="[
          variant === 'topbar' ? 'hidden lg:block text-slate-400 dark:text-white/60' : 'text-white/60',
          open ? 'rotate-180' : '',
        ]"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute z-50 w-64 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-surface-elevated-dark shadow-lg overflow-hidden"
        :class="variant === 'sidebar' ? 'bottom-full mb-2 left-0 right-0' : 'right-0 mt-2 top-full'"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
          <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ gestor?.nome }}</p>
          <p class="text-xs text-slate-500 dark:text-white/60 truncate">{{ gestor?.email }}</p>
          <p class="text-xs text-slate-500 dark:text-white/60 truncate mt-1">
            {{ gestor?.role === 'principal' ? 'Gestor principal' : 'Gestor adicional' }}<template v-if="clube"> · {{ clube.nome }}</template>
          </p>
        </div>

        <!-- Items -->
        <div class="py-1">
          <NuxtLink to="/configuracoes" class="menu-item" @click="open = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Configurações da conta</span>
          </NuxtLink>

          <NuxtLink to="/configuracoes#assinatura" class="menu-item" @click="open = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span>Plano e assinatura</span>
            <span v-if="trial.isTrial.value && trial.daysLeft.value !== null" class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              Trial — {{ trial.daysLeft.value }}d
            </span>
          </NuxtLink>

          <button class="menu-item" @click="onToggleTheme">
            <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
            <span>{{ isDark ? 'Modo claro' : 'Modo escuro' }}</span>
          </button>

          <NuxtLink to="/suporte" class="menu-item" @click="open = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Ajuda & suporte</span>
          </NuxtLink>

          <NuxtLink v-if="isSuperAdmin" to="/admin" class="menu-item menu-item--admin" @click="open = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>Painel admin</span>
            <span class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded bg-accent text-ink">SUPER</span>
          </NuxtLink>
        </div>

        <!-- Logout -->
        <div class="border-t border-slate-100 dark:border-white/[0.06] py-1">
          <button class="menu-item text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:text-red-400" @click="onSignOut">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'

withDefaults(defineProps<{ variant?: 'topbar' | 'sidebar' }>(), { variant: 'topbar' })

const { gestor, clube, signOut } = useAuth()
const { isDark, toggle: toggleTheme } = useTheme()
const { isSuperAdmin } = useAdminAuth()
const trial = useTrial()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const iniciais = computed(() => getIniciais(gestor.value?.nome || 'G'))

const nomeCurto = computed(() => {
  const nome = gestor.value?.nome ?? 'Gestor'
  const parts = nome.trim().split(' ')
  return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : nome
})

const subtitulo = computed(() => {
  if (gestor.value?.role === 'principal') return 'Gestor principal'
  return 'Gestor'
})

function onToggleTheme() {
  toggleTheme()
}

async function onSignOut() {
  open.value = false
  await signOut()
}

function onOutside(e: MouseEvent) {
  if (!rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onOutside))
onBeforeUnmount(() => document.removeEventListener('click', onOutside))
</script>

<style scoped>
.menu-item {
  @apply w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200
         hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors;
  text-decoration: none;
}
.menu-item :deep(svg),
.menu-item > svg {
  @apply w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500;
}
.menu-item--admin {
  @apply text-brand-700 dark:text-brand-300 font-semibold;
}
.menu-item--admin > svg {
  @apply text-brand-600 dark:text-brand-400;
}
</style>
