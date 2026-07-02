<template>
  <div class="space-y-4">

    <!-- Atalhos de período + Exportar (sempre visível) -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="p in periodos"
        :key="p.key"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
        :class="periodoAtivo === p.key
          ? 'bg-slate-900 text-white border-slate-900 dark:bg-brand-600 dark:text-white dark:border-brand-600'
          : 'bg-white dark:bg-surface-elevated-dark border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'"
        @click="aplicarPeriodo(p.key)"
      >
        {{ p.label }}
      </button>

      <button
        class="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
        :disabled="filtradas.length === 0"
        :title="`Exporta as ${filtradas.length} transações do período/filtros aplicados`"
        @click="exportarCsv"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar CSV
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3 flex items-center gap-2 flex-wrap shadow-card">
      <div class="relative flex-1 min-w-[180px]">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="busca" type="text" placeholder="Buscar descrição, categoria..." class="form-input pl-9 w-full"/>
      </div>
      <select v-model="filtroTipo" class="form-input">
        <option value="">Todos os tipos</option>
        <option value="entrada">Entradas</option>
        <option value="saida">Saídas</option>
      </select>
      <input v-model="de" type="date" class="form-input"/>
      <span class="text-slate-400 text-xs">até</span>
      <input v-model="ate" type="date" class="form-input"/>
      <select v-model="filtroCaixinha" class="form-input">
        <option value="">Todas as caixinhas</option>
        <option v-for="c in caixinhas" :key="c.id" :value="c.id">{{ c.nome }}</option>
      </select>
    </div>

    <!-- Sumário -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/[0.06]">
      <div class="px-4 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-slate-400">Entradas</p>
        <p class="text-base font-bold text-emerald-600 mt-0.5 truncate">{{ formatCurrency(totalEntrada) }}</p>
      </div>
      <div class="px-4 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-slate-400">Saídas</p>
        <p class="text-base font-bold text-amber-600 mt-0.5 truncate">{{ formatCurrency(totalSaida) }}</p>
      </div>
      <div class="px-4 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-slate-400">Saldo</p>
        <p class="text-base font-bold mt-0.5 truncate" :class="saldo >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'">{{ formatCurrency(saldo) }}</p>
      </div>
    </div>

    <!-- Tabela -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden shadow-card">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
      </div>
      <UiEmptyState v-else-if="filtradas.length === 0" title="Sem transações" description="Nenhum lançamento no período."/>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Data</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Descrição</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Categoria</th>
              <th class="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Origem</th>
              <th class="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-for="t in filtradas" :key="t.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <td class="px-5 py-3 text-slate-500 whitespace-nowrap">{{ formatDate(t.data) }}</td>
              <td class="px-3 py-3 text-slate-900 dark:text-white max-w-[300px] truncate">{{ t.descricao ?? (t.tipo === 'entrada' ? 'Entrada' : 'Saída') }}</td>
              <td class="px-3 py-3 text-slate-500 hidden md:table-cell">{{ t.categoria ?? '—' }}</td>
              <td class="px-3 py-3 hidden lg:table-cell">
                <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" :class="t.origem === 'webhook' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'">
                  {{ t.origem }}
                </span>
              </td>
              <td class="px-5 py-3 text-right font-bold whitespace-nowrap" :class="t.tipo === 'entrada' ? 'text-emerald-600' : 'text-amber-600'">
                {{ t.tipo === 'entrada' ? '+' : '−' }}{{ formatCurrency(t.valor) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'
import type { Transacao, Caixinha } from '~/types'

const fin = useFinanceiro()
const toast = useToast()

const hoje = new Date().toISOString().slice(0, 10)
const inicioMes = new Date().toISOString().slice(0, 7) + '-01'

const loading = ref(true)
const transacoes = ref<Transacao[]>([])
const caixinhas = ref<Caixinha[]>([])

const filtroTipo = ref<'entrada' | 'saida' | ''>('')
const filtroCaixinha = ref('')
const de = ref(inicioMes)
const ate = ref(hoje)
const busca = ref('')
const periodoAtivo = ref<'mes' | '7d' | '30d' | '90d' | 'custom'>('mes')

const periodos = [
  { key: '7d' as const, label: 'Últimos 7 dias' },
  { key: '30d' as const, label: 'Últimos 30 dias' },
  { key: '90d' as const, label: 'Últimos 90 dias' },
  { key: 'mes' as const, label: 'Este mês' },
]

// Sinaliza que a próxima mudança de de/ate vem de um atalho (não é manual),
// para o watch não reverter o botão ativo para 'custom'.
const aplicandoPreset = ref(false)

function aplicarPeriodo(p: typeof periodoAtivo.value) {
  aplicandoPreset.value = true
  periodoAtivo.value = p
  const now = new Date()
  if (p === 'mes') {
    de.value = now.toISOString().slice(0, 7) + '-01'
  } else {
    const dias = p === '7d' ? 7 : p === '30d' ? 30 : 90
    const dInicio = new Date(now)
    dInicio.setDate(now.getDate() - dias)
    de.value = dInicio.toISOString().slice(0, 10)
  }
  ate.value = now.toISOString().slice(0, 10)
}

async function carregar() {
  loading.value = true
  const { data } = await fin.listarTransacoes({
    tipo: filtroTipo.value || undefined,
    de: de.value || undefined,
    ate: ate.value || undefined,
    caixinha_id: filtroCaixinha.value || undefined,
    limite: 500,
  })
  transacoes.value = data ?? []
  loading.value = false
}

onMounted(async () => {
  // Caixinhas e transações são independentes — carrega em paralelo (sem waterfall)
  const [{ data }] = await Promise.all([fin.listarCaixinhas(), carregar()])
  caixinhas.value = data ?? []
})

watch([filtroTipo, filtroCaixinha, de, ate], (vals, oldVals) => {
  const dataMudou = vals[2] !== oldVals[2] || vals[3] !== oldVals[3]
  if (aplicandoPreset.value) {
    // Mudança de data veio de um atalho: mantém o botão ativo já definido.
    aplicandoPreset.value = false
  } else if (dataMudou) {
    // Data alterada manualmente nos inputs → vira período personalizado.
    periodoAtivo.value = 'custom'
  }
  carregar()
})

const filtradas = computed(() => {
  if (!busca.value) return transacoes.value
  const q = busca.value.toLowerCase()
  return transacoes.value.filter(
    (t) =>
      (t.descricao ?? '').toLowerCase().includes(q) ||
      (t.categoria ?? '').toLowerCase().includes(q),
  )
})

const totalEntrada = computed(() => filtradas.value.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0))
const totalSaida = computed(() => filtradas.value.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0))
const saldo = computed(() => totalEntrada.value - totalSaida.value)

function exportarCsv() {
  const head = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Origem', 'Valor']
  const rows = filtradas.value.map((t) => [
    t.data,
    t.tipo,
    (t.descricao ?? '').replace(/[\n;]/g, ' '),
    t.categoria ?? '',
    t.origem,
    (t.tipo === 'entrada' ? '' : '-') + t.valor.toFixed(2).replace('.', ','),
  ])
  const csv = [head, ...rows].map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `extrato-${de.value}-a-${ate.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Extrato exportado')
}
</script>

