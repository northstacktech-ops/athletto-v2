<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-1">Bem-vindo de volta 👋</h1>
      <p class="text-sm text-gray-500">Entre na sua conta para continuar gerenciando seu clube.</p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="handleLogin">

      <!-- Error alert -->
      <Transition name="slide-down">
        <div
          v-if="errorMsg"
          role="alert"
          class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100"
        >
          <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-red-700">{{ errorMsg }}</p>
        </div>
      </Transition>

      <!-- E-mail -->
      <div>
        <label for="email" class="auth-label">E-mail</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="seu@email.com"
          required
          :disabled="loading"
          :class="['auth-input', errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : '']"
          @blur="validateEmail"
        />
        <p v-if="errors.email" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ errors.email }}
        </p>
      </div>

      <!-- Senha -->
      <div>
        <label for="senha" class="auth-label">Senha</label>
        <div class="relative">
          <input
            id="senha"
            v-model="form.senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            required
            :disabled="loading"
            :class="['auth-input pr-11', errors.senha ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : '']"
            @blur="validateSenha"
          />
          <button
            type="button"
            tabindex="-1"
            class="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            <svg v-else class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
        <div class="flex items-center justify-between mt-1.5">
          <p v-if="errors.senha" class="text-xs text-red-500 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ errors.senha }}
          </p>
          <span v-else />
          <NuxtLink
            to="/recuperar-senha"
            class="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Esqueci a senha
          </NuxtLink>
        </div>
      </div>

      <!-- Submit -->
      <div class="pt-1">
        <button type="submit" class="btn-primary" :disabled="loading">
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>{{ loading ? 'Entrando...' : 'Entrar na conta' }}</span>
          <svg v-if="!loading" class="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </button>
      </div>

      <!-- Divider -->
      <div class="relative flex items-center gap-3 py-1">
        <div class="flex-1 h-px bg-gray-200" />
        <span class="text-xs text-gray-400 font-medium">ou continue com</span>
        <div class="flex-1 h-px bg-gray-200" />
      </div>

      <!-- Google OAuth -->
      <button type="button" class="btn-ghost" :disabled="loading" @click="handleGoogle">
        <svg class="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar com Google
      </button>

    </form>

    <!-- Cadastro link -->
    <p class="mt-4 text-center text-sm text-gray-500">
      Ainda não tem conta?
      <NuxtLink to="/cadastro" class="font-bold text-brand-600 hover:text-brand-700 transition-colors ml-1">
        Criar conta gratuita
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Entrar — Athletto' })

const supabase = useSupabaseClient()
const { success } = useToast()

const form = reactive({ email: '', senha: '' })
const errors = reactive({ email: '', senha: '' })
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

function validateEmail() {
  if (!form.email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Informe um e-mail válido.'
  } else {
    errors.email = ''
  }
}

function validateSenha() {
  if (!form.senha) {
    errors.senha = 'Informe sua senha.'
  } else if (form.senha.length < 6) {
    errors.senha = 'A senha deve ter pelo menos 6 caracteres.'
  } else {
    errors.senha = ''
  }
}

function isValid() {
  validateEmail()
  validateSenha()
  return !errors.email && !errors.senha
}

async function handleLogin() {
  if (!isValid()) return

  loading.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })
    if (error) throw error

    success('Bem-vindo!', 'Login realizado com sucesso.')
    const isFirstAccess = !localStorage.getItem('athletto_onboarding_done')
    await navigateTo(isFirstAccess ? '/onboarding' : '/')
  } catch (err: any) {
    const msg: string = String(err?.message ?? err?.cause ?? '')
    const networkFail =
      /failed to fetch/i.test(msg) ||
      (typeof err?.name === 'string' && err.name === 'TypeError' && /fetch/i.test(msg))

    if (networkFail) {
      errorMsg.value =
        'O app não está conectado ao Supabase na Vercel. Adicione as variáveis SUPABASE_URL e SUPABASE_KEY ' +
        'no projeto Vercel, faça redeploy e tente novamente.'
    }
    else if (msg.includes('Invalid login credentials')) {
      errorMsg.value = 'E-mail ou senha incorretos. Verifique e tente novamente.'
    }
    else if (msg.includes('Email not confirmed')) {
      errorMsg.value = 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
    }
    else {
      errorMsg.value = 'Não foi possível realizar o login. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  loading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  })
  if (error) {
    errorMsg.value = 'Não foi possível continuar com Google.'
    loading.value = false
  }
}

</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
