<template>
  <aside
    class="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col transition-all duration-300"
    :class="expanded ? 'w-[280px]' : 'w-[64px]'"
    style="background-color: #0b0d12;"
  >
    <!-- ── Brand ────────────────────────────────────────────────── -->
    <div
      class="flex items-center h-[79px] px-6 shrink-0 gap-3"
      :class="!expanded && 'justify-center px-0'"
    >
      <div class="shrink-0 w-9 h-9 flex items-center justify-center" style="color: #ccff00;">
        <BrandMark class="w-9 h-9" />
      </div>

      <div v-if="expanded" class="min-w-0 flex-1">
        <p class="text-xl font-bold leading-tight text-white">Athletto</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider"
                style="background-color: #ccff00; color: #0b0d12;">
            ADMIN
          </span>
          <span class="text-xs text-white/50">Painel global</span>
        </div>
      </div>

      <button
        v-if="expanded"
        class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
        style="background-color: #1e2028; border: 1px solid rgba(255,255,255,0.1);"
        title="Recolher (Ctrl+B)"
        @click="$emit('toggle')"
      >
        <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>

    <!-- ── Nav ──────────────────────────────────────────────────── -->
    <nav class="flex-1 overflow-y-auto no-scrollbar py-2" :class="expanded ? 'px-6' : 'px-2.5'">

      <div :class="expanded ? 'space-y-0.5' : 'space-y-1 flex flex-col items-center'">
        <AdminSidebarItem v-for="item in group1" :key="item.to" :item="item" :collapsed="!expanded" />
      </div>

      <div class="my-3" :class="expanded ? 'border-t border-white/[0.08]' : 'w-8 border-t border-white/[0.08] mx-auto'" />

      <div :class="expanded ? 'space-y-0.5' : 'space-y-1 flex flex-col items-center'">
        <AdminSidebarItem v-for="item in group2" :key="item.to" :item="item" :collapsed="!expanded" />
      </div>

      <div class="my-3" :class="expanded ? 'border-t border-white/[0.08]' : 'w-8 border-t border-white/[0.08] mx-auto'" />

      <div :class="expanded ? 'space-y-0.5' : 'space-y-1 flex flex-col items-center'">
        <AdminSidebarItem v-for="item in group3" :key="item.to" :item="item" :collapsed="!expanded" />
      </div>
    </nav>

    <!-- ── Voltar para o produto ────────────────────────────────── -->
    <div class="shrink-0 border-t py-3" style="border-color: rgba(255,255,255,0.07);" :class="expanded ? 'px-6' : 'px-2.5'">
      <NuxtLink
        to="/"
        class="flex items-center rounded-xl transition-colors"
        :class="expanded ? 'gap-3 px-2 py-2 hover:bg-white/[0.04]' : 'justify-center py-2 hover:bg-white/[0.04]'"
        :title="expanded ? '' : 'Voltar ao painel do clube'"
      >
        <div class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style="background-color: rgba(255,255,255,0.06);">
          <svg class="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
        <div v-if="expanded" class="min-w-0 flex-1">
          <p class="text-sm font-medium text-white/80">Voltar ao painel</p>
          <p class="text-xs text-white/40">Modo gestor</p>
        </div>
      </NuxtLink>
    </div>

    <!-- ── Footer (perfil superadmin) ───────────────────────────── -->
    <div
      class="shrink-0 border-t py-4"
      style="border-color: rgba(255,255,255,0.07);"
      :class="expanded ? 'px-6' : 'px-2.5'"
    >
      <div
        class="flex items-center rounded-xl transition-colors cursor-default"
        :class="expanded ? 'gap-3 hover:bg-white/[0.04] px-2 py-1.5' : 'justify-center'"
      >
        <div
          class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style="background-color: #ccff00; color: #0b0d12;"
        >
          {{ adminIniciais }}
        </div>

        <div v-if="expanded" class="min-w-0 flex-1">
          <p class="text-base font-medium truncate text-white">{{ superadmin?.nome ?? 'Superadmin' }}</p>
          <p class="text-xs font-medium uppercase tracking-wide" style="color: #ccff00;">
            {{ superadmin?.role ?? 'admin' }}
          </p>
        </div>
      </div>
    </div>

    <button
      v-if="!expanded"
      class="absolute -right-3 top-[72px] w-6 h-6 rounded-full border flex items-center justify-center z-10"
      style="background-color: #1e2028; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);"
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

defineProps<{ expanded: boolean }>()
defineEmits<{ (e: 'toggle'): void }>()

const { superadmin } = useAdminAuth()
const dashboard = useAdminDashboard()

const adminIniciais = computed(() => getIniciais(superadmin.value?.nome || 'A'))

const badges = ref({
  indicacoes: 0,
  webhooks: 0,
})

onMounted(async () => {
  const m = await dashboard.buscarMetricas()
  if (m.data) {
    badges.value.indicacoes = m.data.indicacoes_pendentes
    badges.value.webhooks = m.data.webhooks_falhos_24h
  }
})

const group1 = computed(() => [
  { label: 'Visão geral', to: '/admin', icon: 'dashboard', exact: true },
  { label: 'Clubes', to: '/admin/clubes', icon: 'athletes' },
  { label: 'Assinaturas', to: '/admin/assinaturas', icon: 'billing' },
])

const group2 = computed(() => [
  { label: 'Vouchers', to: '/admin/vouchers', icon: 'gift' },
  {
    label: 'Indicações',
    to: '/admin/indicacoes',
    icon: 'support',
    dot: badges.value.indicacoes > 0,
    dotVariant: 'warning' as const,
  },
  { label: 'Financeiro', to: '/admin/financeiro', icon: 'frequency' },
])

const group3 = computed(() => [
  {
    label: 'Webhooks',
    to: '/admin/webhooks',
    icon: 'calendar',
    dot: badges.value.webhooks > 0,
    dotVariant: 'warning' as const,
  },
  { label: 'Auditoria', to: '/admin/auditoria', icon: 'groups' },
  { label: 'Configurações', to: '/admin/configuracoes', icon: 'settings' },
])
</script>
