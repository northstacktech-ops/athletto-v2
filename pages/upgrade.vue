<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

    <!-- Logo -->
    <div class="flex items-center gap-2.5 mb-8">
      <div class="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
        <BrandMark class="w-5 h-5 text-white" />
      </div>
      <span class="text-xl font-extrabold text-gray-900 tracking-tight">Athletto</span>
    </div>

    <!-- Card -->
    <div class="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

      <!-- Banner status -->
      <div :class="bannerClass" class="px-6 py-4 flex items-center gap-3">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path v-if="motivo === 'trial_expirado'" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path v-else d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <div>
          <p class="font-bold text-sm">{{ tituloBanner }}</p>
          <p class="text-xs opacity-80 mt-0.5">{{ subtituloBanner }}</p>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <h1 class="text-2xl font-extrabold text-gray-900">Escolha seu plano</h1>

        <UiPlanosComparativo
          v-model="planoSelecionado"
          :plano-atual="clube?.plano ?? null"
          selecionavel
        />

        <!-- CTA -->
        <button
          class="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition"
          @click="continuarUpgrade"
        >
          Assinar {{ labelPlano }}
        </button>

        <p class="text-xs text-center text-gray-400">
          Pagamento via Pix · Cancele quando quiser ·
          <a href="mailto:suporte@athletto.com.br" class="underline hover:text-gray-600">Falar com suporte</a>
        </p>

        <!-- Sair -->
        <div class="pt-2 text-center">
          <button class="text-xs text-gray-400 hover:text-gray-600 transition" @click="handleSignOut">
            Sair da conta
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { nomePlano, precoPlano, type Clube } from '~/types'
import { formatCurrency } from '~/utils/format'

definePageMeta({ layout: false })
useHead({ title: 'Upgrade de plano — Athletto' })

const { signOut, clube } = useAuth()
const motivo = useRoute().query.motivo as string ?? 'trial_expirado'

const planoSelecionado = ref<Clube['plano']>('intermediario')

const tituloBanner = computed(() => {
  switch (motivo) {
    case 'suspensa':  return 'Conta suspensa'
    case 'cancelada': return 'Assinatura cancelada'
    case 'upgrade':   return 'Faça upgrade do seu plano'
    default:          return 'Seu período de trial encerrou'
  }
})

const subtituloBanner = computed(() => {
  switch (motivo) {
    case 'suspensa':  return 'Entre em contato com o suporte para reativar sua conta.'
    case 'cancelada': return 'Escolha um plano para voltar a usar o Athletto.'
    case 'upgrade':   return 'Escolha o plano ideal para o seu clube.'
    default:          return 'Escolha um plano para continuar gerenciando seu clube.'
  }
})

const bannerClass = computed(() => {
  switch (motivo) {
    case 'suspensa':  return 'bg-orange-50 text-orange-800 border-b border-orange-100'
    case 'cancelada': return 'bg-gray-100 text-gray-700 border-b border-gray-200'
    case 'upgrade':   return 'bg-brand-50 text-brand-800 border-b border-brand-100'
    default:          return 'bg-amber-50 text-amber-800 border-b border-amber-100'
  }
})

const labelPlano = computed(
  () => `${nomePlano(planoSelecionado.value)} — ${formatCurrency(precoPlano(planoSelecionado.value))}/mês`,
)

function continuarUpgrade() {
  navigateTo(`/assinar?plano=${planoSelecionado.value}`)
}

async function handleSignOut() {
  await signOut()
}
</script>
