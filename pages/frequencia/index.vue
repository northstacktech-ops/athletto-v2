<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Frequência</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Registre presença, analise histórico e atue sobre evasões
        </p>
      </div>
      <UiTourHelpButton :tour="tour" />
    </div>

    <!-- Abas -->
    <div class="border-b border-gray-200 dark:border-white/[0.10] overflow-x-auto no-scrollbar">
      <div class="flex gap-1">
        <button
          v-for="t in tabs"
          :key="t.value"
          :data-tour="t.value === 'registrar' ? 'freq-registrar' : t.value === 'alertas' ? 'freq-alertas' : null"
          class="px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px inline-flex items-center gap-2"
          :class="aba === t.value
            ? 'border-brand-600 text-brand-700 dark:text-brand-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          @click="aba = t.value"
        >
          {{ t.label }}
          <span v-if="t.value === 'alertas' && alertasAtivos > 0"
                class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">
            {{ alertasAtivos }}
          </span>
        </button>
      </div>
    </div>

    <FrequenciaRegistrar v-if="aba === 'registrar'" :turmas="turmas"/>
    <FrequenciaHistorico v-else-if="aba === 'historico'" :turmas="turmas"/>
    <FrequenciaRanking v-else-if="aba === 'ranking'"/>
    <FrequenciaAlertas v-else-if="aba === 'alertas'" @atualizado="carregarAlertas"/>

    <UiGuidedTourOverlay :tour="tour" />
  </div>
</template>

<script setup lang="ts">
import type { Turma } from '~/types'

definePageMeta({ layout: 'default' })
useHead({ title: 'Frequência — Athletto' })

const route = useRoute()
const router = useRouter()
const turmasComp = useTurmas()
const freqComp = useFrequencia()
const { temPermissao } = useAuth()

type TabValue = 'registrar' | 'historico' | 'ranking' | 'alertas'

// "Registrar" é escrita: só aparece para quem tem nível 'editar' em frequência.
const podeRegistrar = computed(() => temPermissao('frequencia', 'editar'))

const tabs = computed(() => [
  ...(podeRegistrar.value ? [{ value: 'registrar' as const, label: 'Registrar' }] : []),
  { value: 'historico' as const, label: 'Histórico' },
  { value: 'ranking' as const,   label: 'Ranking' },
  { value: 'alertas' as const,   label: 'Alertas de evasão' },
])

const hashToTab: Record<string, TabValue> = {
  '#registrar': 'registrar',
  '#historico': 'historico',
  '#ranking':   'ranking',
  '#alertas':   'alertas',
}

const abaPadrao = (): TabValue => (podeRegistrar.value ? 'registrar' : 'historico')
const abaInicial = hashToTab[route.hash] ?? abaPadrao()
// Bloqueia abrir #registrar via URL sem permissão de escrita.
const aba = ref<TabValue>(abaInicial === 'registrar' && !podeRegistrar.value ? 'historico' : abaInicial)
watch(aba, (v) => router.replace({ hash: `#${v}` }))

const turmas = ref<Turma[]>([])
const alertasAtivos = ref(0)

const tour = useGuidedTour('athletto_tour_frequencia_done', [
  { tourId: 'freq-registrar', title: 'Registrar presença', description: 'Marque quem esteve no treino, por turma e data — leva menos de um minuto por turma.' },
  { tourId: 'freq-alertas', title: 'Alertas de evasão', description: 'O sistema avisa aqui quando um atleta falta demais seguido, pra você agir antes que ele largue o clube.' },
])

async function carregarAlertas() {
  const { data } = await freqComp.listarAlertas()
  alertasAtivos.value = (data ?? []).length
}

onMounted(async () => {
  const [t] = await Promise.all([turmasComp.listar(), carregarAlertas()])
  turmas.value = t.data ?? []
  nextTick(() => tour.start())
})
</script>
