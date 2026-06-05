<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Vouchers</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {{ ativos }} ativos · {{ todos.length }} totais
        </p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[200px]">
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar por clube ou motivo..."
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <select v-model="filtroStatus" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium">
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="consumido">Consumidos</option>
          <option value="expirado">Expirados</option>
          <option value="revogado">Revogados</option>
        </select>
        <select v-model="filtroTipo" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium">
          <option value="">Todos os tipos</option>
          <option value="trial">Trial</option>
          <option value="extensao">Extensão</option>
          <option value="cortesia">Cortesia</option>
          <option value="upgrade">Upgrade</option>
        </select>
      </div>
    </div>

    <!-- Lista -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="filtrados.length === 0" title="Nenhum voucher" description="Vouchers aparecerão aqui quando você aplicar um."/>

      <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.07]">
        <li v-for="v in filtrados" :key="v.id" class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
               :class="v.status === 'ativo' ? 'bg-emerald-50' : 'bg-gray-100 dark:bg-white/[0.05]'">
            <svg class="w-4 h-4" :class="v.status === 'ativo' ? 'text-emerald-600' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <NuxtLink :to="`/admin/clubes/${v.clube_id}`" class="font-semibold text-gray-900 dark:text-white hover:underline">
                {{ v.clube?.nome ?? 'Clube' }}
              </NuxtLink>
              <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" :class="tipoCor(v.tipo)">{{ v.tipo }}</span>
              <span class="text-xs font-bold" :class="statusCor(v.status)">+{{ v.dias_concedidos }}d</span>
            </div>
            <p class="text-xs text-gray-500 truncate">{{ v.motivo }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              Por {{ v.emissor?.nome }} · {{ formatRelativeDate(v.aplicado_em) }}
              <template v-if="v.revogado_em"> · revogado em {{ formatDate(v.revogado_em.slice(0,10)) }}</template>
            </p>
          </div>
          <button
            v-if="v.status === 'ativo'"
            class="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
            @click="confirmarRevogar(v.id)"
          >
            Revogar
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatRelativeDate } from '~/utils/format'
import type { Voucher } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Vouchers' })

const vouchersComp = useVouchers()
const auditoria = useAuditoria()
const toast = useToast()

const loading = ref(true)
const todos = ref<Voucher[]>([])
const busca = ref('')
const filtroStatus = ref('')
const filtroTipo = ref('')

async function carregar() {
  loading.value = true
  const { data } = await vouchersComp.listar()
  todos.value = data ?? []
  loading.value = false
}

onMounted(carregar)

const ativos = computed(() => todos.value.filter((v) => v.status === 'ativo').length)

const filtrados = computed(() => {
  return todos.value.filter((v) => {
    if (filtroStatus.value && v.status !== filtroStatus.value) return false
    if (filtroTipo.value && v.tipo !== filtroTipo.value) return false
    if (busca.value) {
      const q = busca.value.toLowerCase()
      if (!(v.clube?.nome ?? '').toLowerCase().includes(q) && !v.motivo.toLowerCase().includes(q)) return false
    }
    return true
  })
})

async function confirmarRevogar(id: string) {
  const motivo = window.prompt('Motivo da revogação:')
  if (!motivo) return
  await vouchersComp.revogar(id, motivo)
  await auditoria.registrar({
    acao: 'voucher_revogado',
    entidade: 'voucher',
    entidade_id: id,
    detalhes: { motivo },
  })
  toast.success('Voucher revogado')
  await carregar()
}

function tipoCor(t: Voucher['tipo']) {
  switch (t) {
    case 'trial': return 'bg-amber-50 text-amber-700'
    case 'extensao': return 'bg-blue-50 text-blue-700'
    case 'cortesia': return 'bg-purple-50 text-purple-700'
    case 'upgrade': return 'bg-emerald-50 text-emerald-700'
  }
}
function statusCor(s: Voucher['status']) {
  switch (s) {
    case 'ativo': return 'text-emerald-600'
    case 'consumido': return 'text-gray-500'
    case 'expirado': return 'text-gray-400'
    case 'revogado': return 'text-red-500'
  }
}
</script>
