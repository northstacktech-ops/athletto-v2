<template>
  <div class="space-y-4 animate-fade-in">

    <!-- ── Header ────────────────────────────────────────────── -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
        Visão geral do sistema
      </h1>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
        Bem-vindo, {{ adminPrimeiro }} · saúde da plataforma em tempo real
      </p>
    </div>

    <!-- ── KPIs principais ──────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="skeleton h-[80px] rounded-xl" />
      </template>
      <template v-else>
        <AdminKpiCard label="MRR" :value="formatCurrency(metrics?.mrr ?? 0)" icon="financial" accent="#3d5afe" />
        <AdminKpiCard label="Clubes ativos" :value="`${metrics?.clubes_ativos ?? 0} de ${metrics?.total_clubes ?? 0}`" icon="athletes" accent="#3d5afe" />
        <AdminKpiCard label="Em trial" :value="String(metrics?.clubes_trial ?? 0)" icon="gift" accent="#f97316" :badge="trialsAVencer.length > 0 ? `${trialsAVencer.length} vencem em 7d` : null" />
        <AdminKpiCard label="Inadimplentes" :value="String(metrics?.clubes_inadimplentes ?? 0)" icon="billing" accent="#ef4444" />
      </template>
    </div>

    <!-- ── Linha 2: ARR, churn, atletas, gestores ───────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="skeleton h-[80px] rounded-xl" />
      </template>
      <template v-else>
        <AdminKpiCard label="ARR projetado" :value="formatCurrency(metrics?.arr ?? 0)" icon="financial" accent="#22c55e" />
        <AdminKpiCard label="Churn (mês)" :value="`${metrics?.churn_mes_percent ?? 0}%`" icon="frequency" accent="#ef4444" />
        <AdminKpiCard label="Atletas (sistema)" :value="(metrics?.total_atletas ?? 0).toLocaleString('pt-BR')" icon="athletes" accent="#3d5afe" />
        <AdminKpiCard label="Gestores (sistema)" :value="String(metrics?.total_gestores ?? 0)" icon="groups" accent="#3d5afe" />
      </template>
    </div>

    <!-- ── Gráfico de crescimento + Trials a vencer ─────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Gráfico -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
        <div class="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Crescimento MRR</h2>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Receita recorrente nos últimos 6 meses
            </p>
          </div>
        </div>
        <div class="px-4 pb-4">
          <div v-if="loading" class="skeleton h-[180px] w-full rounded-lg" />
          <UiAreaChart
            v-else-if="crescimento.length > 0"
            :labels="crescimentoLabels"
            :series="crescimentoSeries"
            :height="180"
          />
          <UiEmptyState
            v-else
            title="Sem dados"
            description="Os gráficos aparecem após o primeiro mês."
            size="sm"
          />
        </div>
      </div>

      <!-- Trials a vencer -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background-color: #fff7ed;">
            <svg class="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white flex-1">Trials a vencer</h2>
          <span class="text-xs text-gray-400">{{ trialsAVencer.length }}</span>
        </div>

        <div v-if="loading" class="p-5 space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-12 rounded-lg" />
        </div>

        <UiEmptyState
          v-else-if="trialsAVencer.length === 0"
          title="Sem urgências"
          description="Nenhum trial expira nos próximos 7 dias."
          size="sm"
          class="flex-1"
        />

        <ul v-else class="flex-1 divide-y divide-gray-100 dark:divide-white/[0.07]">
          <li v-for="a in trialsAVencer" :key="a.id" class="flex items-center gap-3 px-5 py-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                 style="background-color: #f97316;">
              {{ getIniciais(a.clube?.nome ?? '?') }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ a.clube?.nome }}
              </p>
              <p class="text-xs text-gray-400">
                Trial vence {{ formatRelativeDate(a.trial_fim) }}
              </p>
            </div>
            <NuxtLink
              :to="`/admin/clubes/${a.clube_id}`"
              class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 transition-colors"
            >
              Ver
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Indicações pendentes + Webhooks falhos ──────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Indicações pendentes -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
        <div class="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background-color: #eff6ff;">
            <svg class="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
            </svg>
          </div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white flex-1">Indicações pendentes</h2>
          <NuxtLink to="/admin/indicacoes" class="text-xs font-semibold text-gray-500 hover:text-gray-700">Ver todas →</NuxtLink>
        </div>

        <div v-if="loading" class="p-5 space-y-3">
          <div v-for="i in 2" :key="i" class="skeleton h-14 rounded-lg" />
        </div>

        <UiEmptyState
          v-else-if="indicacoes.length === 0"
          title="Nada pendente"
          description="Todas as indicações foram processadas."
          size="sm"
        />

        <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.07]">
          <li v-for="ind in indicacoes" :key="ind.id" class="flex items-center gap-3 px-5 py-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                 style="background-color: #3d5afe;">
              {{ getIniciais(ind.indicador?.nome ?? '?') }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ ind.indicador?.nome }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                Indicou {{ ind.nome_indicado ?? ind.email_indicado }}
              </p>
            </div>
            <span class="text-xs text-gray-400 shrink-0">{{ formatRelativeDate(ind.criado_em) }}</span>
          </li>
        </ul>
      </div>

      <!-- Webhooks falhos -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
        <div class="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background-color: #fef2f2;">
            <svg class="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white flex-1">Webhooks com falha</h2>
          <NuxtLink to="/admin/webhooks" class="text-xs font-semibold text-gray-500 hover:text-gray-700">Ver todos →</NuxtLink>
        </div>

        <div v-if="loading" class="p-5 space-y-3">
          <div v-for="i in 2" :key="i" class="skeleton h-14 rounded-lg" />
        </div>

        <UiEmptyState
          v-else-if="webhooks.length === 0"
          title="Tudo limpo"
          description="Nenhum webhook com erro nas últimas 24 horas."
          size="sm"
        />

        <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.07]">
          <li v-for="wh in webhooks" :key="wh.id" class="px-5 py-3">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600">
                {{ wh.evento }}
              </span>
              <span class="text-xs text-gray-400 ml-auto">{{ formatRelativeDate(wh.recebido_em) }}</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate font-mono">
              {{ wh.erro ?? 'Falha no processamento' }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminMetrics, AdminGraficoCrescimento, Indicacao, WebhookLog, Assinatura } from '~/types'
import { formatCurrency, formatRelativeDate, getIniciais } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Visão geral' })

const { superadmin } = useAdminAuth()
const dashboard = useAdminDashboard()

const loading = ref(true)
const metrics = ref<AdminMetrics | null>(null)
const crescimento = ref<AdminGraficoCrescimento[]>([])
const indicacoes = ref<Indicacao[]>([])
const webhooks = ref<WebhookLog[]>([])
const trialsAVencer = ref<Assinatura[]>([])

const adminPrimeiro = computed(() => superadmin.value?.nome?.split(' ')[0] ?? 'Admin')

const crescimentoLabels = computed(() => crescimento.value.map((c) => c.mes))
const crescimentoSeries = computed(() => [
  { name: 'MRR', data: crescimento.value.map((c) => c.mrr), color: '#3d5afe' },
])

onMounted(async () => {
  loading.value = true
  try {
    const [m, c, i, w, t] = await Promise.all([
      dashboard.buscarMetricas(),
      dashboard.buscarCrescimento(6),
      dashboard.indicacoesPendentes(4),
      dashboard.webhooksFalhos(4),
      dashboard.trialsAVencer(7),
    ])
    if (m.data) metrics.value = m.data
    if (c.data) crescimento.value = c.data
    if (i.data) indicacoes.value = i.data
    if (w.data) webhooks.value = w.data
    if (t.data) trialsAVencer.value = t.data
  } finally {
    loading.value = false
  }
})
</script>
