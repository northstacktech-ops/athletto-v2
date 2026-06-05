<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full sm:max-w-xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <h2 class="text-lg font-bold text-emerald-600">+ Nova entrada</h2>
          <p class="text-sm text-gray-500 mt-0.5">Registrar receita manual (fora do Pix automático)</p>
        </div>
        <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="salvar">
          <div>
            <label class="block text-sm font-semibold mb-1">Valor (R$) *</label>
            <input v-model.number="form.valor" type="number" step="0.01" min="0.01" required class="form-input"/>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Data *</label>
            <input v-model="form.data" type="date" required class="form-input"/>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Descrição</label>
            <input v-model="form.descricao" maxlength="120" class="form-input" placeholder="Doação, venda de uniforme..."/>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Vincular a uma caixinha (opcional)</label>
            <select v-model="form.caixinha_id" class="form-input">
              <option value="">Nenhuma</option>
              <option v-for="c in caixinhas" :key="c.id" :value="c.id">{{ c.nome }}</option>
            </select>
          </div>
        </form>
        <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07] flex justify-end gap-2 bg-slate-50 dark:bg-white/[0.02] shrink-0">
          <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors" @click="$emit('close')">Cancelar</button>
          <button type="button" :disabled="!podeSalvar || loading" class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 transition-colors" @click="salvar">
            {{ loading ? 'Salvando...' : 'Registrar entrada' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Caixinha } from '~/types'

const emit = defineEmits<{ (e: 'close'): void; (e: 'salvo'): void }>()

const fin = useFinanceiro()
const toast = useToast()

const loading = ref(false)
const caixinhas = ref<Caixinha[]>([])

const form = reactive({
  valor: 0,
  data: new Date().toISOString().slice(0, 10),
  descricao: '',
  caixinha_id: '',
})

onMounted(async () => {
  const { data } = await fin.listarCaixinhas()
  caixinhas.value = data ?? []
})

const podeSalvar = computed(() => form.valor > 0 && !!form.data)

async function salvar() {
  if (!podeSalvar.value) return
  loading.value = true
  try {
    await fin.registrarEntrada({
      valor: form.valor,
      data: form.data,
      descricao: form.descricao || undefined,
      caixinha_id: form.caixinha_id || undefined,
    })
    toast.success('Entrada registrada')
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}
</script>

