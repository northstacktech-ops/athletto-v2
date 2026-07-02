<template>
  <div class="space-y-4">

    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-3 flex items-center gap-2 flex-wrap">
      <select v-model="turmaId" class="form-input flex-1 min-w-[220px]">
        <option value="">Selecione uma turma...</option>
        <option v-for="t in turmas" :key="t.id" :value="t.id">{{ t.nome }}</option>
      </select>
      <input v-model="de" type="date" class="form-input w-auto"/>
      <span class="text-gray-400 text-xs">até</span>
      <input v-model="ate" type="date" :max="hoje" class="form-input w-auto"/>
    </div>

    <UiEmptyState
      v-if="!turmaId"
      title="Selecione uma turma"
      description="Veja a matriz de presença dos atletas ao longo do tempo."
      size="sm"
    />

    <div v-else-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
    </div>

    <UiEmptyState
      v-else-if="atletas.length === 0 || datas.length === 0"
      title="Sem registros"
      description="Nenhuma frequência registrada nesse período."
      size="sm"
    />

    <div v-else class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-white/[0.02]">Atleta</th>
              <th v-for="d in datas" :key="d" class="px-2 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">
                {{ formatarDiaCurto(d) }}
              </th>
              <th class="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400 text-right">%</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/[0.06]">
            <tr v-for="a in atletas" :key="a.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              <td class="px-4 py-2 sticky left-0 bg-white dark:bg-surface-elevated-dark border-r border-gray-100 dark:border-white/[0.06]">
                <div class="flex items-center gap-2">
                  <UiAvatar :nome="a.nome" :src="a.foto_url" size="xs"/>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">{{ a.nome }}</p>
                </div>
              </td>
              <td v-for="d in datas" :key="d" class="px-2 py-2 text-center">
                <span v-if="celula(a.id, d) === true" class="inline-block w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold leading-5">✓</span>
                <span v-else-if="celula(a.id, d) === false" class="inline-block w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold leading-5">✗</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-4 py-2 text-right font-bold" :class="pctColor(percentual(a.id))">
                {{ percentual(a.id) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Atleta, Turma, Frequencia } from '~/types'

const props = defineProps<{ turmas: Turma[] }>()

const freqComp = useFrequencia()

const hoje = new Date().toISOString().slice(0, 10)
const dataDe30diasAtras = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

const turmaId = ref('')
const de = ref(dataDe30diasAtras)
const ate = ref(hoje)
const loading = ref(false)

const atletas = ref<Atleta[]>([])
const registros = ref<Frequencia[]>([])

async function carregar() {
  if (!turmaId.value) return
  loading.value = true
  // Uma única query por turma+período (antes: 1 query por atleta = N+1 e lento).
  const [{ data: as }, { data: regs }] = await Promise.all([
    freqComp.atletasDaTurma(turmaId.value),
    freqComp.historicoPorTurma(turmaId.value, de.value, ate.value),
  ])
  atletas.value = (as ?? []).map((x: any) => (x.atletas ? x.atletas : x)) as Atleta[]
  registros.value = (regs ?? []) as Frequencia[]
  loading.value = false
}

watch([turmaId, de, ate], carregar)

// Já traz os últimos registros de cara: assim que as turmas chegam, seleciona
// a primeira automaticamente (em vez de deixar a tela vazia "Selecione uma turma").
watch(
  () => props.turmas,
  (lista) => {
    if (!turmaId.value && lista?.length) turmaId.value = lista[0].id
  },
  { immediate: true },
)

const datas = computed(() => {
  const set = new Set(registros.value.map((r) => r.data))
  return Array.from(set).sort()
})

function celula(atletaId: string, data: string) {
  const r = registros.value.find((x) => x.atleta_id === atletaId && x.data === data)
  return r ? r.presente : null
}

function percentual(atletaId: string) {
  const regs = registros.value.filter((r) => r.atleta_id === atletaId)
  if (regs.length === 0) return 0
  return Math.round((regs.filter((r) => r.presente).length / regs.length) * 100)
}

function pctColor(v: number) {
  if (v >= 80) return 'text-emerald-600'
  if (v >= 60) return 'text-amber-500'
  if (v === 0) return 'text-gray-400'
  return 'text-red-500'
}

function formatarDiaCurto(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
</script>

