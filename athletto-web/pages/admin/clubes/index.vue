<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Clubes</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {{ clubesFiltrados.length }} de {{ todos.length }} clubes
        </p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[200px]">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar por nome, slug ou CNPJ..."
            class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <select v-model="filtroStatus" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium focus:outline-none">
          <option value="">Todos os status</option>
          <option value="ativa">Ativos</option>
          <option value="trial">Em trial</option>
          <option value="inadimplente">Inadimplentes</option>
          <option value="cancelada">Cancelados</option>
          <option value="suspensa">Suspensos</option>
        </select>

        <select v-model="filtroPlano" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium focus:outline-none">
          <option value="">Todos os planos</option>
          <option value="basico">Base</option>
          <option value="intermediario">Pro</option>
          <option value="profissional">Elite</option>
        </select>
      </div>
    </div>

    <!-- Tabela -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg" />
      </div>

      <UiEmptyState
        v-else-if="clubesFiltrados.length === 0"
        title="Nenhum clube encontrado"
        description="Ajuste os filtros para encontrar o clube desejado."
      />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Clube</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Plano</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Trial / Próxima cobrança</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">MRR</th>
              <th class="px-3 py-3"/>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/[0.06]">
            <tr v-for="c in clubesFiltrados" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style="background-color: #3d5afe;">
                    {{ getIniciais(c.nome) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-gray-900 dark:text-white truncate">{{ c.nome }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ c.slug }} · {{ c.modalidade ?? 'sem modalidade' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">
                <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize"
                      :class="planoBadge(c.plano)">
                  {{ nomePlano(c.plano) }}
                </span>
              </td>
              <td class="px-3 py-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="statusTexto(c.assinatura?.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(c.assinatura?.status)"/>
                  {{ statusLabel(c.assinatura?.status) }}
                </span>
              </td>
              <td class="px-3 py-3 text-gray-600 dark:text-gray-400">
                <template v-if="c.assinatura?.status === 'trial'">
                  Trial até {{ formatDate(c.assinatura.trial_fim) }}
                </template>
                <template v-else-if="c.assinatura?.proxima_cobranca">
                  Próx. {{ formatDate(c.assinatura.proxima_cobranca) }}
                </template>
                <template v-else>—</template>
              </td>
              <td class="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(c.assinatura?.valor_mensal ?? 0) }}
              </td>
              <td class="px-3 py-3 text-right">
                <NuxtLink :to="`/admin/clubes/${c.id}`" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 transition-colors">
                  Ver
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate, getIniciais } from '~/utils/format'
import { nomePlano, type Clube, type Assinatura } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Clubes' })

const adminClubes = useAdminClubes()

const loading = ref(true)
const todos = ref<(Clube & { assinatura: Assinatura | null })[]>([])
const busca = ref('')
const filtroStatus = ref('')
const filtroPlano = ref('')

onMounted(async () => {
  loading.value = true
  const { data } = await adminClubes.listar()
  todos.value = (data ?? []) as any
  loading.value = false
})

const clubesFiltrados = computed(() => {
  return todos.value.filter((c) => {
    if (filtroPlano.value && c.plano !== filtroPlano.value) return false
    if (filtroStatus.value && c.assinatura?.status !== filtroStatus.value) return false
    if (busca.value) {
      const q = busca.value.toLowerCase()
      if (!c.nome.toLowerCase().includes(q) && !c.slug.toLowerCase().includes(q) && !(c.cnpj ?? '').includes(q)) {
        return false
      }
    }
    return true
  })
})

function planoBadge(plano: Clube['plano']) {
  switch (plano) {
    case 'basico': return 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300'
    case 'intermediario': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'profissional': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }
}

function statusLabel(s?: Assinatura['status']) {
  switch (s) {
    case 'ativa': return 'Ativa'
    case 'trial': return 'Trial'
    case 'inadimplente': return 'Inadimplente'
    case 'cancelada': return 'Cancelada'
    case 'suspensa': return 'Suspensa'
    default: return '—'
  }
}
function statusDot(s?: Assinatura['status']) {
  switch (s) {
    case 'ativa': return 'bg-emerald-500'
    case 'trial': return 'bg-amber-400'
    case 'inadimplente': return 'bg-red-500'
    case 'cancelada': return 'bg-gray-400'
    case 'suspensa': return 'bg-orange-500'
    default: return 'bg-gray-300'
  }
}
function statusTexto(s?: Assinatura['status']) {
  switch (s) {
    case 'ativa': return 'text-emerald-600 dark:text-emerald-400'
    case 'trial': return 'text-amber-600 dark:text-amber-400'
    case 'inadimplente': return 'text-red-600 dark:text-red-400'
    case 'cancelada': return 'text-gray-500'
    case 'suspensa': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-gray-500'
  }
}
</script>
