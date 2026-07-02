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
        <p class="text-xs text-white/50 truncate">Plano {{ nomePlano(clube?.plano) }}</p>
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

    <div v-if="temPermissao('configuracoes')" class="border-t border-white/[0.06] px-3 py-3 shrink-0">
      <LayoutSidebarItem :item="{ label: 'Configurações', to: '/configuracoes', icon: 'settings' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'
import { nomePlano } from '~/types'

const { clube, temPermissao } = useAuth()

// Usa o estado reativo `clube` (atualiza ao salvar nas Configurações). O cache
// legado em localStorage (`athletto_clube_data`) não é mais escrito e congelava
// o nome antigo — removido.
const nomeClube = computed(() => clube.value?.nome || 'Athletto')

const clubeIniciais = computed(() => getIniciais(nomeClube.value || 'A'))

// `modulo` controla a visibilidade por permissão; itens sem `modulo` são
// sempre visíveis. Grupos que ficam sem itens são omitidos.
const navGroups = computed(() => [
  { label: '', items: [{ label: 'Painel', to: '/', icon: 'dashboard' }] },
  {
    label: 'Gestão',
    items: [
      { label: 'Atletas', to: '/atletas', icon: 'athletes', modulo: 'atletas' },
      { label: 'Turmas', to: '/turmas', icon: 'groups', modulo: 'turmas' },
      { label: 'Frequência', to: '/frequencia', icon: 'frequency', modulo: 'frequencia' },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { label: 'Calendário', to: '/calendario', icon: 'calendar', modulo: 'calendario' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Cobranças', to: '/financeiro', icon: 'billing', modulo: 'financeiro' },
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
  .map(group => ({ ...group, items: group.items.filter(item => !item.modulo || temPermissao(item.modulo)) }))
  .filter(group => group.items.length > 0))
</script>
