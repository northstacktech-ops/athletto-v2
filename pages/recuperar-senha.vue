<template>
  <div>
    <!-- Sucesso state -->
    <div v-if="sent" class="text-center animate-fade-up">
      <div class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
        <svg class="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <h2 class="text-xl font-extrabold text-gray-900 mb-2">Verifique seu e-mail</h2>
      <p class="text-sm text-gray-500 mb-1">
        Enviamos um código de verificação para
      </p>
      <p class="text-sm font-bold text-gray-900 mb-6">{{ form.email }}</p>

      <NuxtLink
        :to="`/verificar-codigo?email=${encodeURIComponent(form.email)}&tipo=reset`"
        class="btn-primary inline-flex w-full"
      >
        Inserir código
        <svg class="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </NuxtLink>

      <button
        type="button"
        class="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
        :disabled="resendCooldown > 0"
        @click="handleSubmit"
      >
        <span v-if="resendCooldown > 0">Reenviar em {{ resendCooldown }}s</span>
        <span v-else>Não recebeu? Reenviar código</span>
      </button>
    </div>

    <!-- Form state -->
    <div v-else class="animate-fade-up">
      <!-- Back -->
      <NuxtLink
        to="/login"
        class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium mb-7 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Voltar ao login
      </NuxtLink>

      <div class="mb-8">
        <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900 mb-1.5">Recuperar senha</h1>
        <p class="text-sm text-gray-500">
          Informe o e-mail da sua conta e enviaremos um código de verificação.
        </p>
      </div>

      <form class="space-y-5" novalidate @submit.prevent="handleSubmit">

        <Transition name="slide-down">
          <div v-if="errorMsg" role="alert" class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
            <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm text-red-700">{{ errorMsg }}</p>
          </div>
        </Transition>

        <div>
          <label for="email" class="auth-label">E-mail da conta</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="seu@email.com"
            required
            :disabled="loading"
            :class="['auth-input', errors.email ? 'border-red-400' : '']"
            @blur="validateEmail"
          />
          <p v-if="errors.email" class="mt-1.5 text-xs text-red-500">{{ errors.email }}</p>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? 'Enviando...' : 'Enviar código de verificação' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Recuperar senha — Athletto' })

const supabase = useSupabaseClient()

const form = reactive({ email: '' })
const errors = reactive({ email: '' })
const loading = ref(false)
const sent = ref(false)
const errorMsg = ref('')
const resendCooldown = ref(0)

function validateEmail() {
  errors.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ? 'Informe um e-mail válido.'
    : ''
}

function startCooldown() {
  resendCooldown.value = 60
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(interval)
  }, 1000)
}

async function handleSubmit() {
  validateEmail()
  if (errors.email) return

  loading.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    if (error) throw error

    sent.value = true
    startCooldown()
  } catch (err: any) {
    // Por segurança, não revelar se o e-mail existe ou não
    sent.value = true
    startCooldown()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
