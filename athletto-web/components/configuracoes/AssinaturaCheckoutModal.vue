<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="fechar">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div class="relative w-full sm:max-w-lg bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ etapa === 'ok' ? 'Pagamento confirmado' : etapa === 'cpf' ? 'Identificação' : 'Assinar o Athletto' }}
            </h2>
            <button type="button" class="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10" @click="fechar">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <!-- Etapa 1: escolher plano (assina direto pelo card) -->
            <div v-if="etapa === 'escolher'" class="space-y-3">
              <p class="text-sm text-gray-500 dark:text-white/60">Escolha o plano. O pagamento é via Pix e você não perde os dias de teste restantes.</p>
              <div
                v-for="p in planos" :key="p.id"
                class="rounded-xl border border-gray-200 dark:border-white/12 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">{{ p.nome }}</p>
                    <p class="text-xs text-gray-500 dark:text-white/50">{{ p.limites.atletas === null ? 'Atletas ilimitados' : `Até ${p.limites.atletas} atletas` }}</p>
                  </div>
                  <p class="text-base font-extrabold text-gray-900 dark:text-white whitespace-nowrap">{{ formatCurrency(p.preco) }}<span class="text-xs font-normal text-gray-400">/mês</span></p>
                </div>
                <button
                  type="button"
                  :disabled="loading"
                  class="w-full mt-3 py-2.5 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  @click="iniciarGeracao(p.id)"
                >
                  {{ planoGerando === p.id ? 'Gerando Pix…' : `Assinar ${p.nome}` }}
                </button>
              </div>
            </div>

            <!-- Etapa CPF: coletado quando o gestor não tem CPF no perfil -->
            <div v-else-if="etapa === 'cpf'" class="space-y-4">
              <p class="text-sm text-gray-500 dark:text-white/60">Para emitir o Pix precisamos do seu CPF. Ele será salvo no seu perfil.</p>
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-white/70 mb-1">CPF</label>
                <input
                  v-model="cpfInput"
                  type="text"
                  inputmode="numeric"
                  maxlength="14"
                  placeholder="000.000.000-00"
                  class="form-input w-full"
                  @keydown.enter="confirmarCpf"
                />
                <p v-if="cpfErro" class="mt-1 text-xs text-red-600">{{ cpfErro }}</p>
              </div>
              <button
                type="button"
                :disabled="loading"
                class="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                @click="confirmarCpf"
              >
                {{ loading ? 'Gerando Pix…' : 'Continuar' }}
              </button>
            </div>

            <!-- Etapa 2: Pix -->
            <div v-else-if="etapa === 'pix'" class="space-y-4 text-center">
              <p class="text-sm text-gray-500 dark:text-white/60">Pague o Pix abaixo. A confirmação é automática.</p>
              <img v-if="qr" :src="qr" alt="QR Code Pix" class="w-48 h-48 mx-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white p-2" />
              <div v-if="emv" class="text-left">
                <p class="text-xs font-semibold text-gray-500 mb-1">Pix copia e cola</p>
                <div class="flex gap-2">
                  <input :value="emv" readonly class="form-input font-mono text-xs flex-1" />
                  <button type="button" class="px-3 rounded-lg text-sm font-semibold border border-gray-200 dark:border-white/12 hover:bg-gray-50 dark:hover:bg-white/10" @click="copiar">Copiar</button>
                </div>
              </div>
              <p v-else class="text-xs text-amber-600">Pix gerado (cobrança {{ chargeId?.slice(0, 10) }}…), mas o código não veio na resposta — me avise para ajustar os campos.</p>
              <div class="flex items-center justify-center gap-2 text-sm text-gray-500 pt-1">
                <div class="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                Aguardando pagamento…
              </div>
            </div>

            <!-- Etapa 3: ok -->
            <div v-else class="text-center py-6 space-y-3">
              <div class="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/15 grid place-items-center">
                <svg class="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <p class="text-base font-bold text-gray-900 dark:text-white">Plano ativado!</p>
              <p class="text-sm text-gray-500 dark:text-white/60">Seu pagamento foi confirmado. Obrigado!</p>
              <button type="button" class="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700" @click="$emit('paid'); fechar()">Continuar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { PLANOS_LISTA, type Clube } from '~/types'
import { formatCurrency } from '~/utils/format'

const props = withDefaults(defineProps<{ open: boolean; planoInicial?: Clube['plano'] }>(), {
  planoInicial: 'basico',
})
const emit = defineEmits<{ (e: 'close'): void; (e: 'paid'): void }>()

const equipe = useEquipe()
const toast = useToast()
const { gestor } = useAuth()

const planos = PLANOS_LISTA
const etapa = ref<'escolher' | 'cpf' | 'pix' | 'ok'>('escolher')
const planoSel = ref<Clube['plano']>(props.planoInicial)
const planoGerando = ref<Clube['plano'] | null>(null)
const loading = ref(false)
const emv = ref('')
const qr = ref('')
const chargeId = ref<string | null>(null)
const cpfInput = ref('')
const cpfErro = ref('')
let timer: ReturnType<typeof setInterval> | null = null

watch(() => props.open, (v) => {
  if (v) {
    etapa.value = 'escolher'
    planoSel.value = props.planoInicial
    emv.value = ''; qr.value = ''; chargeId.value = null
    cpfInput.value = ''; cpfErro.value = ''
  } else {
    pararPolling()
  }
})

function validarCpf(cpf: string) {
  const s = cpf.replace(/\D/g, '')
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(s[i]) * (10 - i)
  let r = (soma * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== parseInt(s[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(s[i]) * (11 - i)
  r = (soma * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === parseInt(s[10])
}

async function iniciarGeracao(planoId: Clube['plano']) {
  planoSel.value = planoId
  // CPF já cadastrado no perfil → gera direto; senão pede CPF antes
  if (gestor.value?.cpf && String(gestor.value.cpf).replace(/\D/g, '').length === 11) {
    await gerar(planoId)
  } else {
    etapa.value = 'cpf'
  }
}

function confirmarCpf() {
  cpfErro.value = ''
  if (!validarCpf(cpfInput.value)) {
    cpfErro.value = 'CPF inválido. Verifique e tente novamente.'
    return
  }
  gerar(planoSel.value)
}

async function gerar(planoId: Clube['plano']) {
  if (loading.value) return
  planoGerando.value = planoId
  loading.value = true
  const cpf = String(gestor.value?.cpf ?? cpfInput.value).replace(/\D/g, '')
  const { data, error } = await equipe.gerarPixAssinatura(planoId, cpf || undefined)
  loading.value = false
  planoGerando.value = null
  if (error || !data) {
    toast.error('Não foi possível gerar o Pix', String(error ?? ''))
    if (etapa.value === 'cpf') etapa.value = 'cpf' // permanece na etapa de CPF se falhar
    return
  }
  emv.value = (data as any).emv ?? ''
  qr.value = (data as any).qrCodeBase64 ?? ''
  chargeId.value = (data as any).chargeId ?? null
  etapa.value = 'pix'
  iniciarPolling()
}

function iniciarPolling() {
  pararPolling()
  timer = setInterval(async () => {
    const a = await equipe.lerAssinatura()
    // Webhook limpa validapay_charge_id ao confirmar o pagamento.
    if (a && !a.validapay_charge_id && !a.plano_pendente) {
      pararPolling()
      etapa.value = 'ok'
    }
  }, 4000)
}
function pararPolling() {
  if (timer) { clearInterval(timer); timer = null }
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(emv.value)
    toast.success('Copiado', 'Cole no app do seu banco.')
  } catch { /* ignore */ }
}

function fechar() {
  pararPolling()
  emit('close')
}

onBeforeUnmount(pararPolling)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
