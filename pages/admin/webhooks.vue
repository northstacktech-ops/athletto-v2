<template>
  <div class="space-y-4 animate-fade-in">

    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Webhooks</h1>
        <p class="page-description">
          Eventos recebidos, validação HMAC e estado do processamento
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="s in (['', 'recebido', 'processado', 'erro'] as const)"
          :key="s || 'all'"
          class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
          :class="filtro === s
            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
            : 'bg-white dark:bg-surface-elevated-dark border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300'"
          @click="filtro = s"
        >
          {{ s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1) }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="skeleton h-20 rounded-xl"/>
    </div>

    <UiEmptyState v-else-if="filtrados.length === 0" title="Sem webhooks" description="Nenhum evento neste filtro."/>

    <div v-else class="space-y-2">
      <details
        v-for="wh in filtrados"
        :key="wh.id"
        class="card-base overflow-hidden group"
      >
        <summary class="px-5 py-3 flex items-center gap-3 cursor-pointer list-none">
          <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" :class="statusCor(wh.status)">
            {{ wh.status }}
          </span>
          <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-white/[0.05] dark:text-slate-300">
            {{ wh.evento }}
          </span>
          <span v-if="!wh.hmac_valido" class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600">
            HMAC inválido
          </span>
          <code class="text-xs text-slate-500 font-mono truncate">{{ wh.payment_id ?? '—' }}</code>
          <span class="ml-auto text-xs text-slate-400">{{ formatDateTime(wh.recebido_em) }}</span>
          <svg class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </summary>
        <div class="border-t border-slate-100 dark:border-white/[0.06] px-5 py-3 space-y-2">
          <p v-if="wh.erro" class="text-xs text-red-600 dark:text-red-400 font-mono">{{ wh.erro }}</p>
          <pre class="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.02] rounded-lg p-3 overflow-x-auto">{{ JSON.stringify(wh.payload, null, 2) }}</pre>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/format'
import type { WebhookLog } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Webhooks' })

const adminFin = useAdminFinanceiro()

const loading = ref(true)
const todos = ref<WebhookLog[]>([])
const filtro = ref<'' | WebhookLog['status']>('')

onMounted(async () => {
  loading.value = true
  const { data } = await adminFin.listarWebhooks()
  todos.value = data ?? []
  loading.value = false
})

const filtrados = computed(() => {
  if (!filtro.value) return todos.value
  return todos.value.filter((w) => w.status === filtro.value)
})

function statusCor(s: WebhookLog['status']) {
  switch (s) {
    case 'recebido': return 'bg-blue-50 text-blue-700'
    case 'processado': return 'bg-emerald-50 text-emerald-700'
    case 'erro': return 'bg-red-50 text-red-700'
    case 'ignorado': return 'bg-slate-100 text-slate-600'
  }
}
</script>
