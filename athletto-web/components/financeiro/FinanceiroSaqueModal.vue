<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />

    <div class="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Solicitar saque</h3>
        <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-5 space-y-4">

        <!-- Saldo disponível (informativo) -->
        <div v-if="saldoDisponivel !== null" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-emerald-600 shrink-0"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span class="text-sm text-emerald-800 dark:text-emerald-200">
            Saldo disponível: <strong>{{ formatCurrency(saldoDisponivel) }}</strong>
          </span>
        </div>

        <!-- Valor -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Valor do saque</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">R$</span>
            <input
              v-model="form.valorStr"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              @input="mascaraValor"
            />
          </div>
          <p v-if="erroValor" class="text-xs text-red-500 mt-1">{{ erroValor }}</p>
        </div>

        <!-- Tipo de transferência -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tipo de transferência</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="op in ['pix', 'ted']"
              :key="op"
              :class="form.tipo === op
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                : 'border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:border-slate-300'"
              class="py-2.5 rounded-xl border text-sm font-semibold transition-colors"
              @click="form.tipo = op as 'pix' | 'ted'"
            >
              {{ op === 'pix' ? 'Pix' : 'TED' }}
            </button>
          </div>
        </div>

        <!-- Campos Pix -->
        <div v-if="form.tipo === 'pix'">
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Chave Pix</label>
          <input
            v-model="form.chave_pix"
            type="text"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <!-- Campos TED -->
        <template v-if="form.tipo === 'ted'">
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Banco</label>
            <input
              v-model="form.banco"
              type="text"
              placeholder="Código do banco (ex: 001 = BB, 341 = Itaú)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Agência</label>
              <input
                v-model="form.agencia"
                type="text"
                placeholder="0001"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Conta</label>
              <input
                v-model="form.conta"
                type="text"
                placeholder="12345-6"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tipo de conta</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="tc in ['corrente', 'poupanca']"
                :key="tc"
                :class="form.tipo_conta === tc
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:border-slate-300'"
                class="py-2 rounded-xl border text-xs font-semibold transition-colors"
                @click="form.tipo_conta = tc"
              >
                {{ tc === 'corrente' ? 'Corrente' : 'Poupança' }}
              </button>
            </div>
          </div>
        </template>

        <!-- Erro geral -->
        <p v-if="erroGeral" class="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{{ erroGeral }}</p>

        <!-- CTA -->
        <button
          :disabled="enviando"
          class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          @click="confirmar"
        >
          <span v-if="enviando" class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Enviando...
          </span>
          <span v-else>Confirmar saque</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = defineProps<{ saldoDisponivel: number | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirmado'): void }>()

const carteira = useCarteira()

const form = reactive({
  valorStr: '',
  tipo: 'pix' as 'pix' | 'ted',
  chave_pix: '',
  banco: '',
  agencia: '',
  conta: '',
  tipo_conta: 'corrente',
})

const erroValor = ref<string | null>(null)
const erroGeral = ref<string | null>(null)
const enviando = ref(false)

function mascaraValor() {
  let v = form.valorStr.replace(/\D/g, '')
  if (!v) { form.valorStr = ''; return }
  const num = Number(v) / 100
  form.valorStr = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function valorNumerico() {
  return Number(form.valorStr.replace(/\./g, '').replace(',', '.')) || 0
}

async function confirmar() {
  erroValor.value = null
  erroGeral.value = null
  const valor = valorNumerico()

  if (!valor || valor <= 0) { erroValor.value = 'Informe um valor válido.'; return }
  if (props.saldoDisponivel !== null && valor > props.saldoDisponivel) {
    erroValor.value = `Valor maior que o saldo disponível (${formatCurrency(props.saldoDisponivel)}).`
    return
  }

  enviando.value = true
  const result = await carteira.enviarSaque({
    valor,
    tipo: form.tipo,
    chave_pix: form.tipo === 'pix' ? form.chave_pix : undefined,
    banco: form.tipo === 'ted' ? form.banco : undefined,
    agencia: form.tipo === 'ted' ? form.agencia : undefined,
    conta: form.tipo === 'ted' ? form.conta : undefined,
    tipo_conta: form.tipo === 'ted' ? form.tipo_conta : undefined,
  })
  enviando.value = false

  if (result.ok) {
    emit('confirmado')
  } else {
    erroGeral.value = result.erro ?? 'Falha ao solicitar saque.'
  }
}
</script>
