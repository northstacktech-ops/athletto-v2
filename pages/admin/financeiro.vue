<template>
  <div class="space-y-4 animate-fade-in">

    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Financeiro do sistema</h1>
        <p class="page-description">Receita Athletto, taxas, reembolsos e despesas operacionais</p>
      </div>
      <input
        v-model="mes"
        type="month"
        class="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"
      />
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <UiKpiPastel density="compact" tone="emerald" label="Receita bruta" :value="formatCurrency(resumo.receita)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="amber" label="Taxas (gateway)" :value="formatCurrency(resumo.taxas)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="rose" label="Reembolsos" :value="formatCurrency(resumo.reembolsos)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="slate" label="Despesas op." :value="formatCurrency(resumo.despesas)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </template>
      </UiKpiPastel>
      <UiKpiPastel density="compact" tone="brand" label="Líquido" :value="formatCurrency(resumo.liquido)">
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </template>
      </UiKpiPastel>
    </div>

    <!-- Filtros + ação -->
    <div class="flex items-center gap-2 flex-wrap">
      <select v-model="filtroTipo" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium">
        <option value="">Todos os tipos</option>
        <option value="mensalidade_recebida">Mensalidades</option>
        <option value="taxa_gateway">Taxas</option>
        <option value="reembolso">Reembolsos</option>
        <option value="despesa_operacional">Despesas</option>
      </select>
      <div class="ml-auto">
        <button
          class="px-3 py-2 rounded-lg text-sm font-semibold text-white"
          style="background-color: #3d5afe;"
          @click="abrirManual = true"
        >
          + Lançamento manual
        </button>
      </div>
    </div>

    <!-- Tabela -->
    <div class="card-base overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="filtradas.length === 0" title="Sem lançamentos" description="Nenhuma movimentação nesse período."/>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Data</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Tipo</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Descrição</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Clube</th>
              <th class="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-for="m in filtradas" :key="m.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <td class="px-5 py-3 text-slate-500">{{ formatDate(m.data) }}</td>
              <td class="px-3 py-3">
                <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" :class="tipoCor(m.tipo)">
                  {{ tipoLabel(m.tipo) }}
                </span>
              </td>
              <td class="px-3 py-3 text-slate-700 dark:text-slate-300 max-w-[300px] truncate">{{ m.descricao }}</td>
              <td class="px-3 py-3">
                <NuxtLink v-if="m.clube_id" :to="`/admin/clubes/${m.clube_id}`" class="text-sm font-semibold hover:underline" style="color: #3d5afe;">
                  {{ m.clube?.nome ?? m.clube_id }}
                </NuxtLink>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-5 py-3 text-right font-bold" :class="valorCor(m.tipo)">
                {{ sinal(m.tipo) }}{{ formatCurrency(m.valor) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal lançamento manual -->
    <AdminManualMovModal v-if="abrirManual" @close="abrirManual = false" @ok="onLancamento"/>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'
import type { MovimentacaoFinanceiraSistema, SistemaMovTipo } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Financeiro' })

const adminFin = useAdminFinanceiro()

const loading = ref(true)
const todas = ref<MovimentacaoFinanceiraSistema[]>([])
const mes = ref(new Date().toISOString().slice(0, 7))
const filtroTipo = ref('')
const abrirManual = ref(false)

const resumo = ref({ receita: 0, taxas: 0, reembolsos: 0, despesas: 0, liquido: 0 })

function ultimoDiaDoMes(referencia: string) {
  const [ano, mesNum] = referencia.split('-').map(Number)
  return new Date(Date.UTC(ano, mesNum, 0)).toISOString().slice(0, 10)
}

async function carregar() {
  loading.value = true
  const { data } = await adminFin.listarMovimentacoes({
    desde: `${mes.value}-01`,
    ate: ultimoDiaDoMes(mes.value),
  })
  todas.value = data ?? []
  resumo.value = await adminFin.resumoFinanceiro(mes.value)
  loading.value = false
}

watch(mes, carregar)
onMounted(carregar)

const filtradas = computed(() => {
  if (!filtroTipo.value) return todas.value
  return todas.value.filter((m) => m.tipo === filtroTipo.value)
})

function onLancamento() {
  abrirManual.value = false
  carregar()
}

function tipoLabel(t: SistemaMovTipo) {
  switch (t) {
    case 'mensalidade_recebida': return 'Mensalidade'
    case 'taxa_gateway': return 'Taxa'
    case 'reembolso': return 'Reembolso'
    case 'despesa_operacional': return 'Despesa'
  }
}
function tipoCor(t: SistemaMovTipo) {
  switch (t) {
    case 'mensalidade_recebida': return 'bg-emerald-50 text-emerald-700'
    case 'taxa_gateway': return 'bg-orange-50 text-orange-700'
    case 'reembolso': return 'bg-red-50 text-red-700'
    case 'despesa_operacional': return 'bg-slate-100 text-slate-700'
  }
}
function valorCor(t: SistemaMovTipo) {
  switch (t) {
    case 'mensalidade_recebida': return 'text-emerald-600'
    case 'taxa_gateway': return 'text-orange-600'
    case 'reembolso': return 'text-red-600'
    case 'despesa_operacional': return 'text-slate-700 dark:text-slate-300'
  }
}
function sinal(t: SistemaMovTipo) {
  return t === 'mensalidade_recebida' ? '+' : '−'
}
</script>
