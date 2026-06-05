<template>
  <div class="space-y-4 animate-fade-in">

    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Configurações do sistema</h1>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Parâmetros globais — afetam todos os clubes</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton h-32 rounded-xl"/>
    </div>

    <template v-else-if="cfg">
      <!-- Trial / Planos -->
      <AdminSettingsSection
        titulo="Trial & planos"
        descricao="Período de avaliação ao novo clube e valores padrão"
      >
        <AdminSettingsField label="Dias de trial padrão">
          <input v-model.number="cfg.trial_dias_padrao" type="number" min="0" max="365" class="setting-input"/>
        </AdminSettingsField>
      </AdminSettingsSection>

      <!-- Convide e Ganhe -->
      <AdminSettingsSection
        titulo="Convide e Ganhe"
        descricao="Regras do programa de indicação que aparece para os clubes"
      >
        <AdminSettingsField label="Dias de recompensa por indicação aprovada">
          <input v-model.number="cfg.indicacao_dias_recompensa" type="number" min="0" max="365" class="setting-input"/>
        </AdminSettingsField>
        <AdminSettingsField label="Aprovação automática" descricao="Aprova assim que o indicado pagar a primeira mensalidade. Quando desativado, exige aprovação manual aqui no admin.">
          <input v-model="cfg.indicacao_aprovacao_automatica" type="checkbox" class="setting-checkbox"/>
        </AdminSettingsField>
        <AdminSettingsField label="Mínimo de atletas no clube indicado" descricao="Critério para considerar a indicação válida.">
          <input v-model.number="cfg.indicacao_minimo_atletas_indicado" type="number" min="0" max="100" class="setting-input"/>
        </AdminSettingsField>
      </AdminSettingsSection>

      <!-- AbacatePay -->
      <AdminSettingsSection
        titulo="AbacatePay"
        descricao="Status da integração com o gateway Pix"
      >
        <AdminSettingsField label="Ambiente">
          <select v-model="cfg.abacatepay_ambiente" class="setting-input">
            <option value="sandbox">Sandbox</option>
            <option value="production">Produção</option>
          </select>
        </AdminSettingsField>
        <AdminSettingsField label="Webhook configurado?" descricao="Lido da env var ABACATEPAY_WEBHOOK_SECRET. Defina em produção para receber baixas automáticas.">
          <span class="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                :class="cfg.abacatepay_webhook_secret_configurado ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
            {{ cfg.abacatepay_webhook_secret_configurado ? 'Configurado' : 'Pendente' }}
          </span>
        </AdminSettingsField>
      </AdminSettingsSection>

      <!-- Segurança -->
      <AdminSettingsSection titulo="Segurança" descricao="Proteções globais de acesso">
        <AdminSettingsField label="Tentativas máx. de login antes do bloqueio">
          <input v-model.number="cfg.rate_limit_login_tentativas" type="number" min="1" max="20" class="setting-input"/>
        </AdminSettingsField>
      </AdminSettingsSection>

      <!-- Manutenção -->
      <AdminSettingsSection titulo="Manutenção" descricao="Banner global que aparece para todos os clubes">
        <AdminSettingsField label="Modo manutenção ativo">
          <input v-model="cfg.manutencao_ativa" type="checkbox" class="setting-checkbox"/>
        </AdminSettingsField>
        <AdminSettingsField v-if="cfg.manutencao_ativa" label="Mensagem">
          <textarea v-model="cfg.manutencao_mensagem" rows="2" class="setting-input"/>
        </AdminSettingsField>
      </AdminSettingsSection>

      <div class="sticky bottom-4 bg-white dark:bg-surface-elevated-dark border border-gray-200 dark:border-white/[0.10] rounded-xl p-3 flex items-center justify-between shadow-lg">
        <p class="text-xs text-gray-500">
          Última alteração {{ formatDateTime(cfg.atualizado_em) }}
        </p>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background-color: #3d5afe;" :disabled="salvando" @click="salvar">
          {{ salvando ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/format'
import type { ConfiguracaoSistema } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin — Configurações' })

const cfgComp = useConfiguracaoSistema()
const auditoria = useAuditoria()
const toast = useToast()

const loading = ref(true)
const cfg = ref<ConfiguracaoSistema | null>(null)
const salvando = ref(false)

onMounted(async () => {
  loading.value = true
  const { data } = await cfgComp.buscar()
  cfg.value = data
  loading.value = false
})

async function salvar() {
  if (!cfg.value) return
  salvando.value = true
  try {
    await cfgComp.atualizar(cfg.value)
    await auditoria.registrar({
      acao: 'config_alterada',
      entidade: 'configuracao_sistema',
      detalhes: {},
    })
    toast.success('Configurações salvas')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.setting-input {
  @apply px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10]
         bg-white dark:bg-surface-canvas-dark text-sm w-full
         focus:outline-none focus:border-brand-500;
}
.setting-checkbox {
  @apply w-5 h-5 rounded text-brand-600 focus:ring-brand-500;
}
</style>
