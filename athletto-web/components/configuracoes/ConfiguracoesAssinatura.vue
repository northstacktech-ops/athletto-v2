<template>
  <div class="space-y-4">
    <!-- Plano atual -->
    <div class="card-base p-5">
      <div class="flex items-start gap-5 flex-wrap">
        <div class="flex-1 min-w-[220px]">
          <p class="text-sm text-slate-500">Plano atual</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {{ nomePlano(clube?.plano) }}
          </p>
          <p v-if="trial.isTrial.value && trial.daysLeft.value !== null" class="mt-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
            Trial — {{ trial.daysLeft.value }} dias restantes
          </p>
        </div>

        <div class="flex flex-col items-end shrink-0">
          <p class="text-xs text-slate-500">A partir de</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(precoPlano(clube?.plano)) }}</p>
          <p class="text-xs text-slate-500">/ mês</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p class="text-slate-500 text-xs">Atletas</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ limites.atletas ?? 'Ilimitado' }}</p>
        </div>
        <div>
          <p class="text-slate-500 text-xs">Turmas</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ limites.turmas ?? 'Ilimitado' }}</p>
        </div>
        <div>
          <p class="text-slate-500 text-xs">Gestores</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ limites.gestores ?? 'Ilimitado' }}</p>
        </div>
      </div>
    </div>

    <!-- Tranquilidade no trial: assinar não consome os dias grátis -->
    <div
      v-if="trial.isTrial.value && !trial.trialExpired.value"
      class="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3.5 flex gap-3"
    >
      <svg class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
      <div class="text-sm leading-relaxed">
        <p class="font-semibold text-emerald-800 dark:text-emerald-200">Assine quando quiser, sem pressa.</p>
        <p class="text-emerald-700 dark:text-emerald-300/90 mt-0.5">
          Você aproveita seus
          <strong>{{ trial.daysLeft.value }} dia{{ trial.daysLeft.value === 1 ? '' : 's' }} de teste por inteiro</strong>
          — assinar agora <strong>não encurta</strong> esse período.
          <template v-if="dataFimTrial">A primeira cobrança só acontece em <strong>{{ dataFimTrial }}</strong>, no fim do teste. Nada é cobrado antes disso.</template>
          <template v-else>A primeira cobrança só acontece quando o teste terminar. Nada é cobrado antes disso.</template>
        </p>
      </div>
    </div>

    <!-- Comparativo -->
    <div class="card-base shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Comparar planos</h2>
        <p class="text-xs text-slate-500 mt-0.5">{{ trial.isTrial.value ? 'Assine quando quiser — você mantém os dias de teste.' : 'Faça upgrade quando precisar de mais capacidade.' }}</p>
      </div>
      <div class="p-4">
        <UiPlanosComparativo
          :plano-atual="clube?.plano ?? null"
          :assinavel="gestor?.role === 'principal'"
          :ja-assinante="trial.status.value === 'ativa'"
          :gerando="planoGerando"
          @assinar="onAssinar"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'
import { nomePlano, precoPlano, PLANO_LIMITES, type Clube } from '~/types'

const { clube } = useAuth()
const trial = useTrial()

function onAssinar(plano: Clube['plano']) {
  navigateTo(`/assinar?plano=${plano}`)
}

const limites = computed(() => PLANO_LIMITES[(clube.value?.plano ?? 'basico') as Clube['plano']])

const dataFimTrial = computed(() => {
  const f = trial.trialFim.value
  if (!f) return null
  return new Date(`${f}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
})
</script>
