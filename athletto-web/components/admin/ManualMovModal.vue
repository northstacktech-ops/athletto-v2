<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full max-w-xl bg-white dark:bg-surface-elevated-dark rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07]">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Lançamento manual</h2>
          <p class="text-sm text-gray-500 mt-0.5">Despesa operacional ou ajuste contábil</p>
        </div>
        <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="salvar">
          <div>
            <label class="block text-sm font-semibold mb-1.5">Tipo</label>
            <select v-model="form.tipo" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm">
              <option value="despesa_operacional">Despesa operacional</option>
              <option value="reembolso">Reembolso</option>
              <option value="taxa_gateway">Taxa de gateway</option>
              <option value="mensalidade_recebida">Mensalidade recebida (ajuste)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1.5">Valor (R$)</label>
            <input v-model.number="form.valor" type="number" step="0.01" min="0.01" required
                   class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"/>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1.5">Data</label>
            <input v-model="form.data" type="date" required
                   class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"/>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1.5">Descrição</label>
            <input v-model="form.descricao" type="text" required maxlength="200"
                   class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"/>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100" @click="$emit('close')">Cancelar</button>
            <button type="submit" :disabled="loading" class="px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background-color: #3d5afe;">
              {{ loading ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { SistemaMovTipo } from '~/types'

const emit = defineEmits<{ (e: 'close'): void; (e: 'ok'): void }>()

const adminFin = useAdminFinanceiro()
const auditoria = useAuditoria()
const toast = useToast()

const loading = ref(false)
const form = reactive<{
  tipo: SistemaMovTipo
  valor: number
  data: string
  descricao: string
}>({
  tipo: 'despesa_operacional',
  valor: 0,
  data: new Date().toISOString().slice(0, 10),
  descricao: '',
})

async function salvar() {
  loading.value = true
  try {
    const { data, error } = await adminFin.registrar({
      tipo: form.tipo,
      valor: form.valor,
      data: form.data,
      descricao: form.descricao,
    })
    if (error) throw error
    await auditoria.registrar({
      acao: 'transacao_manual',
      entidade: 'movimentacao_sistema',
      entidade_id: data?.id ?? null,
      detalhes: { tipo: form.tipo, valor: form.valor },
    })
    toast.success('Lançamento salvo')
    emit('ok')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}
</script>
