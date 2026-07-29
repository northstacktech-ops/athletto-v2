<template>
  <div class="space-y-4 animate-fade-in">

    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Financeiro do sistema</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Receita Athletto, taxas, reembolsos e despesas operacionais</p>
      </div>
      <input
        v-model="mes"
        type="month"
        class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"
      />
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <AdminKpiCard label="Receita bruta" :value="formatCurrency(resumo.receita)" icon="financial" accent="#22c55e"/>
      <AdminKpiCard label="Taxas (gateway)" :value="formatCurrency(resumo.taxas)" icon="billing" accent="#f97316"/>
      <AdminKpiCard label="Reembolsos" :value="formatCurrency(resumo.reembolsos)" icon="billing" accent="#ef4444"/>
      <AdminKpiCard label="Despesas op." :value="formatCurrency(resumo.despesas)" icon="billing" accent="#6b7280"/>
      <AdminKpiCard label="Líquido" :value="formatCurrency(resumo.liquido)" icon="financial" accent="#3d5afe"/>
    </div>

    <!-- Filtros + ação -->
    <div class="flex items-center gap-2 flex-wrap">
      <select v-model="filtroTipo" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium">
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
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="filtradas.length === 0" title="Sem lançamentos" description="Nenhuma movimentação nesse período."/>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Data</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Tipo</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Descrição</th>
              <th class="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Clube</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/[0.06]">
            <tr v-for="m in filtradas" :key="m.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              <td class="px-5 py-3 text-gray-500">{{ formatDate(m.data) }}</td>
              <td class="px-3 py-3">
                <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" :class="tipoCor(m.tipo)">
                  {{ tipoLabel(m.tipo) }}
                </span>
              </td>
              <td class="px-3 py-3 text-gray-700 dark:text-gray-300 max-w-[300px] truncate">{{ m.descricao }}</td>
              <td class="px-3 py-3">
                <NuxtLink v-if="m.clube_id" :to="`/admin/clubes/${m.clube_id}`" class="text-sm font-semibold hover:underline" style="color: #3d5afe;">
                  {{ m.clube?.nome ?? m.clube_id }}
                </NuxtLink>
                <span v-else class="text-gray-400">—</span>
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

async function carregar() {
  loading.value = true
  const { data } = await adminFin.listarMovimentacoes({
    desde: `${mes.value}-01`,
    ate: `${mes.value}-31`,
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
    case 'despesa_operacional': return 'bg-gray-100 text-gray-700'
  }
}
function valorCor(t: SistemaMovTipo) {
  switch (t) {
    case 'mensalidade_recebida': return 'text-emerald-600'
    case 'taxa_gateway': return 'text-orange-600'
    case 'reembolso': return 'text-red-600'
    case 'despesa_operacional': return 'text-gray-700 dark:text-gray-300'
  }
}
function sinal(t: SistemaMovTipo) {
  return t === 'mensalidade_recebida' ? '+' : '−'
}
</script>
