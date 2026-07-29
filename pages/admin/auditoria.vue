<template>
  <div class="space-y-4 animate-fade-in">

    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Trilha de auditoria</h1>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
        Cada ação dos superadmins fica registrada aqui — não removível.
      </p>
    </div>

    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-3 flex items-center gap-2 flex-wrap">
      <select v-model="filtroAcao" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium">
        <option value="">Todas as ações</option>
        <option value="login">Login</option>
        <option value="clube_suspenso">Clube suspenso</option>
        <option value="clube_reativado">Clube reativado</option>
        <option value="clube_excluido">Clube excluído</option>
        <option value="voucher_emitido">Voucher emitido</option>
        <option value="voucher_revogado">Voucher revogado</option>
        <option value="indicacao_aprovada">Indicação aprovada</option>
        <option value="indicacao_rejeitada">Indicação rejeitada</option>
        <option value="transacao_manual">Transação manual</option>
        <option value="config_alterada">Configuração alterada</option>
      </select>
      <input v-model="filtroDesde" type="date" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"/>
      <input v-model="filtroAte" type="date" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"/>
      <button class="text-xs font-semibold text-gray-500 hover:text-gray-700" @click="limpar">Limpar</button>
    </div>

    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"/>
      </div>

      <UiEmptyState v-else-if="logs.length === 0" title="Sem registros" description="Nenhuma ação no período selecionado."/>

      <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.07]">
        <li v-for="log in logs" :key="log.id" class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style="background-color: #3d5afe;">
            {{ getIniciais(log.superadmin?.nome ?? '?') }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ log.superadmin?.nome ?? 'Sistema' }}
              <span class="font-normal text-gray-500"> — {{ acaoLabel(log.acao) }}</span>
              <code v-if="log.entidade_id" class="text-xs text-gray-400 font-mono ml-1">{{ log.entidade_id }}</code>
            </p>
            <p v-if="hasDetalhes(log.detalhes)" class="text-xs text-gray-500 truncate font-mono">
              {{ JSON.stringify(log.detalhes) }}
            </p>
          </div>
          <span class="text-xs text-gray-400 shrink-0">{{ formatDateTime(log.criado_em) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime, getIniciais } from '~/utils/format'
import type { LogAuditoria, AuditoriaAcao } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Auditoria' })

const auditoria = useAuditoria()

const loading = ref(true)
const logs = ref<LogAuditoria[]>([])
const filtroAcao = ref<string>('')
const filtroDesde = ref('')
const filtroAte = ref('')

async function carregar() {
  loading.value = true
  const { data } = await auditoria.listar({
    acao: (filtroAcao.value || undefined) as AuditoriaAcao | undefined,
    desde: filtroDesde.value || undefined,
    ate: filtroAte.value || undefined,
  })
  logs.value = data ?? []
  loading.value = false
}

watch([filtroAcao, filtroDesde, filtroAte], carregar)
onMounted(carregar)

function limpar() {
  filtroAcao.value = ''
  filtroDesde.value = ''
  filtroAte.value = ''
}

function hasDetalhes(d: Record<string, unknown>) {
  return d && Object.keys(d).length > 0
}

const LABEL: Record<AuditoriaAcao, string> = {
  login: 'fez login',
  clube_criado: 'criou clube',
  clube_suspenso: 'suspendeu clube',
  clube_reativado: 'reativou clube',
  clube_excluido: 'excluiu clube',
  voucher_emitido: 'emitiu voucher',
  voucher_revogado: 'revogou voucher',
  indicacao_aprovada: 'aprovou indicação',
  indicacao_rejeitada: 'rejeitou indicação',
  plano_alterado: 'alterou plano',
  gestor_criado: 'criou gestor',
  gestor_excluido: 'excluiu gestor',
  config_alterada: 'alterou configuração',
  transacao_manual: 'lançou transação manual',
}
function acaoLabel(a: AuditoriaAcao) {
  return LABEL[a] ?? a
}
</script>
