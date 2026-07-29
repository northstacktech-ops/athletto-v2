<template>
  <aside
    class="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col transition-all duration-300 bg-slate-900 dark:bg-[#0a0c10] border-r border-white/[0.06]"
    :class="expanded ? 'w-[280px]' : 'w-[64px]'"
  >
    <!-- ── Brand ────────────────────────────────────────────────── -->
    <div
      class="flex items-center h-[79px] px-6 shrink-0 gap-3"
      :class="!expanded && 'justify-center px-0'"
    >
      <!-- Logo mark -->
      <div class="shrink-0 w-9 h-9 flex items-center justify-center text-accent">
        <BrandMark class="w-9 h-9" />
      </div>

      <div v-if="expanded" class="min-w-0 flex-1">
        <p class="text-xl font-bold leading-tight text-white">Athletto</p>
        <p class="text-sm text-white/50">{{ planLabel }}</p>
      </div>

      <!-- Collapse toggle -->
      <button
        v-if="expanded"
        class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-white/10 hover:bg-white/15 border border-white/10"
        title="Recolher (Ctrl+B)"
        @click="$emit('toggle')"
      >
        <svg class="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>

    <!-- ── Nav ──────────────────────────────────────────────────── -->
    <nav class="flex-1 overflow-y-auto no-scrollbar py-2" :class="expanded ? 'px-4' : 'px-2.5'">

      <!-- Group 1 -->
      <div :class="expanded ? 'space-y-0.5' : 'space-y-1 flex flex-col items-center'">
        <LayoutSidebarItem v-for="item in group1" :key="item.to" :item="item" :collapsed="!expanded" />
      </div>

      <!-- Divider -->
      <div class="my-3" :class="expanded ? 'border-t border-white/[0.06]' : 'w-8 border-t border-white/[0.06] mx-auto'" />

      <!-- Group 2 -->
      <div :class="expanded ? 'space-y-0.5' : 'space-y-1 flex flex-col items-center'">
        <LayoutSidebarItem v-for="item in group2" :key="item.to" :item="item" :collapsed="!expanded" />
      </div>

      <!-- Atalho admin (apenas para superadmins) -->
      <template v-if="isSuperAdmin">
        <div class="my-3" :class="expanded ? 'border-t border-white/[0.06]' : 'w-8 border-t border-white/[0.06] mx-auto'" />
        <NuxtLink
          to="/admin"
          class="relative flex items-center text-sm font-medium transition-all duration-150 outline-none group rounded-lg text-accent"
          :class="!expanded
            ? 'justify-center w-9 h-9 mx-auto'
            : 'gap-3 px-3 py-2 w-full'"
          style="text-decoration: none;"
          :title="!expanded ? 'Painel admin' : undefined"
        >
          <span class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/5" />
          <span class="relative shrink-0 w-[18px] h-[18px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </span>
          <span v-if="expanded" class="relative truncate flex-1">Painel admin</span>
          <span v-if="expanded" class="relative inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-accent text-ink">SUPER</span>
        </NuxtLink>
      </template>
    </nav>

    <!-- ── Footer ───────────────────────────────────────────────── -->
    <div
      class="shrink-0 border-t py-3 border-white/[0.06]"
      :class="expanded ? 'px-3' : 'px-2'"
    >
      <!-- Expanded: dropdown completo -->
      <LayoutUserMenu v-if="expanded" variant="sidebar" />

      <!-- Collapsed: só avatar -->
      <button
        v-else
        type="button"
        class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto bg-white/10 text-white hover:bg-white/15 transition-colors overflow-hidden"
        title="Expandir menu"
        @click="$emit('toggle')"
      >
        <NuxtImg v-if="gestor?.foto_url" :src="gestor.foto_url" width="80" height="80" format="webp" class="w-full h-full object-cover rounded-full" />
        <span v-else>{{ gestorIniciais }}</span>
      </button>
    </div>

    <!-- Expand button when collapsed -->
    <button
      v-if="!expanded"
      class="absolute -right-3 top-[72px] w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-colors bg-slate-900 dark:bg-[#0a0c10] border-white/15 text-white/70 hover:bg-white/10"
      title="Expandir"
      @click="$emit('toggle')"
    >
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7"/>
      </svg>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'
import { nomePlano } from '~/types'

defineProps<{ expanded: boolean }>()
defineEmits<{ (e: 'toggle'): void }>()

const { gestor, clube, temPermissao } = useAuth()
const { isSuperAdmin, carregarSuperAdmin } = useAdminAuth()
const dashboard = useDashboard()

const gestorIniciais = computed(() => getIniciais(gestor.value?.nome || 'G'))
const planLabel = computed(() => `Plano ${nomePlano(clube.value?.plano)}`)

const badges = ref({ cobranças: null as number | null })

onMounted(async () => {
  // Detecta superadmin para exibir o atalho do painel admin
  carregarSuperAdmin().catch(() => {})
  const res = await dashboard.buscarMetricas()
  if (res.data) badges.value.cobranças = res.data.cobranças_atraso
})

// `modulo` controla a visibilidade por permissão (gestor principal vê tudo;
// adicional só vê módulos com nível 'ver'). Itens sem `modulo` são sempre visíveis.
const group1 = computed(() => [
  { label: 'Painel',     to: '/',           icon: 'dashboard'  },
  { label: 'Atletas',    to: '/atletas',    icon: 'athletes',  modulo: 'atletas'    },
  { label: 'Turmas',     to: '/turmas',     icon: 'groups',    modulo: 'turmas'     },
  { label: 'Frequência', to: '/frequencia', icon: 'frequency', modulo: 'frequencia' },
  { label: 'Calendário', to: '/calendario', icon: 'calendar',  modulo: 'calendario' },
].filter(item => !item.modulo || temPermissao(item.modulo)))

const group2 = computed(() => [
  {
    label: 'Cobranças',
    to: '/financeiro',
    icon: 'billing',
    modulo: 'financeiro',
    dot: (badges.value.cobranças ?? 0) > 0,
    dotVariant: 'warning' as const,
  },
  { label: 'Ajustes',        to: '/configuracoes', icon: 'settings', modulo: 'configuracoes' },
  { label: 'Suporte',        to: '/suporte',       icon: 'support'  },
  { label: 'Convide e ganhe',to: '/convite',        icon: 'gift'     },
].filter(item => !item.modulo || temPermissao(item.modulo)))
</script>
