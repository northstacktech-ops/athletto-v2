<template>
  <div class="space-y-4">

    <!-- Filtros -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="s in (['todas', 'pendente', 'pago', 'vencidas'] as const)"
        :key="s"
        class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
        :class="filtro === s
          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
          : 'bg-white dark:bg-surface-elevated-dark border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'"
        @click="filtro = s"
      >
        {{ filtroLabel(s) }}
      </button>
    </div>

    <!-- Ações em massa -->
    <div
      v-if="selecionadas.size > 0"
      class="bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
    >
      <p class="text-sm">
        <span class="font-bold">{{ selecionadas.size }}</span> cobrança(s) selecionada(s)
        · Total: <span class="font-bold">{{ formatCurrency(totalSelecionado) }}</span>
      </p>
      <div class="flex items-center gap-1.5">
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
          @click="enviarLembretesEmMassa"
        >
          Enviar lembretes (WhatsApp)
        </button>
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
          @click="marcarPagasEmMassa"
        >
          Marcar como pagas
        </button>
        <button
          class="px-2 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white"
          @click="selecionadas.clear()"
        >
          Limpar
        </button>
      </div>
    </div>

    <!-- Lista -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden shadow-card">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-lg"/>
      </div>
      <UiEmptyState v-else-if="filtradas.length === 0" title="Nada nesse filtro" description="Outros filtros podem mostrar mais resultados." size="sm"/>

      <!-- Header c/ select-all -->
      <div v-else-if="podeSelecionar" class="px-5 py-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3 bg-slate-50 dark:bg-white/[0.02]">
        <input type="checkbox" class="w-4 h-4 rounded" :checked="todasSelecionadas" :indeterminate.prop="parcialmenteSelecionadas" @change="toggleTodas">
        <span class="text-xs font-semibold text-slate-500">Selecionar todas ({{ selecionavel.length }})</span>
      </div>

      <ul v-if="filtradas.length > 0" class="divide-y divide-slate-100 dark:divide-white/[0.07]">
        <li v-for="cb in filtradas" :key="cb.id" class="px-5 py-3 flex items-center gap-3 flex-wrap">
          <input
            v-if="cb.status === 'pendente'"
            type="checkbox"
            class="w-4 h-4 rounded"
            :checked="selecionadas.has(cb.id)"
            @change="toggleSel(cb.id)"
          />
          <span v-else class="w-4 h-4 inline-block shrink-0"/>

          <UiAvatar :nome="cb.atleta?.nome ?? '?'" :src="cb.atleta?.foto_url" size="sm" />
          <div class="flex-1 min-w-[160px]">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ cb.atleta?.nome }}</p>
              <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" :class="statusBadge(cb)">{{ statusLabel(cb) }}</span>
            </div>
            <p class="text-xs text-slate-400 truncate">
              {{ cb.caixinha?.nome ?? 'Caixinha' }} · vence {{ formatDate(cb.data_vencimento) }}
              <template v-if="cb.data_pagamento"> · pago em {{ formatDate(cb.data_pagamento.slice(0, 10)) }}</template>
            </p>
          </div>
          <span class="text-base font-bold text-slate-900 dark:text-white shrink-0">{{ formatCurrency(cb.valor) }}</span>

          <div v-if="cb.status === 'pendente'" class="flex items-center gap-1 shrink-0">
            <a v-if="cb.abacatepay_link" :href="cb.abacatepay_link" target="_blank" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Pix</a>
            <a v-if="cb.atleta?.telefone_responsavel" :href="linkWhatsApp(cb)" target="_blank" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50">WhatsApp</a>
            <button class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05]" @click="regenerar(cb.id)">Regenerar</button>
            <button class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700" @click="marcarPago(cb.id)">Marcar pago</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate, gerarLinkWhatsApp } from '~/utils/format'
import type { Cobranca } from '~/types'

const emit = defineEmits<{ (e: 'atualizado'): void }>()
const fin = useFinanceiro()
const toast = useToast()

const loading = ref(true)
const todas = ref<Cobranca[]>([])
const filtro = ref<'todas' | 'pendente' | 'pago' | 'vencidas'>('pendente')
const selecionadas = reactive(new Set<string>())

async function carregar() {
  loading.value = true
  const { data } = await fin.listarCobranças()
  todas.value = (data ?? []) as Cobranca[]
  loading.value = false
}
onMounted(carregar)

const hoje = new Date().toISOString().slice(0, 10)

const filtradas = computed(() => {
  if (filtro.value === 'todas') return todas.value
  if (filtro.value === 'vencidas') return todas.value.filter((c) => c.status === 'pendente' && c.data_vencimento < hoje)
  return todas.value.filter((c) => c.status === filtro.value)
})

const selecionavel = computed(() => filtradas.value.filter((c) => c.status === 'pendente'))
const podeSelecionar = computed(() => selecionavel.value.length > 0)
const todasSelecionadas = computed(() =>
  selecionavel.value.length > 0 && selecionavel.value.every((c) => selecionadas.has(c.id)),
)
const parcialmenteSelecionadas = computed(() =>
  selecionadas.size > 0 && !todasSelecionadas.value,
)

const totalSelecionado = computed(() =>
  todas.value.filter((c) => selecionadas.has(c.id)).reduce((s, c) => s + c.valor, 0),
)

watch(filtro, () => selecionadas.clear())

function toggleSel(id: string) {
  if (selecionadas.has(id)) selecionadas.delete(id)
  else selecionadas.add(id)
}
function toggleTodas() {
  if (todasSelecionadas.value) selecionadas.clear()
  else selecionavel.value.forEach((c) => selecionadas.add(c.id))
}

function filtroLabel(s: typeof filtro.value) {
  switch (s) {
    case 'todas': return 'Todas'
    case 'pendente': return 'Pendentes'
    case 'pago': return 'Pagas'
    case 'vencidas': return 'Vencidas'
  }
}

function statusLabel(c: Cobranca) {
  if (c.status === 'pendente' && c.data_vencimento < hoje) return 'Vencida'
  return c.status
}
function statusBadge(c: Cobranca) {
  if (c.status === 'pago') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (c.status === 'pendente' && c.data_vencimento < hoje) return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (c.status === 'pendente') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  if (c.status === 'isento') return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  return 'bg-slate-100 text-slate-700 dark:bg-white/[0.05] dark:text-slate-400'
}

function linkWhatsApp(cb: Cobranca) {
  const fone = cb.atleta?.telefone_responsavel ?? ''
  const msg = `Oi! Lembrete da mensalidade de ${cb.atleta?.nome} (${formatCurrency(cb.valor)}), vencimento ${formatDate(cb.data_vencimento)}. ${cb.abacatepay_link ? `Pix: ${cb.abacatepay_link}` : ''}`
  return gerarLinkWhatsApp(fone, msg)
}

async function marcarPago(id: string) {
  if (!window.confirm('Confirmar baixa manual desta cobrança?')) return
  try {
    await fin.marcarComoPago(id)
    toast.success('Cobrança marcada como paga')
    emit('atualizado')
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao marcar pagamento', err?.message ?? '')
  }
}

async function regenerar(id: string) {
  try {
    await fin.regenerarLink(id)
    toast.success('Link Pix regenerado', 'Envie o novo link ao responsável.')
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao regenerar link', err?.message ?? '')
  }
}

// Ações em massa
async function marcarPagasEmMassa() {
  if (selecionadas.size === 0) return
  if (!window.confirm(`Marcar ${selecionadas.size} cobrança(s) como pagas?`)) return
  try {
    for (const id of selecionadas) {
      await fin.marcarComoPago(id)
    }
    toast.success(`${selecionadas.size} cobrança(s) marcadas como pagas`)
    selecionadas.clear()
    emit('atualizado')
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao processar cobranças', err?.message ?? '')
  }
}

function enviarLembretesEmMassa() {
  if (selecionadas.size === 0) return
  const itens = todas.value.filter((c) => selecionadas.has(c.id) && c.atleta?.telefone_responsavel)
  if (itens.length === 0) {
    toast.info('Nenhum responsável com WhatsApp cadastrado nas selecionadas.')
    return
  }
  // Abre todas as conversas (uma por aba)
  itens.forEach((cb) => window.open(linkWhatsApp(cb), '_blank'))
  toast.success(`${itens.length} conversa(s) aberta(s) no WhatsApp.`)
}
</script>
