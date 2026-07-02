<template>
  <div class="space-y-4 animate-fade-in">

    <!-- ── Page header ────────────────────────────────────────── -->
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h1 class="page-title">Painel</h1>
        <p class="page-description">
          Bem-vindo de volta, {{ gestorPrimeiro }} · {{ dataHoje }}
        </p>
      </div>

      <!-- Filtro de período dos indicadores -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1 bg-white dark:bg-surface-elevated-dark border border-slate-200 dark:border-white/[0.10] rounded-lg p-0.5">
          <button
            v-for="p in kpiPeriodos"
            :key="p.key"
            class="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
            :class="kpiPeriod === p.key
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'"
            @click="aplicarKpiPeriodo(p.key)"
          >
            {{ p.label }}
          </button>
        </div>
        <div v-if="kpiPeriod === 'custom'" class="flex items-center gap-1.5">
          <input v-model="kpiDe" type="date" :max="kpiAte" class="form-input form-input-sm w-auto"/>
          <span class="text-slate-400 text-xs">até</span>
          <input v-model="kpiAte" type="date" :max="hojeIso" class="form-input form-input-sm w-auto"/>
        </div>
      </div>
    </div>

    <!-- ── Hero stats ─────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="skeleton h-[92px] rounded-2xl" />
      </template>

      <template v-else>
        <UiKpiPastel
          density="compact"
          tone="brand"
          label="Saldo do período"
          :value="formatCurrency(metrics?.saldo_mes ?? 0)"
          :delta="saldoPositivo ? 'Positivo no mês' : 'Atenção: negativo'"
          :trend="saldoPositivo ? 'up' : 'down'"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
          </template>
        </UiKpiPastel>

        <UiKpiPastel
          density="compact"
          tone="violet"
          label="Atletas ativos"
          :value="(metrics?.total_atletas ?? 0).toLocaleString('pt-BR')"
          delta="Total cadastrado"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </template>
        </UiKpiPastel>

        <UiKpiPastel
          density="compact"
          tone="amber"
          label="A receber"
          :value="formatCurrency(metrics?.receita_mes ?? 0)"
          :delta="`${(metrics?.cobranças_pendentes ?? 0)} cobranças pendentes`"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </template>
        </UiKpiPastel>

        <UiKpiPastel
          density="compact"
          tone="emerald"
          :label="`Em dia · cobranças`"
          :value="(metrics?.cobranças_pendentes ?? 0) - (metrics?.cobranças_atraso ?? 0)"
          :delta="(metrics?.cobranças_atraso ?? 0) > 0 ? `${metrics?.cobranças_atraso} em atraso` : 'Tudo em dia'"
          :trend="(metrics?.cobranças_atraso ?? 0) > 0 ? 'down' : 'up'"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </template>
        </UiKpiPastel>
      </template>
    </div>

    <!-- ── Gráfico + Agenda ───────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Receitas e Despesas -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden shadow-card">
        <div class="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500">
                <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Receitas e Despesas</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5 ml-8">Comparativo dos últimos {{ periodLabel }}</p>
          </div>
          <UiPeriodPicker v-model="period" />
        </div>

        <!-- Chart -->
        <div class="px-4 pb-3">
          <div class="max-w-[680px] mx-auto">
            <div v-if="loading" class="skeleton h-[200px] w-full rounded-lg" />
            <UiBarChart
              v-else-if="graficoFinanceiro.length > 0"
              :data="graficoFinanceiro"
              :height="200"
            />
            <UiEmptyState
              v-else
              title="Sem dados ainda"
              description="Os gráficos aparecem após o primeiro mês de movimentação."
              size="sm"
            />
          </div>
        </div>

        <!-- Totals row -->
        <div class="border-t border-slate-100 dark:border-white/[0.07] divide-y divide-slate-100 dark:divide-white/[0.07]">
          <div class="flex items-center justify-between px-5 py-2.5">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                <svg class="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-gray-300">Total de receita</p>
                <p class="text-xs text-slate-500">Comparativo dos últimos {{ periodLabel }}</p>
              </div>
            </div>
            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalReceita) }}</span>
          </div>
          <div class="flex items-center justify-between px-5 py-2.5">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded flex items-center justify-center bg-red-50 dark:bg-red-500/10">
                <svg class="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 6 10.5 15.5 15.5 10.5 23 18"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-gray-300">Total de despesas</p>
                <p class="text-xs text-slate-500">Comparativo dos últimos {{ periodLabel }}</p>
              </div>
            </div>
            <span class="text-sm font-bold text-red-500">{{ formatCurrency(totalDespesa) }}</span>
          </div>
        </div>
      </div>

      <!-- Agenda do dia -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden flex flex-col shadow-card">
        <div class="flex items-center gap-2.5 px-5 py-4 shrink-0">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-slate-900 dark:bg-white/10">
            <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white flex-1">Agenda do dia</h2>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ diaSemanaHoje }}</span>
        </div>

        <!-- Skeleton -->
        <div v-if="loading" class="px-5 pb-4 space-y-3 flex-1">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3">
            <div class="skeleton w-8 h-8 rounded-full shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="skeleton h-3 w-40" />
              <div class="skeleton h-2.5 w-24" />
            </div>
          </div>
        </div>

        <UiEmptyState
          v-else-if="turmasHoje.length === 0"
          size="sm"
          title="Sem treinos hoje"
          description="Aproveite pra planejar a semana."
          class="flex-1"
        />

        <ul v-else class="flex-1 divide-y divide-slate-100 dark:divide-white/[0.07]">
          <li
            v-for="turma in turmasHoje.slice(0, 5)"
            :key="turma.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <!-- Icon -->
            <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-500/15">
              <svg class="w-4 h-4 text-brand-700 dark:text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ turma.nome }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatHorario(turma.horario_inicio, turma.horario_fim) }}</p>
            </div>
            <NuxtLink
              to="/frequencia"
              class="shrink-0 text-xs font-semibold whitespace-nowrap text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Registrar →
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Requer atenção + Convide e ganhe ───────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Requer atenção -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden shadow-card">
        <div class="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-500/10">
            <svg class="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Requer atenção</h2>
        </div>

        <!-- Skeleton -->
        <div v-if="loading" class="px-5 py-4 space-y-3">
          <div v-for="i in 2" :key="i" class="flex items-center gap-3">
            <div class="skeleton w-8 h-8 rounded-full shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="skeleton h-3 w-36" />
              <div class="skeleton h-2.5 w-24" />
            </div>
          </div>
        </div>

        <div v-else-if="atencaoItems.length === 0" class="px-5 py-6 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">✓ Tudo em dia, nenhuma ação urgente.</p>
        </div>

        <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.07]">
          <!-- Cobranças vencidas -->
          <li v-if="(metrics?.cobranças_atraso ?? 0) > 0" class="flex items-center gap-3 px-5 py-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-500/10">
              <svg class="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ metrics!.cobranças_atraso }} cobrança(s) vencida(s)</p>
              <p class="text-xs text-slate-400">Pendentes de pagamento</p>
            </div>
            <NuxtLink to="/financeiro" class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0">Ver →</NuxtLink>
          </li>

          <!-- Atletas com faltas -->
          <li
            v-for="alerta in alertasEvasao.slice(0, 4)"
            :key="alerta.id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-500/10">
              <svg class="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 6 10.5 15.5 15.5 10.5 23 18"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate text-red-400">{{ alerta.atleta?.nome ?? 'Atleta' }}</p>
              <p class="text-xs text-slate-400 truncate">{{ alerta.faltas_consecutivas }} faltas seguidas · {{ alerta.turma?.nome ?? 'Turma' }}</p>
            </div>
            <NuxtLink to="/atletas" class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0">Ver →</NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Convide e ganhe (gradiente ink + glow sutil de marca) -->
      <NuxtLink
        to="/convite"
        class="group relative rounded-xl overflow-hidden flex flex-col p-6 min-h-[200px] bg-gradient-to-br from-ink via-brand-800 to-brand-900"
        style="text-decoration: none;"
      >
        <!-- Camadas decorativas (puramente visuais) -->
        <div aria-hidden="true" class="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-brand-400/25 blur-3xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"/>
        <div aria-hidden="true" class="absolute -bottom-24 -left-12 w-56 h-56 rounded-full bg-accent/10 blur-3xl opacity-60 transition-opacity duration-300 group-hover:opacity-90"/>
        <svg aria-hidden="true" class="absolute -bottom-6 -right-3 w-40 h-40 text-white/[0.05] rotate-12 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>

        <div class="relative flex-1">
          <!-- Badge -->
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 bg-white/10">
            <svg class="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <span class="text-xs font-semibold text-white/90">Programa de indicação</span>
          </div>

          <h3 class="text-2xl font-bold text-white leading-tight mb-1">
            Convide e ganhe
          </h3>
          <p class="text-sm text-white/70 leading-relaxed max-w-[280px]">
            Indique um clube e ganhe <span class="text-white font-semibold">1 mês grátis</span> para cada indicação aprovada.
          </p>
        </div>

        <div class="relative flex items-center justify-between mt-5">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10">
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
              </svg>
            </div>
            <span class="text-sm text-white/60">Sem limite de indicações</span>
          </div>

          <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-accent text-ink">
            Indicar agora
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { DashboardMetrics, AlertaEvasao, Turma, GraficoFinanceiro } from '~/types'
import { formatHorario, formatCurrency } from '~/utils/format'

definePageMeta({ layout: 'default' })
useHead({ title: 'Painel — Athletto' })

const { gestor } = useAuth()
const dashboard = useDashboard()

// ── Período dos indicadores (KPIs) ───────────────────────────
const hojeIso = new Date().toISOString().slice(0, 10)
type KpiPeriodo = 'hoje' | '7d' | '30d' | 'mes' | 'custom'
const kpiPeriodos = [
  { key: 'hoje' as const, label: 'Hoje' },
  { key: '7d' as const,   label: '7 dias' },
  { key: '30d' as const,  label: '30 dias' },
  { key: 'mes' as const,  label: 'Este mês' },
]
const kpiPeriod = ref<KpiPeriodo>('mes')
const kpiDe = ref(new Date().toISOString().slice(0, 7) + '-01')
const kpiAte = ref(hojeIso)

function aplicarKpiPeriodo(p: KpiPeriodo) {
  kpiPeriod.value = p
  const now = new Date()
  if (p === 'custom') return
  if (p === 'mes') {
    kpiDe.value = now.toISOString().slice(0, 7) + '-01'
  } else if (p === 'hoje') {
    kpiDe.value = hojeIso
  } else {
    const dias = p === '7d' ? 7 : 30
    const ini = new Date(now)
    ini.setDate(now.getDate() - dias + 1)
    kpiDe.value = ini.toISOString().slice(0, 10)
  }
  kpiAte.value = hojeIso
}

// ── Period (gráfico mensal) ───────────────────────────────────
const period = ref<string>('6m')
const periodMonths = computed(() => {
  switch (period.value) {
    case '30d': return 1
    case '90d': return 3
    case '6m':  return 6
    case '12m': return 12
    default:    return 6
  }
})
const periodLabel = computed(() => {
  switch (period.value) {
    case '30d': return '30 dias'
    case '90d': return '90 dias'
    case '6m':  return '6 meses'
    case '12m': return '12 meses'
    default:    return '6 meses'
  }
})

// ── Date ──────────────────────────────────────────────────────
const diasSemana = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const mesesNomes = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const agora = new Date()
const diaSemanaHoje = diasSemana[agora.getDay()]
const dataHoje = `${agora.getDate()} de ${mesesNomes[agora.getMonth()]} de ${agora.getFullYear()}`
const gestorPrimeiro = computed(() => gestor.value?.nome?.split(' ')[0] ?? 'gestor')

// ── State ─────────────────────────────────────────────────────
const loading = ref(true)
const metrics = ref<DashboardMetrics | null>(null)
const alertasEvasao = ref<AlertaEvasao[]>([])
const turmasHoje = ref<Turma[]>([])
const graficoFinanceiro = ref<GraficoFinanceiro[]>([])

// ── Computed ──────────────────────────────────────────────────
const saldoPositivo = computed(() => (metrics.value?.saldo_mes ?? 0) >= 0)

const totalReceita = computed(() => graficoFinanceiro.value.reduce((s, d) => s + d.receita, 0))
const totalDespesa = computed(() => graficoFinanceiro.value.reduce((s, d) => s + d.despesa, 0))

const atencaoItems = computed(() => {
  const items: any[] = []
  if ((metrics.value?.cobranças_atraso ?? 0) > 0) items.push('cobrancas')
  items.push(...alertasEvasao.value.slice(0, 4))
  return items
})

// ── Fetch ─────────────────────────────────────────────────────
async function fetchDashboard() {
  loading.value = true
  try {
    // Uma única RPC traz métricas + gráfico + turmas de hoje + alertas.
    const { data, error } = await dashboard.buscarHome(kpiDe.value, kpiAte.value, periodMonths.value)
    if (!error && data) {
      metrics.value = data.metricas ?? null
      graficoFinanceiro.value = (data.grafico ?? []) as GraficoFinanceiro[]
      turmasHoje.value = (data.turmas_hoje ?? []) as Turma[]
      alertasEvasao.value = (data.alertas ?? []) as AlertaEvasao[]
    }
  } finally {
    loading.value = false
  }
}

watch(periodMonths, fetchDashboard)
// Período dos KPIs: recarrega só as métricas (sem piscar o resto do painel).
watch([kpiDe, kpiAte], async () => {
  const { data } = await dashboard.buscarMetricas(kpiDe.value, kpiAte.value)
  if (data) metrics.value = data
})
onMounted(fetchDashboard)
</script>
