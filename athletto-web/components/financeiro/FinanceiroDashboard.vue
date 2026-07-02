<template>
  <div class="space-y-5">

    <!-- ── KPIs primários ───────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="skeleton h-[92px] rounded-2xl"/>
      </template>
      <template v-else>
        <UiKpiPastel density="compact" tone="brand" label="Saldo do período" :value="formatCurrency(saldo)" :delta="saldo >= 0 ? 'Resultado positivo' : 'Resultado negativo'" :trend="saldo >= 0 ? 'up' : 'down'">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </template>
        </UiKpiPastel>

        <UiKpiPastel density="compact" tone="emerald" label="Receita do mês" :value="formatCurrency(receita)" delta="Entradas confirmadas">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </template>
        </UiKpiPastel>

        <UiKpiPastel density="compact" tone="amber" label="A receber" :value="formatCurrency(aReceber)" :delta="atrasoCount > 0 ? `${atrasoCount} em atraso` : 'Tudo em dia'" :trend="atrasoCount > 0 ? 'down' : 'neutral'">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </template>
        </UiKpiPastel>
      </template>
    </div>

    <!-- ── Indicadores secundários (faixa) ──────────────────────────────── -->
    <div v-if="!loading" class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/[0.06]">
      <div class="px-4 py-3">
        <p class="text-[11px] uppercase tracking-wider text-slate-400">Despesas do mês</p>
        <p class="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate">{{ formatCurrency(despesa) }}</p>
      </div>
      <div class="px-4 py-3">
        <p class="text-[11px] uppercase tracking-wider text-slate-400">Taxa de arrecadação</p>
        <p class="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
          {{ taxaArrecadacao }}%
          <span class="text-[11px] font-medium text-slate-400">· {{ cobsTotais > 0 ? cobsPagas : '—' }}/{{ cobsTotais }}</span>
        </p>
      </div>
      <div class="px-4 py-3">
        <p class="text-[11px] uppercase tracking-wider text-slate-400">Margem do período</p>
        <p class="text-base font-bold mt-0.5 truncate" :class="margem >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'">{{ margem }}%</p>
      </div>
    </div>

    <!-- ── Linha 2: Gráfico misto + Donut ───────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Receita / Despesa / Saldo acumulado -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-5">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Receita & Despesa</h2>
            <p class="text-xs text-slate-500 mt-0.5">Últimos 6 meses com saldo acumulado</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block"/> Receita</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block"/> Despesa</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Saldo acum.</span>
          </div>
        </div>
        <div v-if="loading" class="skeleton h-[220px] rounded-lg"/>
        <ClientOnly v-else>
          <VChart :option="optionMixed" :style="{ height: '220px' }" autoresize />
        </ClientOnly>
      </div>

      <!-- Despesas por categoria (donut) -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-5">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Despesas por categoria</h2>
        <p class="text-xs text-slate-500 mt-0.5 mb-3">Composição dos 6 meses</p>
        <div v-if="loading" class="skeleton h-[220px] rounded-lg"/>
        <ClientOnly v-else-if="despesasPorCategoria.length > 0">
          <VChart :option="optionDonut" :style="{ height: '220px' }" autoresize />
        </ClientOnly>
        <UiEmptyState v-else size="sm" title="Sem despesas" description="Nenhuma saída registrada." />
      </div>
    </div>

    <!-- ── Linha 3: Barras caixinhas + Status cobranças ──────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Progresso das caixinhas (barras horizontais) -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-5">
        <div class="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Progresso das caixinhas</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pago vs pendente vs meta</p>
          </div>
          <NuxtLink to="/financeiro#caixinhas" class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Ver todas →</NuxtLink>
        </div>
        <div v-if="loading" class="skeleton h-[160px] rounded-lg"/>
        <ClientOnly v-else-if="caixinhas.length > 0">
          <VChart :option="optionCaixinhas" :style="{ height: `${Math.max(120, caixinhas.length * 52)}px` }" autoresize />
        </ClientOnly>
        <UiEmptyState v-else size="sm" title="Sem caixinhas" description="Crie um planejamento para começar." />
      </div>

      <!-- Status das cobranças -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-5">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Status das cobranças</h2>
        <p class="text-xs text-slate-500 mt-0.5 mb-3">{{ cobsTotais }} cobranças no total</p>
        <div v-if="loading" class="skeleton h-[200px] rounded-lg"/>
        <ClientOnly v-else-if="cobsTotais > 0">
          <VChart :option="optionStatus" :style="{ height: '200px' }" autoresize />
        </ClientOnly>
        <UiEmptyState v-else size="sm" title="Sem cobranças" description="Ative um planejamento para gerar cobranças." />

        <!-- Legenda detalhada -->
        <div v-if="!loading && cobsTotais > 0" class="mt-3 space-y-1.5 text-xs">
          <div v-for="item in statusLegenda" :key="item.label" class="flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full inline-block" :style="{ background: item.color }"/>
              <span class="text-slate-600 dark:text-slate-400">{{ item.label }}</span>
            </span>
            <span class="font-semibold text-slate-900 dark:text-white">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { formatCurrency } from '~/utils/format'
import type { Caixinha, GraficoFinanceiro } from '~/types'

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const fin = useFinanceiro()
const dash = useDashboard()

const loading = ref(true)
const receita = ref(0)
const despesa = ref(0)
const aReceber = ref(0)
const atrasoCount = ref(0)
const serie = ref<GraficoFinanceiro[]>([])
const caixinhas = ref<Caixinha[]>([])

// Status das cobranças e despesas por categoria vêm prontos do Postgres
// (RPC financeiro_resumo) — nada disso é mais somado no navegador.
const statusDados = ref({ pagas: 0, atrasadas: 0, pendentes: 0, isentas: 0, canceladas: 0 })
const cobsTotais = ref(0)
const despesasPorCategoriaRaw = ref<{ categoria: string; valor: number }[]>([])

const saldo = computed(() => receita.value - despesa.value)

// ── KPIs derivados ──────────────────────────────────────────────────────────
const cobsPagas = computed(() => statusDados.value.pagas)
const taxaArrecadacao = computed(() =>
  cobsTotais.value > 0 ? Math.round((cobsPagas.value / cobsTotais.value) * 100) : 0,
)
const margem = computed(() =>
  receita.value > 0 ? Math.round((saldo.value / receita.value) * 100) : 0,
)

// ── Despesas por categoria ──────────────────────────────────────────────────
const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4']

const despesasPorCategoria = computed(() =>
  despesasPorCategoriaRaw.value.map((c, i) => ({
    name: c.categoria,
    value: c.valor,
    itemStyle: { color: PALETTE[i % PALETTE.length] },
  })),
)

// ── Saldo acumulado ─────────────────────────────────────────────────────────
const saldoAcumulado = computed(() =>
  serie.value.reduce<number[]>((acc, m, i) => {
    const prev = acc[i - 1] ?? 0
    acc.push(Math.round((prev + m.receita - m.despesa) * 100) / 100)
    return acc
  }, []),
)

// ── Status das cobranças (legenda; os dados vêm da RPC financeiro_resumo) ───
const statusLegenda = computed(() => [
  { label: 'Pagas', count: statusDados.value.pagas, color: '#10b981' },
  { label: 'Pendentes', count: statusDados.value.pendentes, color: '#f59e0b' },
  { label: 'Atrasadas', count: statusDados.value.atrasadas, color: '#f43f5e' },
  { label: 'Isentas', count: statusDados.value.isentas, color: '#8b5cf6' },
  { label: 'Canceladas', count: statusDados.value.canceladas, color: '#94a3b8' },
])

// ── Opções ECharts ──────────────────────────────────────────────────────────
const baseText = { color: '#64748b', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif' }

const optionMixed = computed(() => ({
  animation: true,
  grid: { top: 8, right: 12, bottom: 28, left: 60, containLabel: false },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#0f172a', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    formatter: (params: any[]) => {
      const lines = params.map((p: any) => {
        const val = typeof p.value === 'number'
          ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : p.value
        return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>${p.seriesName}: <b>${val}</b>`
      })
      return `<div style="font-size:12px"><b>${params[0]?.axisValue}</b><br/>${lines.join('<br/>')}</div>`
    },
  },
  xAxis: {
    type: 'category',
    data: serie.value.map((s) => s.mes),
    axisLabel: { ...baseText },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#e2e8f0' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { ...baseText, formatter: (v: number) => `R$\u00a0${(v / 1000).toFixed(0)}k` },
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
  },
  series: [
    {
      name: 'Receita',
      type: 'bar',
      data: serie.value.map((s) => s.receita),
      itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 28,
    },
    {
      name: 'Despesa',
      type: 'bar',
      data: serie.value.map((s) => s.despesa),
      itemStyle: { color: '#fb7185', borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 28,
    },
    {
      name: 'Saldo acum.',
      type: 'line',
      smooth: true,
      data: saldoAcumulado.value,
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981' },
      symbol: 'circle',
      symbolSize: 5,
      areaStyle: { color: 'rgba(16,185,129,0.06)' },
    },
  ],
}))

const optionDonut = computed(() => ({
  animation: true,
  tooltip: {
    trigger: 'item',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#0f172a', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    formatter: (p: any) =>
      `<b>${p.name}</b><br/>${p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${p.percent}%)`,
  },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: true,
    data: despesasPorCategoria.value,
    label: {
      show: true,
      position: 'outside',
      formatter: (p: any) => `${p.name.split(' ')[0]}\n${p.percent}%`,
      fontSize: 10,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#64748b',
    },
    labelLine: { length: 8, length2: 6, lineStyle: { color: '#cbd5e1' } },
    emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.08)' } },
  }],
}))

const optionCaixinhas = computed(() => {
  const nomes = caixinhas.value.map((c) => c.nome)
  const pago = caixinhas.value.map((c) => c.total_pago)
  const pendente = caixinhas.value.map((c) => c.total_pendente)
  const meta = caixinhas.value.map((c) => c.total_previsto)
  return {
    animation: true,
    grid: { top: 8, right: 16, bottom: 8, left: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#0f172a', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' },
      formatter: (params: any[]) => {
        const lines = params.map((p: any) =>
          `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:5px"></span>${p.seriesName}: <b>${p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>`
        )
        return `<div style="font-size:12px"><b>${params[0]?.axisValue}</b><br/>${lines.join('<br/>')}</div>`
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: { ...baseText, formatter: (v: number) => `R$\u00a0${v.toLocaleString('pt-BR')}` },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: nomes,
      axisLabel: { ...baseText, width: 140, overflow: 'truncate' },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Meta',
        type: 'bar',
        data: meta,
        itemStyle: { color: '#f1f5f9', borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 20,
        barGap: '-100%',
        z: 1,
      },
      {
        name: 'Pago',
        type: 'bar',
        stack: 'total',
        data: pago,
        itemStyle: { color: '#10b981', borderRadius: [0, 0, 0, 0] },
        barMaxWidth: 20,
        z: 2,
      },
      {
        name: 'Pendente',
        type: 'bar',
        stack: 'total',
        data: pendente,
        itemStyle: { color: '#fbbf24', borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 20,
        z: 2,
      },
    ],
  }
})

const optionStatus = computed(() => ({
  animation: true,
  tooltip: {
    trigger: 'item',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#0f172a', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    formatter: (p: any) => `<b>${p.name}</b>: ${p.value} (${p.percent}%)`,
  },
  series: [{
    type: 'pie',
    radius: ['55%', '80%'],
    center: ['50%', '50%'],
    data: [
      { name: 'Pagas',      value: statusDados.value.pagas,      itemStyle: { color: '#10b981' } },
      { name: 'Pendentes',  value: statusDados.value.pendentes,  itemStyle: { color: '#fbbf24' } },
      { name: 'Atrasadas',  value: statusDados.value.atrasadas,  itemStyle: { color: '#f43f5e' } },
      { name: 'Isentas',    value: statusDados.value.isentas,    itemStyle: { color: '#8b5cf6' } },
      { name: 'Canceladas', value: statusDados.value.canceladas, itemStyle: { color: '#cbd5e1' } },
    ].filter((d) => d.value > 0),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.08)' } },
  }],
}))

// ── Carregamento ────────────────────────────────────────────────────────────
// 3 chamadas, todas agregadas no Postgres — nenhuma busca linha a linha de
// transações/cobranças pra somar no navegador (era o gargalo antigo).
onMounted(async () => {
  loading.value = true

  const [{ data: resumo }, { data: cx }, { data: graf }] = await Promise.all([
    fin.buscarResumoDashboard(6),
    fin.listarCaixinhas(),
    dash.buscarGrafico(6),
  ])

  receita.value = resumo?.receita_mes ?? 0
  despesa.value = resumo?.despesa_mes ?? 0
  aReceber.value = resumo?.a_receber ?? 0
  atrasoCount.value = resumo?.atraso_count ?? 0
  cobsTotais.value = resumo?.status_cobrancas?.total ?? 0
  statusDados.value = {
    pagas: resumo?.status_cobrancas?.pagas ?? 0,
    atrasadas: resumo?.status_cobrancas?.atrasadas ?? 0,
    pendentes: resumo?.status_cobrancas?.pendentes ?? 0,
    isentas: resumo?.status_cobrancas?.isentas ?? 0,
    canceladas: resumo?.status_cobrancas?.canceladas ?? 0,
  }
  despesasPorCategoriaRaw.value = resumo?.despesas_por_categoria ?? []
  caixinhas.value = cx ?? []
  serie.value = graf ?? []
  loading.value = false
})
</script>
