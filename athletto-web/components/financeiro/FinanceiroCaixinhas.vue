<template>
  <div class="space-y-4">

    <div class="flex items-center justify-between gap-2">
      <p class="text-sm text-slate-500">
        <span class="font-semibold text-slate-900 dark:text-white">{{ caixinhas.length }}</span> caixinha(s) ·
        Total: <span class="font-semibold text-slate-900 dark:text-white">{{ formatCurrency(totalGeral) }}</span>
      </p>
      <button
        class="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] disabled:opacity-50"
        :disabled="caixinhas.length < 2"
        @click="abrirTransferencia = true"
      >
        Transferir entre caixinhas
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="skeleton h-40 rounded-xl"/>
    </div>

    <UiEmptyState v-else-if="caixinhas.length === 0" title="Sem caixinhas" description="Crie um planejamento financeiro e ative para gerar a caixinha."/>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <button
        v-for="cx in caixinhas"
        :key="cx.id"
        type="button"
        class="text-left bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-4 transition-all hover:shadow-card hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/20"
        @click="caixinhaSelecionada = cx"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-base font-bold text-slate-900 dark:text-white truncate">{{ cx.nome }}</h3>
            <p class="text-xs text-slate-500 truncate mt-0.5">Criada {{ formatDate(cx.criada_em.slice(0, 10)) }}</p>
          </div>
          <span class="text-base font-semibold text-slate-900 dark:text-white shrink-0">{{ formatCurrency(cx.saldo_arrecadado) }}</span>
        </div>

        <div class="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
          <div class="h-full bg-emerald-500 transition-all" :style="{ width: `${pct(cx)}%` }"/>
        </div>
        <p class="text-xs text-slate-500 mt-1.5">{{ pct(cx) }}% arrecadado de {{ formatCurrency(cx.total_previsto) }}</p>

        <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span class="text-slate-500">Pago <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(cx.total_pago) }}</span></span>
          <span class="text-slate-300 dark:text-white/20">·</span>
          <span class="text-slate-500">Pendente <span class="font-semibold text-amber-600 dark:text-amber-400">{{ formatCurrency(cx.total_pendente) }}</span></span>
          <span class="text-slate-300 dark:text-white/20">·</span>
          <span class="text-slate-500">Previsto <span class="font-semibold text-slate-700 dark:text-slate-300">{{ formatCurrency(cx.total_previsto) }}</span></span>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
          Ver participantes
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>
    </div>

    <!-- Drawer de detalhe da caixinha -->
    <FinanceiroCaixinhaDetalheDrawer
      v-if="caixinhaSelecionada"
      :caixinha="caixinhaSelecionada"
      @close="caixinhaSelecionada = null"
    />

    <!-- Modal de transferência -->
    <Teleport to="body">
      <div v-if="abrirTransferencia" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="abrirTransferencia = false"/>
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white dark:bg-surface-elevated-dark rounded-2xl shadow-2xl overflow-hidden" @click.stop>
            <div class="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07]">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">Transferir entre caixinhas</h2>
              <p class="text-sm text-slate-500 mt-0.5">Move um valor de uma caixinha para outra</p>
            </div>
            <form class="px-6 py-5 space-y-4" @submit.prevent="confirmarTransferencia">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">De *</label>
                <select v-model="transf.origem" required class="form-input">
                  <option value="">Selecione...</option>
                  <option v-for="c in caixinhas" :key="c.id" :value="c.id">{{ c.nome }} — {{ formatCurrency(c.saldo_arrecadado) }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Para *</label>
                <select v-model="transf.destino" required class="form-input">
                  <option value="">Selecione...</option>
                  <option v-for="c in caixinhas" :key="c.id" :value="c.id" :disabled="c.id === transf.origem">{{ c.nome }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor (R$) *</label>
                <input v-model.number="transf.valor" type="number" min="0.01" step="0.01" required class="form-input"/>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Data *</label>
                <input v-model="transf.data" type="date" required class="form-input"/>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <input v-model="transf.descricao" type="text" maxlength="120" class="form-input" placeholder="Ex: Reserva pra uniforme"/>
              </div>
            </form>
            <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07] flex justify-end gap-2 bg-slate-50 dark:bg-white/[0.02]">
              <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100" @click="abrirTransferencia = false">Cancelar</button>
              <button type="button" :disabled="!podeConfirmar || enviando" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50" @click="confirmarTransferencia">
                {{ enviando ? 'Transferindo...' : 'Confirmar transferência' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'
import type { Caixinha } from '~/types'

const fin = useFinanceiro()
const toast = useToast()

const loading = ref(true)
const caixinhas = ref<Caixinha[]>([])
const caixinhaSelecionada = ref<Caixinha | null>(null)

const abrirTransferencia = ref(false)
const enviando = ref(false)
const transf = reactive({
  origem: '',
  destino: '',
  valor: 0,
  data: new Date().toISOString().slice(0, 10),
  descricao: '',
})

async function carregar() {
  loading.value = true
  const { data } = await fin.listarCaixinhas()
  caixinhas.value = data ?? []
  loading.value = false
}
onMounted(carregar)

function pct(cx: Caixinha) {
  if (cx.total_previsto <= 0) return 0
  return Math.round((cx.saldo_arrecadado / cx.total_previsto) * 100)
}

const totalGeral = computed(() =>
  caixinhas.value.reduce((s, c) => s + c.saldo_arrecadado, 0),
)

const podeConfirmar = computed(
  () =>
    transf.origem &&
    transf.destino &&
    transf.origem !== transf.destino &&
    transf.valor > 0 &&
    transf.data,
)

async function confirmarTransferencia() {
  if (!podeConfirmar.value) return
  enviando.value = true
  try {
    const { error } = await fin.transferirEntreCaixinhas({
      origem_caixinha_id: transf.origem,
      destino_caixinha_id: transf.destino,
      valor: transf.valor,
      data: transf.data,
      descricao: transf.descricao || undefined,
    })
    if (error) throw error
    toast.success('Transferência registrada', `${formatCurrency(transf.valor)} movidos`)
    abrirTransferencia.value = false
    Object.assign(transf, { origem: '', destino: '', valor: 0, descricao: '' })
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao transferir', err?.message ?? '')
  } finally {
    enviando.value = false
  }
}
</script>

