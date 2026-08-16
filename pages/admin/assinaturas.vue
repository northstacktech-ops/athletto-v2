<template>
  <div class="space-y-4 animate-fade-in">

    <div>
      <h1 class="page-title">Assinaturas</h1>
      <p class="page-description">
        Ciclo de cobrança e status de todas as assinaturas
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <UiKpiPastel density="compact" tone="emerald" label="Ativas" :value="String(porStatus.ativa)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="amber" label="Trial" :value="String(porStatus.trial)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="5" rx="1"/>
            <path d="M12 7v15M20 12v10H4V12"/>
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="rose" label="Inadimplentes" :value="String(porStatus.inadimplente)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="amber" label="Suspensas" :value="String(porStatus.suspensa)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="slate" label="Canceladas" :value="String(porStatus.cancelada)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </template>
      </UiKpiPastel>
    </div>

    <div class="card-base overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="todas.length === 0" title="Sem assinaturas"/>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Clube</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Plano</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Próxima cobrança</th>
              <th class="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Mensal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-for="a in todas" :key="a.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <td class="px-5 py-3">
                <NuxtLink v-if="a.clube" :to="`/admin/clubes/${a.clube.id}`" class="font-semibold text-slate-900 dark:text-white hover:underline">
                  {{ a.clube.nome }}
                </NuxtLink>
              </td>
              <td class="px-3 py-3 text-slate-700 dark:text-slate-300">{{ nomePlano(a.plano) }}</td>
              <td class="px-3 py-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="statusTexto(a.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(a.status)"/>
                  <span class="capitalize">{{ a.status }}</span>
                </span>
              </td>
              <td class="px-3 py-3 text-slate-600 dark:text-slate-400">
                <template v-if="a.status === 'trial'">Trial até {{ formatDate(a.trial_fim) }}</template>
                <template v-else-if="a.proxima_cobranca">{{ formatDate(a.proxima_cobranca) }}</template>
                <template v-else>—</template>
              </td>
              <td class="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">{{ formatCurrency(a.valor_mensal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'
import { nomePlano, type Assinatura } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Assinaturas' })

const assinaturas = useAssinaturas()

const loading = ref(true)
const todas = ref<Assinatura[]>([])

onMounted(async () => {
  loading.value = true
  const { data } = await assinaturas.listar()
  todas.value = data ?? []
  loading.value = false
})

const porStatus = computed(() => ({
  ativa: todas.value.filter((a) => a.status === 'ativa').length,
  trial: todas.value.filter((a) => a.status === 'trial').length,
  inadimplente: todas.value.filter((a) => a.status === 'inadimplente').length,
  suspensa: todas.value.filter((a) => a.status === 'suspensa').length,
  cancelada: todas.value.filter((a) => a.status === 'cancelada').length,
}))

function statusTexto(s: Assinatura['status']) {
  switch (s) {
    case 'ativa': return 'text-emerald-600 dark:text-emerald-400'
    case 'trial': return 'text-amber-600 dark:text-amber-400'
    case 'inadimplente': return 'text-red-600 dark:text-red-400'
    case 'suspensa': return 'text-orange-600 dark:text-orange-400'
    case 'cancelada': return 'text-slate-500'
  }
}
function statusDot(s: Assinatura['status']) {
  switch (s) {
    case 'ativa': return 'bg-emerald-500'
    case 'trial': return 'bg-amber-400'
    case 'inadimplente': return 'bg-red-500'
    case 'suspensa': return 'bg-orange-500'
    case 'cancelada': return 'bg-slate-400'
  }
}
</script>
