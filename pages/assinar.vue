<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">

    <!-- Header -->
    <header class="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/[0.07] px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <BrandMark class="w-4 h-4 text-white" />
          </div>
          <span class="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Athletto</span>
        </div>
        <button class="text-sm text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white/80 font-medium transition-colors" @click="cancelar">
          ← Cancelar
        </button>
      </div>
    </header>

    <!-- Steps -->
    <div class="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/[0.07] px-6 py-3.5">
      <div class="max-w-5xl mx-auto flex items-center gap-2">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
          <span :class="etapa === 'dados' ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-white/40'" class="text-sm">Identificação</span>
        </div>
        <div class="h-px w-8 bg-slate-200 dark:bg-white/10 shrink-0" />
        <div class="flex items-center gap-2">
          <div :class="etapa !== 'dados' ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/40'" class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
          <span :class="etapa === 'pix' || etapa === 'sucesso' ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-white/40'" class="text-sm">Pagamento</span>
        </div>
        <div class="h-px w-8 bg-slate-200 dark:bg-white/10 shrink-0" />
        <div class="flex items-center gap-2">
          <div :class="etapa === 'sucesso' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/40'" class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
          <span :class="etapa === 'sucesso' ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-white/40'" class="text-sm">Confirmado</span>
        </div>
      </div>
    </div>

    <!-- Main -->
    <main class="flex-1 px-4 py-8">
      <div class="max-w-5xl mx-auto">
        <div class="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          <!-- LEFT -->
          <div class="space-y-4">

            <!-- ETAPA dados -->
            <div v-if="etapa === 'dados'" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-6 space-y-6">
              <div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">Informações do cliente</h2>
                <p class="text-sm text-slate-500 dark:text-white/50 mt-0.5">Esses dados identificam sua transação.</p>
              </div>

              <!-- Nome -->
              <div>
                <label class="block text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-1.5">Nome</label>
                <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.07]">
                  <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  <span class="text-sm text-slate-700 dark:text-white/80 font-medium">{{ gestor?.nome ?? '—' }}</span>
                </div>
              </div>

              <!-- CPF -->
              <div>
                <label class="block text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-1.5">CPF</label>
                <div v-if="temCpf" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.07]">
                  <svg class="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  <span class="text-sm text-slate-700 dark:text-white/80 font-medium font-mono">{{ cpfFormatado }}</span>
                </div>
                <div v-else class="space-y-1.5">
                  <input
                    v-model="cpfInput"
                    type="text"
                    inputmode="numeric"
                    maxlength="14"
                    placeholder="000.000.000-00"
                    class="form-input w-full"
                    :class="{ err: cpfErro }"
                    @keydown.enter="gerarPix"
                  />
                  <p v-if="cpfErro" class="text-xs text-red-600">{{ cpfErro }}</p>
                  <p v-else class="text-xs text-slate-400">Necessário para identificar a transação Pix.</p>
                </div>
              </div>

              <!-- Método -->
              <div>
                <label class="block text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-2">Método de pagamento</label>
                <div class="flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/40">
                  <svg viewBox="0 0 512 512" class="w-9 h-9 shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" rx="96" fill="#32BCAD"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M160 256l96-96 96 96-96 96-96-96zm96-48l48 48-48 48-48-48 48-48z" fill="white"/>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-bold text-slate-900 dark:text-white">Pix</p>
                    <p class="text-xs text-slate-500 dark:text-white/50 mt-0.5">Pagamento instantâneo e seguro</p>
                  </div>
                  <div class="w-5 h-5 rounded-full border-2 border-brand-500 bg-brand-500 flex items-center justify-center shrink-0">
                    <div class="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <button
                :disabled="carregando"
                class="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="gerarPix"
              >
                {{ carregando ? 'Gerando Pix…' : `Gerar Pix — ${formatCurrency(planoInfo.preco)}` }}
              </button>

              <p class="text-xs text-center text-slate-400">
                Você não perde os dias de teste restantes ao assinar agora.
              </p>
            </div>

            <!-- ETAPA pix -->
            <div v-else-if="etapa === 'pix'" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-6">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1">Pague o Pix</h2>
              <p class="text-sm text-slate-500 dark:text-white/50 mb-6">Escaneie o QR Code ou copie o código abaixo. A confirmação é automática.</p>

              <div class="flex flex-col items-center gap-5">
                <div class="p-3 rounded-2xl border-2 border-slate-100 dark:border-white/10 bg-white shadow-sm">
                  <img v-if="pixQr" :src="pixQr" alt="QR Code Pix" class="w-52 h-52 rounded-lg" />
                  <div v-else class="w-52 h-52 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>

                <div class="w-full">
                  <p class="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-2">Pix copia e cola</p>
                  <div class="flex gap-2">
                    <input :value="pixEmv" readonly class="form-input font-mono text-xs flex-1 bg-slate-50 dark:bg-white/[0.04]" />
                    <button
                      type="button"
                      class="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/12 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap text-slate-700 dark:text-white/80"
                      @click="copiar"
                    >
                      {{ copiado ? 'Copiado!' : 'Copiar' }}
                    </button>
                  </div>
                </div>

                <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 w-full">
                  <div class="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
                  <span class="text-sm text-amber-700 dark:text-amber-300 font-medium">Aguardando confirmação do pagamento…</span>
                </div>
              </div>
            </div>

            <!-- ETAPA sucesso -->
            <div v-else class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-10 text-center">
              <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/15 grid place-items-center mb-5">
                <svg class="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 class="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Pagamento confirmado!</h2>
              <p class="text-sm text-slate-500 dark:text-white/50 mb-7 max-w-xs mx-auto">
                Seu plano <strong class="text-slate-700 dark:text-white/80">{{ planoInfo.nome }}</strong> está ativo.
                <template v-if="dataFimTrial"> A primeira cobrança recorrente será em <strong>{{ dataFimTrial }}</strong>.</template>
              </p>
              <button
                class="px-8 py-3 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                @click="navigateTo('/configuracoes#assinatura')"
              >
                Ir para o painel
              </button>
            </div>

          </div>

          <!-- RIGHT SIDEBAR -->
          <div class="lg:sticky lg:top-6 space-y-4 order-first lg:order-last">

            <!-- Plan summary card -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm overflow-hidden">
              <div class="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.07]">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p class="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-1">Plano selecionado</p>
                    <p class="text-xl font-extrabold text-slate-900 dark:text-white">{{ planoInfo.nome }}</p>
                  </div>
                  <span v-if="planoInfo.tag" class="mt-1 px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold shrink-0">
                    {{ planoInfo.tag }}
                  </span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ formatCurrency(planoInfo.preco) }}</span>
                  <span class="text-sm text-slate-400">/mês</span>
                </div>
              </div>

              <div class="px-5 py-4 space-y-2.5 border-b border-slate-100 dark:border-white/[0.07]">
                <div class="flex items-center gap-2.5 text-sm text-slate-600 dark:text-white/70">
                  <svg class="w-4 h-4 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  {{ planoInfo.limites.atletas ? `Até ${planoInfo.limites.atletas} atletas` : 'Atletas ilimitados' }}
                </div>
                <div class="flex items-center gap-2.5 text-sm text-slate-600 dark:text-white/70">
                  <svg class="w-4 h-4 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  {{ planoInfo.limites.turmas ? `Até ${planoInfo.limites.turmas} turmas` : 'Turmas ilimitadas' }}
                </div>
                <div class="flex items-center gap-2.5 text-sm text-slate-600 dark:text-white/70">
                  <svg class="w-4 h-4 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  {{ planoInfo.limites.gestores ? `${planoInfo.limites.gestores} gestor${planoInfo.limites.gestores > 1 ? 'es' : ''}` : 'Gestores ilimitados' }}
                </div>
              </div>

              <div class="px-5 py-4 space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-white/50">Subtotal</span>
                  <span class="font-medium text-slate-700 dark:text-white/80">{{ formatCurrency(planoInfo.preco) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-white/50">Taxa</span>
                  <span class="font-medium text-emerald-600">Grátis</span>
                </div>
                <div class="h-px bg-slate-100 dark:bg-white/[0.07] my-2" />
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 dark:text-white">Total</span>
                  <span class="text-lg font-extrabold text-slate-900 dark:text-white">{{ formatCurrency(planoInfo.preco) }}</span>
                </div>
              </div>
            </div>

            <!-- Trial notice -->
            <div v-if="trial.isTrial.value && !trial.trialExpired.value" class="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3.5 flex gap-3">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              <div class="text-xs leading-relaxed">
                <p class="font-semibold text-emerald-800 dark:text-emerald-200">Você não perde os dias de trial.</p>
                <p class="text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                  <template v-if="dataFimTrial">1ª cobrança só em <strong>{{ dataFimTrial }}</strong>.</template>
                  <template v-else>A cobrança só ocorre ao fim do período de teste.</template>
                </p>
              </div>
            </div>

            <!-- Security -->
            <div class="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-white/30">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Pagamento seguro via ValidaPay
            </div>

          </div>
        </div>
      </div>
    </main>

    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
import { PLANOS, type Clube } from '~/types'
import { formatCurrency } from '~/utils/format'

definePageMeta({ layout: false })

const route = useRoute()
const toast = useToast()
const { gestor } = useAuth()
const trial = useTrial()
const equipe = useEquipe()

// Valida o plano da query
const planoId = computed(() => {
  const p = String(route.query.plano ?? '')
  return (p in PLANOS) ? p as Clube['plano'] : null
})

if (!planoId.value) {
  await navigateTo('/configuracoes#assinatura')
}

const planoInfo = computed(() => PLANOS[planoId.value ?? 'basico'])

useHead({ title: `Assinar ${planoInfo.value.nome} — Athletto` })

// CPF
const cpfInput = ref('')
const cpfErro = ref('')
const temCpf = computed(() => String(gestor.value?.cpf ?? '').replace(/\D/g, '').length === 11)
const cpfFormatado = computed(() => {
  const s = String(gestor.value?.cpf ?? '').replace(/\D/g, '')
  if (s.length !== 11) return s
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`
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

// Trial info
const dataFimTrial = computed(() => {
  const f = trial.trialFim.value
  if (!f) return null
  return new Date(`${f}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
})

// Estados do checkout
type Etapa = 'dados' | 'pix' | 'sucesso'
const etapa = ref<Etapa>('dados')
const carregando = ref(false)
const pixQr = ref('')
const pixEmv = ref('')
const copiado = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

async function gerarPix() {
  if (carregando.value || !planoId.value) return
  cpfErro.value = ''

  if (!temCpf.value) {
    if (!validarCpf(cpfInput.value)) {
      cpfErro.value = 'CPF inválido. Verifique e tente novamente.'
      return
    }
  }

  carregando.value = true
  const cpf = temCpf.value
    ? String(gestor.value?.cpf ?? '').replace(/\D/g, '')
    : cpfInput.value.replace(/\D/g, '')

  const { data, error } = await equipe.gerarPixAssinatura(planoId.value, cpf || undefined)
  carregando.value = false

  if (error || !data) {
    toast.error('Erro ao gerar Pix', String(error ?? 'Tente novamente.'))
    return
  }

  pixQr.value = (data as any).qrCodeBase64 ?? ''
  pixEmv.value = (data as any).emv ?? ''
  etapa.value = 'pix'
  iniciarPolling()
}

function iniciarPolling() {
  pararPolling()
  timer = setInterval(async () => {
    const a = await equipe.lerAssinatura()
    if (a && !a.validapay_charge_id && !a.plano_pendente) {
      pararPolling()
      etapa.value = 'sucesso'
    }
  }, 4000)
}

function pararPolling() {
  if (timer) { clearInterval(timer); timer = null }
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(pixEmv.value)
    copiado.value = true
    setTimeout(() => { copiado.value = false }, 2000)
  } catch { /* ignore */ }
}

function cancelar() {
  pararPolling()
  navigateTo('/configuracoes#assinatura')
}

onBeforeUnmount(pararPolling)
</script>
