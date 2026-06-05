<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="$emit('close')"/>

      <!-- Drawer -->
      <aside
        class="absolute right-0 top-0 bottom-0 w-full sm:max-w-xl bg-white dark:bg-surface-elevated-dark shadow-2xl flex flex-col h-full animate-fade-in"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ caixinha.nome }}</h2>
              <p class="text-xs text-slate-500 mt-0.5">Criada {{ formatDate(caixinha.criada_em.slice(0, 10)) }}</p>
            </div>
            <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05] shrink-0" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Resumo -->
          <div class="grid grid-cols-4 gap-2 mt-4">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-400">Previsto</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatCurrency(caixinha.total_previsto) }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-400">Pago</p>
              <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalPago) }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-400">Pendente</p>
              <p class="text-sm font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(totalPendente) }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-400">Pagantes</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ pagantesCount }}/{{ participantesTotais }}</p>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="px-6 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2 flex-wrap">
          <div class="relative flex-1 min-w-[160px]">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="busca" type="text" placeholder="Buscar atleta..." class="form-input pl-9 w-full"/>
          </div>
          <input v-model="de" type="date" class="form-input w-auto" title="Pagamentos a partir de"/>
          <span class="text-slate-400 text-xs">até</span>
          <input v-model="ate" type="date" class="form-input w-auto" title="Pagamentos até"/>
          <button
            class="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] inline-flex items-center gap-1.5 disabled:opacity-50"
            :disabled="participantes.length === 0"
            @click="exportarCsv"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
        </div>

        <!-- Lista de participantes -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="p-6 space-y-3">
            <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-lg"/>
          </div>

          <UiEmptyState
            v-else-if="participantes.length === 0"
            size="sm"
            title="Sem participantes"
            :description="busca || de || ate ? 'Nenhum resultado para os filtros aplicados.' : 'Esta caixinha ainda não tem cobranças.'"
          />

          <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <li v-for="p in participantes" :key="p.atleta_id">
              <!-- Linha principal (clicável p/ expandir) -->
              <button
                class="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                @click="toggle(p.atleta_id)"
              >
                <UiAvatar :nome="p.nome" :src="p.foto_url" size="sm"/>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ p.nome }}</p>
                  <p class="text-xs text-slate-500">
                    {{ p.pagas }} de {{ p.cobrancas.length }} pago(s)
                    <template v-if="p.ultimoPagamento"> · último {{ formatDate(p.ultimoPagamento) }}</template>
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(p.totalEnviado) }}</p>
                  <p v-if="p.totalPendente > 0" class="text-[11px] text-amber-600 dark:text-amber-400">{{ formatCurrency(p.totalPendente) }} pendente</p>
                </div>
                <svg class="w-4 h-4 text-slate-400 shrink-0 transition-transform" :class="{ 'rotate-180': aberto[p.atleta_id] }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              <!-- Histórico expandido -->
              <div v-if="aberto[p.atleta_id]" class="px-6 pb-3 pl-[68px] space-y-1.5">
                <div
                  v-for="c in p.cobrancas"
                  :key="c.id"
                  class="flex items-center justify-between gap-2 text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.02]"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: statusCor(c) }"/>
                    <span class="text-slate-600 dark:text-slate-300">
                      {{ c.data_pagamento ? `Pago em ${formatDate(c.data_pagamento.slice(0, 10))}` : `Vence ${formatDate(c.data_vencimento)}` }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide" :style="{ background: statusBg(c), color: statusCor(c) }">{{ statusLabel(c) }}</span>
                    <span class="font-semibold text-slate-900 dark:text-white">{{ formatCurrency(c.valor) }}</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'
import type { Caixinha, Cobranca } from '~/types'

const props = defineProps<{ caixinha: Caixinha }>()
defineEmits<{ (e: 'close'): void }>()

const fin = useFinanceiro()
const toast = useToast()

const hoje = new Date().toISOString().slice(0, 10)
const loading = ref(true)
const cobrancas = ref<Cobranca[]>([])

const busca = ref('')
const de = ref('')
const ate = ref('')
const aberto = reactive<Record<string, boolean>>({})

function toggle(id: string) {
  aberto[id] = !aberto[id]
}

// ── Helpers de status ────────────────────────────────────────────────────────
function atrasada(c: Cobranca) {
  return c.status === 'pendente' && c.data_vencimento < hoje
}
function statusLabel(c: Cobranca) {
  if (c.status === 'pago') return 'Pago'
  if (c.status === 'isento') return 'Isento'
  if (c.status === 'cancelado') return 'Cancelado'
  return atrasada(c) ? 'Atrasado' : 'Pendente'
}
function statusCor(c: Cobranca) {
  if (c.status === 'pago') return '#10b981'
  if (c.status === 'isento') return '#8b5cf6'
  if (c.status === 'cancelado') return '#94a3b8'
  return atrasada(c) ? '#f43f5e' : '#f59e0b'
}
function statusBg(c: Cobranca) {
  return statusCor(c) + '1a' // ~10% alpha
}

// ── Carregamento ─────────────────────────────────────────────────────────────
async function carregar() {
  loading.value = true
  const { data } = await fin.listarCobranças({ caixinha_id: props.caixinha.id })
  cobrancas.value = data ?? []
  loading.value = false
}
onMounted(carregar)

// Resolve atleta a partir do mock (`atleta`) ou do join real (`atletas`).
function atletaDe(c: any): { id: string; nome: string; foto_url: string | null } {
  const a = c.atleta ?? c.atletas
  return {
    id: c.atleta_id,
    nome: a?.nome ?? 'Atleta',
    foto_url: a?.foto_url ?? null,
  }
}

// ── Filtro por período (data de pagamento ou vencimento) ─────────────────────
const cobrancasFiltradas = computed(() =>
  cobrancas.value.filter((c) => {
    const ref = (c.data_pagamento?.slice(0, 10)) ?? c.data_vencimento
    if (de.value && ref < de.value) return false
    if (ate.value && ref > ate.value) return false
    return true
  }),
)

// ── Agrupamento por atleta ───────────────────────────────────────────────────
interface Participante {
  atleta_id: string
  nome: string
  foto_url: string | null
  cobrancas: Cobranca[]
  pagas: number
  totalEnviado: number
  totalPendente: number
  ultimoPagamento: string | null
}

const participantes = computed<Participante[]>(() => {
  const mapa = new Map<string, Participante>()
  for (const c of cobrancasFiltradas.value) {
    const a = atletaDe(c)
    let p = mapa.get(a.id)
    if (!p) {
      p = { atleta_id: a.id, nome: a.nome, foto_url: a.foto_url, cobrancas: [], pagas: 0, totalEnviado: 0, totalPendente: 0, ultimoPagamento: null }
      mapa.set(a.id, p)
    }
    p.cobrancas.push(c)
    if (c.status === 'pago') {
      p.pagas++
      p.totalEnviado += c.valor
      const dp = c.data_pagamento?.slice(0, 10) ?? null
      if (dp && (!p.ultimoPagamento || dp > p.ultimoPagamento)) p.ultimoPagamento = dp
    } else if (c.status === 'pendente') {
      p.totalPendente += c.valor
    }
  }
  let lista = [...mapa.values()]
  if (busca.value) {
    const q = busca.value.toLowerCase()
    lista = lista.filter((p) => p.nome.toLowerCase().includes(q))
  }
  // Ordena por pendência (quem deve primeiro), depois por nome.
  return lista.sort((a, b) => b.totalPendente - a.totalPendente || a.nome.localeCompare(b.nome))
})

const participantesTotais = computed(() => participantes.value.length)
const pagantesCount = computed(() => participantes.value.filter((p) => p.pagas > 0).length)
const totalPago = computed(() => cobrancasFiltradas.value.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0))
const totalPendente = computed(() => cobrancasFiltradas.value.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0))

// ── Export CSV (detalhe filtrado) ────────────────────────────────────────────
function exportarCsv() {
  const head = ['Atleta', 'Status', 'Valor', 'Vencimento', 'Pagamento']
  const rows = cobrancasFiltradas.value.map((c) => [
    atletaDe(c).nome,
    statusLabel(c),
    c.valor.toFixed(2).replace('.', ','),
    c.data_vencimento,
    c.data_pagamento?.slice(0, 10) ?? '',
  ])
  const csv = [head, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(';')).join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `caixinha-${props.caixinha.nome.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Detalhe exportado')
}
</script>
