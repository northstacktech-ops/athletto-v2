<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60" />
      <div class="relative w-full max-w-xl bg-white dark:bg-surface-elevated-dark rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div class="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07]">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Aplicar voucher</h2>
          <p class="text-sm text-gray-500 mt-0.5">Conceder acesso/extensão para {{ clube.nome }}</p>
        </div>

        <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="aplicar">

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
            <select v-model="form.tipo" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm">
              <option value="trial">Extensão de trial</option>
              <option value="extensao">Extensão de assinatura</option>
              <option value="cortesia">Cortesia / Compensação</option>
              <option value="upgrade">Upgrade de plano</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Dias concedidos <span class="text-gray-400 font-normal">({{ form.dias }} dias)</span>
            </label>
            <input
              v-model.number="form.dias"
              type="range"
              min="1"
              max="365"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>1d</span><span>30d</span><span>90d</span><span>1 ano</span>
            </div>
          </div>

          <div v-if="form.tipo === 'upgrade'">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Plano concedido</label>
            <select v-model="form.plano" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm">
              <option value="basico">Base</option>
              <option value="intermediario">Pro</option>
              <option value="profissional">Elite</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Motivo *</label>
            <input
              v-model="form.motivo"
              type="text"
              required
              maxlength="180"
              placeholder="Ex: Parceria estratégica, compensação por incidente..."
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Observações (interno)</label>
            <textarea
              v-model="form.observacoes"
              rows="2"
              maxlength="500"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100" @click="$emit('close')">
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!form.motivo || loading"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style="background-color: #3d5afe;"
            >
              {{ loading ? 'Aplicando...' : 'Aplicar voucher' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Clube, VoucherTipo } from '~/types'

const props = defineProps<{ clube: Clube }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'aplicado'): void }>()

const vouchers = useVouchers()
const auditoria = useAuditoria()
const toast = useToast()

const loading = ref(false)
const form = reactive<{
  tipo: VoucherTipo
  dias: number
  plano: Clube['plano']
  motivo: string
  observacoes: string
}>({
  tipo: 'extensao',
  dias: 30,
  plano: props.clube.plano,
  motivo: '',
  observacoes: '',
})

async function aplicar() {
  if (!form.motivo) return
  loading.value = true
  try {
    const { data, error } = await vouchers.aplicar({
      clube_id: props.clube.id,
      tipo: form.tipo,
      dias_concedidos: form.dias,
      plano_concedido: form.tipo === 'upgrade' ? form.plano : null,
      motivo: form.motivo,
      observacoes: form.observacoes || null,
    })
    if (error) throw error
    await auditoria.registrar({
      acao: 'voucher_emitido',
      entidade: 'voucher',
      entidade_id: data?.id ?? null,
      detalhes: { clube_id: props.clube.id, dias: form.dias, tipo: form.tipo },
    })
    toast.success('Voucher aplicado', `+${form.dias} dias concedidos a ${props.clube.nome}`)
    emit('aplicado')
  } catch (err: any) {
    toast.error('Falha ao aplicar', err?.message ?? 'Tente novamente')
  } finally {
    loading.value = false
  }
}
</script>
