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
        <p v-if="errors.email" class="mt-1.5 text-xs font-medium text-red-500">
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
          <p v-if="errors.senha" class="text-xs font-medium text-red-500">
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

    </form>

    <!-- Links inferiores -->
    <div class="mt-6 space-y-2 text-center text-sm text-gray-500">
      <p>
        Novo no Athletto? 
        <NuxtLink to="/cadastro" class="font-bold text-brand-600 hover:text-brand-700 transition-colors">Criar conta</NuxtLink>
        <span class="mx-1.5 text-gray-300">|</span>
        <NuxtLink to="/primeiro-acesso" class="font-bold text-brand-600 hover:text-brand-700 transition-colors">Primeiro acesso</NuxtLink>
      </p>
    </div>
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })
    if (error) throw error

    success('Bem-vindo!', 'Login realizado com sucesso.')

    // O destino é decidido pelo BANCO, não por localStorage: se o usuário já
    // tem gestor (logo, clube), vai direto pro painel; só cai no onboarding
    // quem ainda não criou o clube. Isso evita o onboarding reaparecer em
    // outro navegador / com cache limpo.
    let destino = '/'
    const uid = data.user?.id
    if (uid) {
      const { data: g } = await supabase
        .from('gestores')
        .select('id')
        .eq('id', uid)
        .maybeSingle()
      destino = g ? '/' : '/onboarding'
    }
    await navigateTo(destino)
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
