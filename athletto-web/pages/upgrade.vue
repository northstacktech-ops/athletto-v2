<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

    <!-- Logo -->
    <div class="flex items-center gap-2.5 mb-8">
      <div class="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
        </svg>
      </div>
      <span class="text-xl font-extrabold text-gray-900 tracking-tight">Athletto</span>
    </div>

    <!-- Card -->
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

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

        <div class="space-y-3">
          <!-- Básico -->
          <div
            class="border rounded-xl p-4 cursor-pointer transition"
            :class="planoSelecionado === 'basico'
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'"
            @click="planoSelecionado = 'basico'"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-gray-900">Básico</p>
                <p class="text-xs text-gray-500 mt-0.5">Até 30 atletas · 3 turmas</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-extrabold text-gray-900">Grátis</p>
                <p class="text-xs text-gray-400">durante o trial</p>
              </div>
            </div>
          </div>

          <!-- Intermediário -->
          <div
            class="border rounded-xl p-4 cursor-pointer transition relative"
            :class="planoSelecionado === 'intermediario'
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'"
            @click="planoSelecionado = 'intermediario'"
          >
            <span class="absolute -top-2 right-4 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </span>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-gray-900">Intermediário</p>
                <p class="text-xs text-gray-500 mt-0.5">Até 100 atletas · 10 turmas · 3 gestores</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-extrabold text-gray-900">R$&nbsp;99</p>
                <p class="text-xs text-gray-400">/mês</p>
              </div>
            </div>
          </div>

          <!-- Profissional -->
          <div
            class="border rounded-xl p-4 cursor-pointer transition"
            :class="planoSelecionado === 'profissional'
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'"
            @click="planoSelecionado = 'profissional'"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-gray-900">Profissional</p>
                <p class="text-xs text-gray-500 mt-0.5">Atletas, turmas e gestores ilimitados</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-extrabold text-gray-900">R$&nbsp;249</p>
                <p class="text-xs text-gray-400">/mês</p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <button
          class="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition"
          @click="continuarUpgrade"
        >
          Continuar com {{ labelPlano }}
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
definePageMeta({ layout: false })
useHead({ title: 'Upgrade de plano — Athletto' })

const toast = useToast()
const { signOut } = useAuth()
const motivo = useRoute().query.motivo as string ?? 'trial_expirado'

const planoSelecionado = ref<'basico' | 'intermediario' | 'profissional'>('intermediario')

const tituloBanner = computed(() => {
  switch (motivo) {
    case 'suspensa':  return 'Conta suspensa'
    case 'cancelada': return 'Assinatura cancelada'
    default:          return 'Seu período de trial encerrou'
  }
})

const subtituloBanner = computed(() => {
  switch (motivo) {
    case 'suspensa':  return 'Entre em contato com o suporte para reativar sua conta.'
    case 'cancelada': return 'Escolha um plano para voltar a usar o Athletto.'
    default:          return 'Escolha um plano para continuar gerenciando seu clube.'
  }
})

const bannerClass = computed(() => {
  switch (motivo) {
    case 'suspensa':  return 'bg-orange-50 text-orange-800 border-b border-orange-100'
    case 'cancelada': return 'bg-gray-100 text-gray-700 border-b border-gray-200'
    default:          return 'bg-amber-50 text-amber-800 border-b border-amber-100'
  }
})

const labelPlano = computed(() => {
  const m: Record<string, string> = {
    basico: 'Básico (grátis)',
    intermediario: 'Intermediário — R$ 99/mês',
    profissional: 'Profissional — R$ 249/mês',
  }
  return m[planoSelecionado.value]
})

function continuarUpgrade() {
  // Redireciona para configurações de assinatura com o plano pré-selecionado
  toast.info('Em breve', 'O checkout de upgrade será habilitado em breve. Entre em contato com o suporte.')
}

async function handleSignOut() {
  await signOut()
}
</script>
