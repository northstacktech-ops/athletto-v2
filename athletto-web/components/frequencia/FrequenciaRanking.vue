<template>
  <div class="space-y-4">

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="skeleton h-14 rounded-lg"/>
    </div>

    <UiEmptyState
      v-else-if="ranking.length === 0"
      title="Sem dados de frequência"
      description="Registre presença em algumas aulas para popular o ranking."
    />

    <div v-else class="space-y-3">
      <!-- Top 3 destacados -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="(r, idx) in ranking.slice(0, 3)"
          :key="r.atleta.id"
          class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-4 relative overflow-hidden"
        >
          <div class="absolute -top-2 -right-2 text-[60px] font-extrabold opacity-10 leading-none" :class="medalColor(idx)">
            {{ idx + 1 }}
          </div>
          <div class="relative flex items-start gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" :style="{ backgroundColor: medalBg(idx) }">
              {{ getIniciais(r.atleta.nome) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ r.atleta.nome }}</p>
              <p class="text-xs text-gray-400">{{ r.total_presencas }} / {{ r.total_treinos }} treinos</p>
              <p class="text-2xl font-extrabold mt-1" :class="medalText(idx)">{{ r.percentual }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela completa -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
          <h2 class="text-sm font-bold text-gray-900 dark:text-white">Ranking completo</h2>
          <button class="text-xs font-semibold text-gray-500 hover:text-gray-700" @click="ordemAsc = !ordemAsc">
            {{ ordemAsc ? 'Maior frequência ↓' : 'Menor frequência ↑' }}
          </button>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-white/[0.06]">
          <li v-for="(r, idx) in rankingOrdenado" :key="r.atleta.id" class="flex items-center gap-3 px-5 py-2.5">
            <span class="text-xs font-bold text-gray-400 w-5 text-center">{{ idx + 1 }}</span>
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background-color: #3d5afe;">
              {{ getIniciais(r.atleta.nome) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ r.atleta.nome }}</p>
              <p class="text-xs text-gray-400">{{ r.total_presencas }}/{{ r.total_treinos }} aulas</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div class="hidden sm:block w-24 h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div class="h-full transition-all" :class="barColor(r.percentual)" :style="{ width: `${r.percentual}%` }"/>
              </div>
              <span class="text-sm font-bold" :class="pctColor(r.percentual)">{{ r.percentual }}%</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'
import type { Atleta } from '~/types'

const freqComp = useFrequencia()

interface RankingItem {
  atleta: Atleta
  total_treinos: number
  total_presencas: number
  percentual: number
}

const loading = ref(true)
const ranking = ref<RankingItem[]>([])
const ordemAsc = ref(false)

onMounted(async () => {
  loading.value = true
  const { data } = await freqComp.ranking(50)
  ranking.value = (data ?? []) as RankingItem[]
  loading.value = false
})

const rankingOrdenado = computed(() => {
  const sorted = [...ranking.value].sort((a, b) =>
    ordemAsc.value ? a.percentual - b.percentual : b.percentual - a.percentual,
  )
  return sorted
})

function pctColor(v: number) {
  if (v >= 80) return 'text-emerald-600'
  if (v >= 60) return 'text-amber-500'
  return 'text-red-500'
}
function barColor(v: number) {
  if (v >= 80) return 'bg-emerald-500'
  if (v >= 60) return 'bg-amber-400'
  return 'bg-red-500'
}
function medalBg(idx: number) {
  return ['#facc15', '#94a3b8', '#cd7f32'][idx]
}
function medalColor(idx: number) {
  return ['text-amber-400', 'text-slate-400', 'text-orange-600'][idx]
}
function medalText(idx: number) {
  return ['text-amber-500', 'text-slate-500', 'text-orange-600'][idx]
}
</script>
