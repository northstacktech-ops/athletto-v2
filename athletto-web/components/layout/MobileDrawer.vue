<template>
  <div
    id="mobile-nav"
    class="hs-overlay hs-overlay-open:translate-x-0 hidden -translate-x-full fixed top-0 start-0 z-50 w-[260px] h-full transition-all duration-300 flex flex-col border-r border-white/[0.06] bg-slate-900 dark:bg-[#0a0c10]"
    role="dialog"
    tabindex="-1"
  >
    <div class="flex items-center gap-2.5 h-[60px] px-4 border-b border-white/[0.06] shrink-0">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-ink shrink-0 bg-accent">
        {{ clubeIniciais }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white truncate leading-tight">{{ nomeClube }}</p>
        <p class="text-xs text-white/50 truncate capitalize">Plano {{ clube?.plano ?? 'free' }}</p>
      </div>
      <button type="button" class="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors" data-hs-overlay="#mobile-nav">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
      <template v-for="(group, gi) in navGroups" :key="gi">
        <div v-if="group.label" class="pt-4 pb-1.5 px-2">
          <span class="section-label text-white/45">{{ group.label }}</span>
        </div>
        <div class="space-y-0.5">
          <LayoutSidebarItem v-for="item in group.items" :key="item.to" :item="item" />
        </div>
      </template>
    </nav>

    <div class="border-t border-white/[0.06] px-3 py-3 shrink-0">
      <LayoutSidebarItem :item="{ label: 'Configurações', to: '/configuracoes', icon: 'settings' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'

const { clube } = useAuth()

const nomeClube = computed(() => {
  if (process.client) {
    const saved = localStorage.getItem('athletto_clube_data')
    if (saved) {
      try { return JSON.parse(saved).nomeClube || clube.value?.nome || 'Athletto' } catch {}
    }
  }
  return clube.value?.nome || 'Athletto'
})

const clubeIniciais = computed(() => getIniciais(nomeClube.value || 'A'))

const navGroups = [
  { label: '', items: [{ label: 'Painel', to: '/', icon: 'dashboard' }] },
  {
    label: 'Gestão',
    items: [
      { label: 'Atletas', to: '/atletas', icon: 'athletes' },
      { label: 'Turmas', to: '/turmas', icon: 'groups' },
      { label: 'Frequência', to: '/frequencia', icon: 'frequency' },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { label: 'Calendário', to: '/calendario', icon: 'calendar' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Cobranças', to: '/financeiro', icon: 'billing' },
    ],
  },
  {
    label: 'Outros',
    items: [
      { label: 'Suporte', to: '/suporte', icon: 'support' },
      { label: 'Convide e ganhe', to: '/convite', icon: 'gift' },
    ],
  },
]
</script>
