<template>
  <div class="animate-fade-up">
    <!-- Back -->
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium mb-7 transition-colors"
      @click="$router.back()"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Voltar
    </button>

    <!-- Header -->
    <div class="mb-8">
      <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-extrabold text-gray-900 mb-1.5">
        {{ tipoLabel }}
      </h1>
      <p class="text-sm text-gray-500">
        Enviamos um código de 6 dígitos para
      </p>
      <p class="text-sm font-bold text-gray-900 mt-0.5">{{ email }}</p>
    </div>

    <form novalidate @submit.prevent="handleVerify">

      <!-- Error -->
      <Transition name="slide-down">
        <div v-if="errorMsg" role="alert" class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 mb-5">
          <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-red-700">{{ errorMsg }}</p>
        </div>
      </Transition>

      <!-- OTP boxes -->
      <div class="mb-6">
        <label class="auth-label text-center block mb-4">Código de verificação</label>
        <div class="flex items-center justify-center gap-2.5" role="group" aria-label="Código de 6 dígitos">
          <input
            v-for="(_, i) in otpDigits"
            :key="i"
            :ref="el => { if (el) otpRefs[i] = el as HTMLInputElement }"
            v-model="otpDigits[i]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            pattern="[0-9]"
            :aria-label="`Dígito ${i + 1}`"
            :class="['otp-box', otpDigits[i] ? 'filled' : '', errorMsg ? '!border-red-400 !bg-red-50' : '']"
            :disabled="loading || success"
            @keydown="(e) => handleOtpKeydown(e, i)"
            @input="(e) => handleOtpInput(e, i)"
            @paste="handlePaste"
          />
        </div>

        <!-- Separador visual entre dígitos 3 e 4 -->
        <div class="flex items-center justify-center mt-2 gap-0.5">
          <div v-for="i in 6" :key="i" class="w-2 h-0.5 rounded-full transition-all" :class="otpDigits[i-1] ? 'bg-brand-400' : 'bg-gray-200'" />
        </div>
      </div>

      <!-- Success state -->
      <div v-if="success" class="text-center py-2 mb-5">
        <div class="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="text-sm font-bold text-gray-900">Código verificado!</p>
        <p class="text-xs text-gray-500 mt-0.5">Redirecionando...</p>
      </div>

      <!-- Submit -->
      <button
        v-if="!success"
        type="submit"
        class="btn-primary"
        :disabled="loading || otpValue.length < 6"
      >
        <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ loading ? 'Verificando...' : 'Verificar código' }}
      </button>
    </form>

    <!-- Reenviar -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-500">Não recebeu o código?</p>
      <button
        type="button"
        class="mt-1 text-sm font-bold transition-colors"
        :class="resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-brand-600 hover:text-brand-700'"
        :disabled="resendCooldown > 0"
        @click="handleResend"
      >
        <span v-if="resendCooldown > 0">Reenviar em {{ resendCooldown }}s</span>
        <span v-else>Reenviar código</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Verificar código — Athletto' })

const route = useRoute()
const supabase = useSupabaseClient()
const { success: toastSuccess, error: toastError } = useToast()

const email = computed(() => decodeURIComponent((route.query.email as string) ?? ''))
// Esta página atende apenas o fluxo de recuperação de senha (o cadastro
// não exige mais confirmação de e-mail).
const tipoLabel = 'Redefinir senha'

const otpDigits = ref<string[]>(Array(6).fill(''))
const otpRefs = ref<HTMLInputElement[]>([])
const otpValue = computed(() => otpDigits.value.join(''))

const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')
const resendCooldown = ref(0)

function startCooldown() {
  resendCooldown.value = 60
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(interval)
  }, 1000)
}

// ── OTP input logic ───────────────────────────────────────────────────────────
function handleOtpInput(e: Event, index: number) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '').slice(-1)
  otpDigits.value[index] = val
  if (val && index < 5) {
    nextTick(() => otpRefs.value[index + 1]?.focus())
  }
  if (otpValue.value.length === 6) handleVerify()
}

function handleOtpKeydown(e: KeyboardEvent, index: number) {
  if (e.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = ''
      nextTick(() => otpRefs.value[index - 1]?.focus())
    } else {
      otpDigits.value[index] = ''
    }
  } else if (e.key === 'ArrowLeft' && index > 0) {
    nextTick(() => otpRefs.value[index - 1]?.focus())
  } else if (e.key === 'ArrowRight' && index < 5) {
    nextTick(() => otpRefs.value[index + 1]?.focus())
  }
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6)
  pasted.split('').forEach((char, i) => {
    otpDigits.value[i] = char
  })
  nextTick(() => {
    const nextEmpty = pasted.length < 6 ? pasted.length : 5
    otpRefs.value[nextEmpty]?.focus()
    if (pasted.length === 6) handleVerify()
  })
}

// ── Verificar ─────────────────────────────────────────────────────────────────
async function handleVerify() {
  if (otpValue.value.length < 6) return

  loading.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email.value,
      token: otpValue.value,
      type: 'recovery',
    })

    if (error) throw error

    success.value = true
    toastSuccess('Verificado!', 'Código confirmado com sucesso.')

    await nextTick()
    setTimeout(async () => {
      await navigateTo('/nova-senha')
    }, 1200)
  } catch (err: any) {
    const msg: string = err?.message ?? ''
    if (msg.includes('expired') || msg.includes('invalid')) {
      errorMsg.value = 'Código inválido ou expirado. Use o código do e-mail mais recente ou clique em "Reenviar código" abaixo.'
    } else {
      errorMsg.value = 'Não foi possível verificar o código. Tente novamente.'
    }
    otpDigits.value = Array(6).fill('')
    nextTick(() => otpRefs.value[0]?.focus())
  } finally {
    loading.value = false
  }
}

// ── Reenviar ──────────────────────────────────────────────────────────────────
async function handleResend() {
  if (resendCooldown.value > 0) return

  loading.value = true
  errorMsg.value = ''
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    if (error) throw error

    startCooldown()
    toastSuccess('Código reenviado', `Verifique a caixa de entrada de ${email.value} (e Spam/Promoções).`)
  } catch (err: any) {
    const m: string = String(err?.message ?? err?.cause ?? '')
    const networkFail =
      /failed to fetch/i.test(m) ||
      (typeof err?.name === 'string' && err.name === 'TypeError' && /fetch/i.test(m))
    const isRateLimit = m.includes('rate limit') || m.includes('429') || err?.status === 429

    let friendly: string
    if (isRateLimit) {
      friendly = 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente novamente.'
    }
    else if (networkFail) {
      friendly =
        'Não conseguimos falar com o Supabase (rede ou configuração). ' +
        'Na Vercel, confira variáveis SUPABASE_URL e SUPABASE_KEY no projeto, faça um redeploy e tente de novo. ' +
        'Teste também sem bloqueador de anúncios.'
    }
    else {
      friendly = m || 'Não foi possível reenviar.'
    }
    toastError('Falha ao reenviar', friendly)
    errorMsg.value = friendly
  } finally {
    loading.value = false
  }
}

// Focar primeiro campo ao montar (cooldown só começa após reenvio manual)
onMounted(() => {
  nextTick(() => otpRefs.value[0]?.focus())
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
