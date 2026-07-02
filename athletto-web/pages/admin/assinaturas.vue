<template>
  <div class="space-y-4 animate-fade-in">

    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Assinaturas</h1>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
        Ciclo de cobrança e status de todas as assinaturas
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <AdminKpiCard label="Ativas" :value="String(porStatus.ativa)" icon="financial" accent="#22c55e"/>
      <AdminKpiCard label="Trial" :value="String(porStatus.trial)" icon="gift" accent="#f97316"/>
      <AdminKpiCard label="Inadimplentes" :value="String(porStatus.inadimplente)" icon="billing" accent="#ef4444"/>
      <AdminKpiCard label="Suspensas" :value="String(porStatus.suspensa)" icon="billing" accent="#f97316"/>
      <AdminKpiCard label="Canceladas" :value="String(porStatus.cancelada)" icon="billing" accent="#6b7280"/>
    </div>

    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="todas.length === 0" title="Sem assinaturas"/>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Clube</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Plano</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Próxima cobrança</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Mensal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/[0.06]">
            <tr v-for="a in todas" :key="a.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              <td class="px-5 py-3">
                <NuxtLink v-if="a.clube" :to="`/admin/clubes/${a.clube.id}`" class="font-semibold text-gray-900 dark:text-white hover:underline">
                  {{ a.clube.nome }}
                </NuxtLink>
              </td>
              <td class="px-3 py-3 text-gray-700 dark:text-gray-300">{{ nomePlano(a.plano) }}</td>
              <td class="px-3 py-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="statusTexto(a.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(a.status)"/>
                  <span class="capitalize">{{ a.status }}</span>
                </span>
              </td>
              <td class="px-3 py-3 text-gray-600 dark:text-gray-400">
                <template v-if="a.status === 'trial'">Trial até {{ formatDate(a.trial_fim) }}</template>
                <template v-else-if="a.proxima_cobranca">{{ formatDate(a.proxima_cobranca) }}</template>
                <template v-else>—</template>
              </td>
              <td class="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(a.valor_mensal) }}</td>
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
    case 'cancelada': return 'text-gray-500'
  }
}
function statusDot(s: Assinatura['status']) {
  switch (s) {
    case 'ativa': return 'bg-emerald-500'
    case 'trial': return 'bg-amber-400'
    case 'inadimplente': return 'bg-red-500'
    case 'suspensa': return 'bg-orange-500'
    case 'cancelada': return 'bg-gray-400'
  }
}
</script>
