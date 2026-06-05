<template>
  <div class="space-y-4 animate-fade-in">

    <div v-if="loading" class="space-y-4">
      <div class="skeleton h-24 rounded-xl"/>
      <div class="grid grid-cols-3 gap-3"><div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl"/></div>
      <div class="skeleton h-64 rounded-xl"/>
    </div>

    <UiEmptyState v-else-if="!clube" title="Clube não encontrado" description="Pode ter sido removido."/>

    <template v-else>
      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-5">
        <div class="flex items-start gap-4 flex-wrap">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0" style="background-color: #3d5afe;">
            {{ getIniciais(clube.nome) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ clube.nome }}</h1>
              <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" :class="planoBadge(clube.plano)">{{ clube.plano }}</span>
              <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="statusTexto">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot"/>
                {{ statusLabel }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ clube.slug }} · {{ clube.modalidade ?? 'sem modalidade' }} · {{ clube.email ?? '—' }}</p>
            <p class="text-xs text-gray-400 mt-0.5">CNPJ {{ clube.cnpj ?? '—' }} · criado em {{ formatDate(clube.criado_em.slice(0,10)) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-white/[0.10] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              @click="abrirVoucher = true"
            >
              + Voucher
            </button>
            <button
              v-if="clube.plano_ativo"
              class="px-3 py-2 rounded-lg text-sm font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300"
              @click="confirmarSuspender"
            >
              Suspender
            </button>
            <button
              v-else
              class="px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
              @click="reativar"
            >
              Reativar
            </button>
          </div>
        </div>
      </div>

      <!-- ── KPIs do clube ───────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKpiCard label="Atletas" :value="String(atletas.length)" icon="athletes"/>
        <AdminKpiCard label="Gestores" :value="String(gestores.length)" icon="groups"/>
        <AdminKpiCard label="MRR" :value="formatCurrency(assinatura?.valor_mensal ?? 0)" icon="financial" accent="#22c55e"/>
        <AdminKpiCard label="Vouchers ativos" :value="String(vouchersAtivos.length)" icon="gift" accent="#f97316"/>
      </div>

      <!-- ── Assinatura ──────────────────────────────────────── -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Assinatura</h2>

          <!-- Alterar plano inline -->
          <div class="flex items-center gap-2">
            <select
              v-model="novoPlano"
              class="text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg px-3 py-1.5 bg-white dark:bg-surface-elevated-dark text-gray-700 dark:text-gray-300"
            >
              <option value="basico">Básico</option>
              <option value="intermediario">Intermediário</option>
              <option value="profissional">Profissional</option>
            </select>
            <button
              :disabled="novoPlano === clube.plano || salvandoPlano"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              @click="salvarPlano"
            >
              {{ salvandoPlano ? 'Salvando…' : 'Alterar plano' }}
            </button>
          </div>
        </div>

        <div v-if="assinatura" class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-gray-400">Status</p>
            <p class="font-semibold text-gray-900 dark:text-white capitalize">{{ assinatura.status }}</p>
          </div>
          <div>
            <p class="text-gray-400">Trial</p>
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ formatDate(assinatura.trial_inicio) }} → {{ formatDate(assinatura.trial_fim) }}
            </p>
          </div>
          <div>
            <p class="text-gray-400">Ativada em</p>
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ assinatura.ativada_em ? formatDate(assinatura.ativada_em) : '—' }}
            </p>
          </div>
          <div>
            <p class="text-gray-400">Próxima cobrança</p>
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ assinatura.proxima_cobranca ? formatDate(assinatura.proxima_cobranca) : '—' }}
            </p>
          </div>
          <div>
            <p class="text-gray-400">Valor mensal</p>
            <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(assinatura.valor_mensal) }}</p>
          </div>
          <div>
            <p class="text-gray-400">Dias de voucher aplicados</p>
            <p class="font-semibold text-gray-900 dark:text-white">{{ assinatura.dias_voucher_aplicados }}</p>
          </div>
          <div v-if="assinatura.cancelada_em">
            <p class="text-gray-400">Cancelada em</p>
            <p class="font-semibold text-gray-900 dark:text-white">{{ formatDate(assinatura.cancelada_em) }}</p>
          </div>
          <div v-if="assinatura.motivo_cancelamento">
            <p class="text-gray-400">Motivo</p>
            <p class="font-semibold text-gray-900 dark:text-white">{{ assinatura.motivo_cancelamento }}</p>
          </div>
        </div>
      </div>

      <!-- ── Vouchers do clube ───────────────────────────────── -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Vouchers ({{ vouchersClube.length }})</h2>
        </div>

        <UiEmptyState v-if="vouchersClube.length === 0" size="sm" title="Sem vouchers" description="Este clube ainda não recebeu nenhum voucher."/>

        <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.07]">
          <li v-for="v in vouchersClube" :key="v.id" class="px-5 py-3 flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                 :class="v.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                +{{ v.dias_concedidos }} dias · {{ v.tipo }}
              </p>
              <p class="text-xs text-gray-400 truncate">{{ v.motivo }}</p>
            </div>
            <span class="text-xs uppercase tracking-wider font-bold" :class="voucherStatusCor(v.status)">
              {{ v.status }}
            </span>
          </li>
        </ul>
      </div>
    </template>

    <!-- ── Modal aplicar voucher ────────────────────────────── -->
    <AdminVoucherModal
      v-if="abrirVoucher && clube"
      :clube="clube"
      @close="abrirVoucher = false"
      @aplicado="onVoucherAplicado"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate, getIniciais } from '~/utils/format'
import type { Clube, Assinatura, Gestor, Atleta, Voucher } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const adminClubes = useAdminClubes()
const vouchers = useVouchers()
const auditoria = useAuditoria()
const toast = useToast()

const loading = ref(true)
const clube = ref<Clube | null>(null)
const assinatura = ref<Assinatura | null>(null)
const gestores = ref<Gestor[]>([])
const atletas = ref<Atleta[]>([])
const vouchersClube = ref<Voucher[]>([])
const abrirVoucher = ref(false)
const novoPlano = ref<Clube['plano']>('basico')
const salvandoPlano = ref(false)

useHead({ title: () => `Admin — ${clube.value?.nome ?? 'Clube'}` })

async function carregar() {
  loading.value = true
  const [det, v] = await Promise.all([
    adminClubes.buscarPorId(id.value),
    vouchers.listar({ clube_id: id.value }),
  ])
  if (det.data) {
    clube.value = det.data.clube
    assinatura.value = det.data.assinatura
    gestores.value = det.data.gestores
    atletas.value = det.data.atletas
    novoPlano.value = det.data.clube?.plano ?? 'basico'
  }
  vouchersClube.value = v.data ?? []
  loading.value = false
}

onMounted(carregar)

const vouchersAtivos = computed(() => vouchersClube.value.filter((v) => v.status === 'ativo'))

const statusLabel = computed(() => {
  switch (assinatura.value?.status) {
    case 'ativa': return 'Ativa'
    case 'trial': return 'Trial'
    case 'inadimplente': return 'Inadimplente'
    case 'cancelada': return 'Cancelada'
    case 'suspensa': return 'Suspensa'
    default: return '—'
  }
})
const statusDot = computed(() => {
  switch (assinatura.value?.status) {
    case 'ativa': return 'bg-emerald-500'
    case 'trial': return 'bg-amber-400'
    case 'inadimplente': return 'bg-red-500'
    case 'suspensa': return 'bg-orange-500'
    case 'cancelada': return 'bg-gray-400'
    default: return 'bg-gray-300'
  }
})
const statusTexto = computed(() => {
  switch (assinatura.value?.status) {
    case 'ativa': return 'text-emerald-600 dark:text-emerald-400'
    case 'trial': return 'text-amber-600 dark:text-amber-400'
    case 'inadimplente': return 'text-red-600 dark:text-red-400'
    case 'suspensa': return 'text-orange-600 dark:text-orange-400'
    case 'cancelada': return 'text-gray-500'
    default: return 'text-gray-500'
  }
})

function planoBadge(p: Clube['plano']) {
  switch (p) {
    case 'basico': return 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300'
    case 'intermediario': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'profissional': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }
}
function voucherStatusCor(s: Voucher['status']) {
  switch (s) {
    case 'ativo': return 'text-emerald-600'
    case 'consumido': return 'text-gray-400'
    case 'expirado': return 'text-gray-400'
    case 'revogado': return 'text-red-500'
  }
}

async function salvarPlano() {
  if (!clube.value || novoPlano.value === clube.value.plano) return
  salvandoPlano.value = true
  try {
    const { error } = await adminClubes.alterarPlano(clube.value.id, novoPlano.value)
    if (error) throw error
    await auditoria.registrar({
      acao: 'plano_alterado',
      entidade: 'clube',
      entidade_id: clube.value.id,
      detalhes: { de: clube.value.plano, para: novoPlano.value },
    })
    toast.success('Plano alterado', `Clube migrado para ${novoPlano.value}.`)
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao alterar plano', err?.message ?? '')
    novoPlano.value = clube.value.plano
  } finally {
    salvandoPlano.value = false
  }
}

async function confirmarSuspender() {
  if (!clube.value) return
  const motivo = window.prompt('Motivo da suspensão:')
  if (!motivo) return
  await adminClubes.suspender(clube.value.id, motivo)
  await auditoria.registrar({
    acao: 'clube_suspenso',
    entidade: 'clube',
    entidade_id: clube.value.id,
    detalhes: { motivo },
  })
  toast.success('Clube suspenso')
  await carregar()
}

async function reativar() {
  if (!clube.value) return
  await adminClubes.reativar(clube.value.id)
  await auditoria.registrar({
    acao: 'clube_reativado',
    entidade: 'clube',
    entidade_id: clube.value.id,
  })
  toast.success('Clube reativado')
  await carregar()
}

function onVoucherAplicado() {
  abrirVoucher.value = false
  carregar()
}
</script>
