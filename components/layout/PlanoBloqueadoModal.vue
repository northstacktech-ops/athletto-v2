<template>
  <Teleport to="body">
    <Transition name="fade">
      <!--
        NÃO-DISPENSÁVEL DE PROPÓSITO: ao contrário de todo outro *Modal.vue do
        app, este não tem @click.self de fechar nem botão X — o gestor tem que
        escolher um plano ou sair da conta. Não "conserte" adicionando um jeito
        de fechar sem essas duas ações.
      -->
      <div v-if="open" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

        <div class="relative w-full sm:max-w-3xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <!-- Banner de status -->
          <div :class="bannerClass" class="px-6 py-4 flex items-center gap-3 shrink-0">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path v-if="motivo === 'trial_expirado'" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path v-else d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <div>
              <p class="font-bold text-sm">{{ tituloBanner }}</p>
              <p class="text-xs opacity-80 mt-0.5">{{ subtituloBanner }}</p>
            </div>
          </div>

          <div class="p-6 space-y-6 overflow-y-auto scrollbar-slim">
            <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">Escolha seu plano</h2>

            <UiPlanosComparativo
              v-model="planoSelecionado"
              :plano-atual="clube?.plano ?? null"
              selecionavel
            />

            <button
              class="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition"
              @click="continuar"
            >
              Assinar {{ labelPlano }}
            </button>

            <p class="text-xs text-center text-slate-400">
              Pagamento via Pix · Cancele quando quiser ·
              <a href="mailto:suporte@athletto.com.br" class="underline hover:text-slate-600 dark:hover:text-slate-300">Falar com suporte</a>
            </p>

            <div class="pt-2 text-center">
              <button class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition" @click="handleSignOut">
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nomePlano, precoPlano, type Clube } from '~/types'
import { formatCurrency } from '~/utils/format'

// Mesma lista de rotas que middleware/plano.global.ts já usa pra não bloquear
// (login, cadastro, onboarding, admin, páginas públicas) — mantida aqui porque
// não existe hoje um composable compartilhado só pra essa lista.
const BYPASS = ['/upgrade', '/login', '/onboarding', '/privacidade', '/termos', '/suporte']
const BYPASS_PREFIX = ['/admin', '/cadastro/']
function isBypassed(path: string) {
  if (BYPASS.includes(path)) return true
  return BYPASS_PREFIX.some((p) => path.startsWith(p))
}

const route = useRoute()
const { signOut, clube } = useAuth()
const trial = useTrial()

const motivo = computed<'trial_expirado' | 'suspensa' | 'cancelada'>(() => {
  if (trial.status.value === 'suspensa') return 'suspensa'
  if (trial.status.value === 'cancelada') return 'cancelada'
  return 'trial_expirado'
})

const open = computed(() => {
  if (isBypassed(route.path)) return false
  const status = trial.status.value
  if (status === 'suspensa' || status === 'cancelada') return true
  return status === 'trial' && trial.trialExpired.value
})

const planoSelecionado = ref<Clube['plano']>('intermediario')

const tituloBanner = computed(() => {
  switch (motivo.value) {
    case 'suspensa': return 'Conta suspensa'
    case 'cancelada': return 'Assinatura cancelada'
    default: return 'Seu período de trial encerrou'
  }
})

const subtituloBanner = computed(() => {
  switch (motivo.value) {
    case 'suspensa': return 'Entre em contato com o suporte para reativar sua conta.'
    case 'cancelada': return 'Escolha um plano para voltar a usar o Athletto.'
    default: return 'Escolha um plano para continuar gerenciando seu clube.'
  }
})

const bannerClass = computed(() => {
  switch (motivo.value) {
    case 'suspensa': return 'bg-orange-50 text-orange-800 border-b border-orange-100'
    case 'cancelada': return 'bg-slate-100 text-slate-700 border-b border-slate-200'
    default: return 'bg-amber-50 text-amber-800 border-b border-amber-100'
  }
})

const labelPlano = computed(
  () => `${nomePlano(planoSelecionado.value)} — ${formatCurrency(precoPlano(planoSelecionado.value))}/mês`,
)

function continuar() {
  navigateTo(`/assinar?plano=${planoSelecionado.value}`)
}

async function handleSignOut() {
  await signOut()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
