<template>
  <div class="space-y-4 animate-fade-in">

    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Financeiro</h1>
        <p class="page-description">
          Cobranças, caixinhas, extrato e indicadores
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button class="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]" @click="abrirEntrada = true">
          + Entrada manual
        </button>
        <button class="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]" @click="abrirSaida = true">
          − Saída
        </button>
        <button class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors" @click="abrirPlanejamento = true">
          + Planejamento
        </button>
      </div>
    </div>

    <!-- Abas -->
    <UiTabsPill v-model="aba" :tabs="tabsWithBadges" />

    <FinanceiroDashboard :key="`dash-${refreshKey}`" v-if="aba === 'dashboard'"/>
    <FinanceiroExtrato :key="`ext-${refreshKey}`" v-else-if="aba === 'extrato'"/>
    <FinanceiroCaixinhas :key="`cx-${refreshKey}`" v-else-if="aba === 'caixinhas'"/>
    <FinanceiroPendentes :key="`pend-${refreshKey}`" v-else-if="aba === 'pendentes'" @atualizado="recarregarBadge"/>

    <!-- Modais globais -->
    <FinanceiroPlanejamentoModal v-if="abrirPlanejamento" @close="abrirPlanejamento = false" @salvo="onModalSalvo(() => abrirPlanejamento = false)"/>
    <FinanceiroEntradaModal v-if="abrirEntrada" @close="abrirEntrada = false" @salvo="onModalSalvo(() => abrirEntrada = false)"/>
    <FinanceiroSaidaModal v-if="abrirSaida" @close="abrirSaida = false" @salvo="onModalSalvo(() => abrirSaida = false)"/>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Financeiro — Athletto' })

const route = useRoute()
const router = useRouter()
const fin = useFinanceiro()

type TabValue = 'dashboard' | 'extrato' | 'caixinhas' | 'pendentes'

const hashToTab: Record<string, TabValue> = {
  '#dashboard': 'dashboard', '#extrato': 'extrato',
  '#caixinhas': 'caixinhas', '#pendentes': 'pendentes',
}

// O hash (#caixinhas) nunca chega ao servidor: o SSR sempre renderiza 'dashboard'.
// Iniciar pelo hash direto causava hydration mismatch — sincronizamos no onMounted.
const aba = ref<TabValue>('dashboard')
onMounted(() => {
  const fromHash = hashToTab[route.hash]
  if (fromHash) aba.value = fromHash
})
watch(aba, (v) => router.replace({ hash: `#${v}` }))

const atrasoCount = ref(0)

const tabsWithBadges = computed<{ value: TabValue; label: string; badge?: number | null }[]>(() => [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'extrato',   label: 'Extrato' },
  { value: 'caixinhas', label: 'Caixinhas' },
  { value: 'pendentes', label: 'Pendentes', badge: atrasoCount.value > 0 ? atrasoCount.value : null },
])
const abrirPlanejamento = ref(false)
const abrirEntrada = ref(false)
const abrirSaida = ref(false)
const refreshKey = ref(0)

function onModalSalvo(fechar: () => void) {
  fechar()
  refreshKey.value++
  recarregarBadge()
}

async function recarregarBadge() {
  // Antes buscava TODAS as cobranças pendentes (com join de atleta/caixinha)
  // só para contar — agora o banco devolve apenas o número.
  const { count } = await fin.contarCobrancasAtrasadas()
  atrasoCount.value = count
}
onMounted(recarregarBadge)
</script>
