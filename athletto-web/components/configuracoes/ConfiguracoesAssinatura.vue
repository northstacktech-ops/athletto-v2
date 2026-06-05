<template>
  <div class="space-y-4">
    <!-- Plano atual -->
    <div class="card-base p-5">
      <div class="flex items-start gap-5 flex-wrap">
        <div class="flex-1 min-w-[220px]">
          <p class="text-sm text-slate-500">Plano atual</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white capitalize mt-0.5">
            {{ clube?.plano ?? '—' }}
          </p>
          <p v-if="trial.isTrial.value && trial.daysLeft.value !== null" class="mt-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
            Trial — {{ trial.daysLeft.value }} dias restantes
          </p>
        </div>

        <div class="flex flex-col items-end shrink-0">
          <p class="text-xs text-slate-500">A partir de</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ valorPlanoAtual }}</p>
          <p class="text-xs text-slate-500">/ mês</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <p class="text-slate-500 text-xs">Atletas</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ planos.limites.value.atletas ?? 'Ilimitado' }}</p>
        </div>
        <div>
          <p class="text-slate-500 text-xs">Turmas</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ planos.limites.value.turmas }}</p>
        </div>
        <div>
          <p class="text-slate-500 text-xs">Gestores extra</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ planos.limites.value.gestores_adicionais }}</p>
        </div>
        <div>
          <p class="text-slate-500 text-xs">Planejamentos</p>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">{{ planos.limites.value.planejamentos_ativos }}</p>
        </div>
      </div>
    </div>

    <!-- Comparativo -->
    <div class="card-base shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Comparar planos</h2>
        <p class="text-xs text-slate-500 mt-0.5">Upgrade fica disponível com a integração AbacatePay (Sprint 3)</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4">
        <div v-for="p in planosComparativo" :key="p.id"
             class="rounded-xl border p-4 transition-colors"
             :class="p.id === clube?.plano
               ? 'border-slate-900 dark:border-brand-500 bg-slate-50 dark:bg-brand-950'
               : 'border-slate-200 dark:border-white/[0.08]'">
          <div class="flex items-center justify-between">
            <p class="text-sm font-bold text-slate-900 dark:text-white capitalize">{{ p.id }}</p>
            <span v-if="p.id === clube?.plano" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-brand-600 dark:text-white">Atual</span>
          </div>
          <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{{ formatCurrency(p.valor) }}<span class="text-xs text-slate-400 font-medium">/mês</span></p>
          <ul class="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            <li class="flex items-center gap-1.5">
              <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              {{ p.limites.atletas === null ? 'Atletas ilimitados' : `Até ${p.limites.atletas} atletas` }}
            </li>
            <li class="flex items-center gap-1.5">
              <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              Até {{ p.limites.turmas }} turmas
            </li>
            <li class="flex items-center gap-1.5">
              <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              +{{ p.limites.gestores_adicionais }} gestores
            </li>
            <li class="flex items-center gap-1.5">
              <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              {{ p.limites.planejamentos_ativos }} planejamentos
            </li>
          </ul>
          <button v-if="p.id !== clube?.plano" disabled class="mt-4 w-full px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-500 cursor-not-allowed">
            Upgrade indisponível
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'
import { PLANO_LIMITES, type Clube } from '~/types'

const { clube } = useAuth()
const planos = usePlanoLimites()
const trial = useTrial()

const VALORES: Record<Clube['plano'], number> = {
  basico: 39.90,
  intermediario: 89.90,
  profissional: 189.90,
}

const valorPlanoAtual = computed(() => formatCurrency(VALORES[clube.value?.plano ?? 'basico']))

const planosComparativo = (['basico', 'intermediario', 'profissional'] as const).map((id) => ({
  id,
  valor: VALORES[id],
  limites: PLANO_LIMITES[id],
}))
</script>
