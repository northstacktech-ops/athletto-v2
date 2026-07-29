<template>
  <div class="space-y-4 animate-fade-in">

    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Indicações — Convide e Ganhe</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {{ pendentes }} pendentes · {{ todas.length }} totais · recompensa atual: <strong>{{ config?.indicacao_dias_recompensa ?? 30 }} dias</strong>
        </p>
      </div>
      <NuxtLink to="/admin/configuracoes" class="text-xs font-semibold text-gray-600 hover:text-gray-900">
        Ajustar regras →
      </NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="s in ['pendente', 'aprovada', 'rejeitada', '']"
        :key="s || 'all'"
        class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
        :class="filtroStatus === s
          ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
          : 'bg-white dark:bg-surface-elevated-dark border-gray-200 dark:border-white/[0.10] text-gray-700 dark:text-gray-300 hover:bg-gray-50'"
        @click="filtroStatus = s"
      >
        {{ s === '' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1) }}
      </button>
    </div>

    <!-- Lista -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 3" :key="i" class="skeleton h-16 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="filtradas.length === 0" title="Sem indicações" description="Nada a processar neste filtro."/>

      <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.07]">
        <li v-for="ind in filtradas" :key="ind.id" class="px-5 py-4">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style="background-color: #3d5afe;">
              {{ getIniciais(ind.indicador?.nome ?? '?') }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                <NuxtLink :to="`/admin/clubes/${ind.clube_indicador_id}`" class="hover:underline">
                  {{ ind.indicador?.nome }}
                </NuxtLink>
                <span class="text-gray-400 font-normal"> indicou </span>
                {{ ind.nome_indicado ?? ind.email_indicado }}
              </p>
              <p class="text-xs text-gray-500">
                {{ ind.email_indicado }}
                <template v-if="ind.telefone_indicado"> · {{ ind.telefone_indicado }}</template>
                · {{ formatRelativeDate(ind.criado_em) }}
              </p>
            </div>

            <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" :class="statusCor(ind.status)">
              {{ ind.status }}
            </span>

            <div v-if="ind.status === 'pendente'" class="flex gap-2">
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                @click="aprovar(ind.id)"
              >
                Aprovar +{{ config?.indicacao_dias_recompensa ?? 30 }}d
              </button>
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                @click="rejeitar(ind.id)"
              >
                Rejeitar
              </button>
            </div>
          </div>

          <p v-if="ind.motivo_rejeicao" class="text-xs text-red-500 mt-1.5 ml-12">
            Rejeitada: {{ ind.motivo_rejeicao }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRelativeDate, getIniciais } from '~/utils/format'
import type { Indicacao, ConfiguracaoSistema } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Indicações' })

const indicacoes = useIndicacoes()
const vouchers = useVouchers()
const auditoria = useAuditoria()
const cfgComp = useConfiguracaoSistema()
const toast = useToast()

const loading = ref(true)
const todas = ref<Indicacao[]>([])
const config = ref<ConfiguracaoSistema | null>(null)
const filtroStatus = ref<string>('pendente')

async function carregar() {
  loading.value = true
  const [l, c] = await Promise.all([indicacoes.listar(), cfgComp.buscar()])
  todas.value = l.data ?? []
  config.value = c.data
  loading.value = false
}

onMounted(carregar)

const pendentes = computed(() => todas.value.filter((i) => i.status === 'pendente').length)

const filtradas = computed(() => {
  if (!filtroStatus.value) return todas.value
  return todas.value.filter((i) => i.status === filtroStatus.value)
})

async function aprovar(id: string) {
  const { data, error } = await indicacoes.aprovar(id)
  if (error || !data) {
    toast.error('Falha ao aprovar')
    return
  }
  // Emite voucher automaticamente para o clube indicador
  const dias = config.value?.indicacao_dias_recompensa ?? 30
  await vouchers.aplicar({
    clube_id: data.clube_indicador_id,
    tipo: 'cortesia',
    dias_concedidos: dias,
    motivo: `Indicação aprovada — Convide e Ganhe (${data.nome_indicado ?? data.email_indicado})`,
    observacoes: `Indicação ID: ${id}`,
  })
  await auditoria.registrar({
    acao: 'indicacao_aprovada',
    entidade: 'indicacao',
    entidade_id: id,
    detalhes: { dias_recompensa: dias },
  })
  toast.success('Indicação aprovada', `+${dias} dias para ${data.indicador?.nome}`)
  await carregar()
}

async function rejeitar(id: string) {
  const motivo = window.prompt('Motivo da rejeição:')
  if (!motivo) return
  await indicacoes.rejeitar(id, motivo)
  await auditoria.registrar({
    acao: 'indicacao_rejeitada',
    entidade: 'indicacao',
    entidade_id: id,
    detalhes: { motivo },
  })
  toast.success('Indicação rejeitada')
  await carregar()
}

function statusCor(s: Indicacao['status']) {
  switch (s) {
    case 'pendente': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'aprovada': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'rejeitada': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    case 'expirada': return 'bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400'
  }
}
</script>
