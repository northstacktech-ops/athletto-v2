<template>
  <div class="animate-fade-up">

    <!-- Sucesso -->
    <div v-if="done" class="text-center">
      <div class="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
        <svg class="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 class="text-xl font-extrabold text-gray-900 mb-2">Senha atualizada!</h2>
      <p class="text-sm text-gray-500 mb-6">
        Sua senha foi redefinida com sucesso. Use-a no próximo acesso.
      </p>
      <NuxtLink to="/login" class="btn-primary inline-flex w-full">
        Ir para o login
        <svg class="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Form -->
    <div v-else>
      <div class="mb-8">
        <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900 mb-1.5">Criar nova senha</h1>
        <p class="text-sm text-gray-500">Sua nova senha deve ser diferente das últimas senhas utilizadas.</p>
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

        <!-- Nova senha -->
        <div>
          <label for="nova" class="auth-label">
            Nova senha
            <span class="ml-1 text-xs font-normal text-gray-400">(mínimo 8 caracteres)</span>
          </label>
          <div class="relative">
            <input
              id="nova"
              v-model="form.nova"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="loading"
              :class="['auth-input pr-11', errors.nova ? 'border-red-400' : '']"
              @input="calcStrength"
              @blur="validateNova"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600"
              @click="showPwd = !showPwd"
            >
              <svg v-if="showPwd" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>

          <!-- Strength bar -->
          <div v-if="form.nova" class="mt-2 space-y-1.5">
            <div class="flex gap-1">
              <div
                v-for="i in 4"
                :key="i"
                class="strength-bar"
                :class="i <= strength
                  ? strength <= 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-teal-400' : 'bg-brand-500'
                  : 'bg-gray-100'"
              />
            </div>
            <p class="text-xs" :class="strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-teal-600' : 'text-brand-600'">
              {{ ['', 'Muito fraca', 'Fraca', 'Boa', 'Forte'][strength] }}
            </p>
          </div>

          <p v-if="errors.nova" class="mt-1.5 text-xs text-red-500">{{ errors.nova }}</p>
        </div>

        <!-- Confirmar -->
        <div>
          <label for="confirmar" class="auth-label">Confirmar nova senha</label>
          <div class="relative">
            <input
              id="confirmar"
              v-model="form.confirmar"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="loading"
              :class="['auth-input pr-11', errors.confirmar ? 'border-red-400' : form.confirmar && form.confirmar === form.nova ? 'border-teal-400' : '']"
              @blur="validateConfirmar"
            />
            <!-- Match indicator -->
            <div v-if="form.confirmar" class="absolute inset-y-0 right-0 flex items-center px-3.5">
              <svg v-if="form.confirmar === form.nova" class="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
          <p v-if="errors.confirmar" class="mt-1.5 text-xs text-red-500">{{ errors.confirmar }}</p>
        </div>

        <!-- Requisitos -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-2">
          <p class="text-xs font-semibold text-gray-600 mb-2">Sua senha deve conter:</p>
          <div
            v-for="req in requisitos"
            :key="req.label"
            class="flex items-center gap-2 text-xs"
            :class="req.ok ? 'text-teal-600' : 'text-gray-400'"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="req.ok ? 'M5 13l4 4L19 7' : 'M12 5v14m-7-7h14'"/>
            </svg>
            {{ req.label }}
          </div>
        </div>

        <div class="pt-1">
          <button type="submit" class="btn-primary" :disabled="loading || !formValid">
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Salvando...' : 'Salvar nova senha' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Nova senha — Athletto' })

const supabase = useSupabaseClient()
const { success: toastSuccess } = useToast()

const form = reactive({ nova: '', confirmar: '' })
const errors = reactive({ nova: '', confirmar: '' })
const loading = ref(false)
const done = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')
const strength = ref(0)

const requisitos = computed(() => [
  { label: 'Pelo menos 8 caracteres', ok: form.nova.length >= 8 },
  { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(form.nova) },
  { label: 'Um número', ok: /[0-9]/.test(form.nova) },
  { label: 'Senhas coincidem', ok: form.nova.length > 0 && form.nova === form.confirmar },
])

const formValid = computed(() => requisitos.value.every(r => r.ok))

function calcStrength() {
  const s = form.nova
  let score = 0
  if (s.length >= 8) score++
  if (/[A-Z]/.test(s)) score++
  if (/[0-9]/.test(s)) score++
  if (/[^A-Za-z0-9]/.test(s)) score++
  strength.value = score
}

function validateNova() {
  errors.nova = form.nova.length < 8 ? 'A senha deve ter pelo menos 8 caracteres.' : ''
}

function validateConfirmar() {
  errors.confirmar = form.confirmar !== form.nova ? 'As senhas não coincidem.' : ''
}

async function handleSubmit() {
  validateNova()
  validateConfirmar()
  if (errors.nova || errors.confirmar || !formValid.value) return

  loading.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase.auth.updateUser({ password: form.nova })
    if (error) throw error

    toastSuccess('Senha atualizada!', 'Sua nova senha foi salva com sucesso.')
    done.value = true
  } catch (err: any) {
    const msg: string = err?.message ?? ''
    if (msg.includes('same password')) {
      errorMsg.value = 'A nova senha não pode ser igual à senha anterior.'
    } else {
      errorMsg.value = 'Não foi possível atualizar a senha. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
