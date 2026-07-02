<template>
  <div>
    <!-- Voltar -->
    <div class="mb-4">
      <a
        href="/login"
        class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Voltar para o login
      </a>
    </div>

    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-1">Criar conta gratuita</h1>
      <p class="text-sm text-gray-500">Configure seu clube em menos de 2 minutos.</p>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-5">
      <div
        v-for="(s, i) in steps"
        :key="s"
        class="flex items-center gap-2"
      >
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
          :class="i < step
            ? 'bg-brand-600 text-white'
            : i === step
              ? 'bg-brand-600 text-white ring-4 ring-brand-100'
              : 'bg-gray-100 text-gray-400'"
        >
          <svg v-if="i < step" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          class="text-xs font-semibold hidden sm:block"
          :class="i <= step ? 'text-brand-600' : 'text-gray-400'"
        >{{ s }}</span>
        <div v-if="i < steps.length - 1" class="w-8 h-px bg-gray-200" />
      </div>
    </div>

    <form novalidate @submit.prevent="handleSubmit">

      <!-- ── Step 0 — Responsável ────────────────────────────────── -->
      <div v-if="step === 0" class="space-y-3 animate-fade-up">

        <!-- Error alert -->
        <Transition name="slide-down">
          <div v-if="errorMsg" role="alert" class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
            <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm text-red-700">{{ errorMsg }}</p>
          </div>
        </Transition>

        <div>
          <label for="nome" class="auth-label">Seu nome completo</label>
          <input
            id="nome"
            v-model="form.nome"
            type="text"
            autocomplete="name"
            placeholder="João da Silva"
            :disabled="loading"
            :class="['auth-input', errors.nome ? 'border-red-400' : '']"
            @blur="() => validateField('nome')"
          />
          <FieldError :msg="errors.nome" />
        </div>

        <div>
          <label for="email" class="auth-label">E-mail</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="seu@email.com"
            :disabled="loading"
            :class="['auth-input', errors.email ? 'border-red-400' : '']"
            @blur="() => validateField('email')"
          />
          <FieldError :msg="errors.email" />
        </div>

        <div>
          <label for="senha" class="auth-label">
            Criar senha
            <span class="ml-1 text-xs font-normal text-gray-400">(mínimo 8 caracteres)</span>
          </label>
          <div class="relative">
            <input
              id="senha"
              v-model="form.senha"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="loading"
              :class="['auth-input pr-11', errors.senha ? 'border-red-400' : '']"
              @input="calcStrength"
              @blur="() => validateField('senha')"
            />
            <button type="button" tabindex="-1" class="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600" @click="showPwd = !showPwd">
              <svg v-if="showPwd" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>

          <!-- Strength bar -->
          <div v-if="form.senha" class="mt-2 space-y-1.5">
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
              {{ strengthLabel }}
            </p>
          </div>
          <FieldError :msg="errors.senha" />
        </div>

        <div>
          <label for="confirmar" class="auth-label">Confirmar senha</label>
          <input
            id="confirmar"
            v-model="form.confirmar"
            :type="showPwd ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="••••••••"
            :disabled="loading"
            :class="['auth-input', errors.confirmar ? 'border-red-400' : '']"
            @blur="() => validateField('confirmar')"
          />
          <FieldError :msg="errors.confirmar" />
        </div>
      </div>

      <!-- ── Step 1 — Clube ──────────────────────────────────────── -->
      <div v-if="step === 1" class="space-y-3 animate-fade-up">
        <div>
          <label for="nome-clube" class="auth-label">Nome do clube / escolinha</label>
          <input
            id="nome-clube"
            v-model="form.nomeClube"
            type="text"
            placeholder="Ex: Escolinha do Zé, Clube Atlético 2025"
            :disabled="loading"
            :class="['auth-input', errors.nomeClube ? 'border-red-400' : '']"
            @blur="() => validateField('nomeClube')"
          />
          <FieldError :msg="errors.nomeClube" />
        </div>

        <div>
          <label for="modalidade" class="auth-label">Modalidade principal</label>
          <div class="relative">
            <select
              id="modalidade"
              v-model="form.modalidade"
              :disabled="loading"
              :class="['auth-input appearance-none pr-9', errors.modalidade ? 'border-red-400' : '']"
              @blur="() => validateField('modalidade')"
            >
              <option value="" disabled>Selecione uma modalidade</option>
              <option v-for="m in modalidades" :key="m" :value="m">{{ m }}</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
          <FieldError :msg="errors.modalidade" />
        </div>

        <!-- Sem escolha de plano no cadastro: começa no trial; assina dentro do app -->
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex gap-2.5">
          <svg class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
          <p class="text-sm text-emerald-800 leading-relaxed">
            Você começa com <strong>14 dias grátis</strong>, sem cartão e sem compromisso.
            Escolhe e assina um plano quando quiser, dentro do sistema.
          </p>
        </div>
      </div>

      <!-- Buttons -->
      <div class="mt-4 space-y-2">
        <button
          v-if="step < steps.length - 1"
          type="button"
          class="btn-primary"
          :disabled="loading"
          @click="nextStep"
        >
          Continuar
          <svg class="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </button>

        <button
          v-else
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? 'Criando conta...' : 'Criar minha conta' }}
        </button>

        <button
          v-if="step > 0"
          type="button"
          class="w-full py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          @click="step--"
        >
          ← Voltar
        </button>
      </div>
    </form>

    <p class="mt-4 text-center text-xs text-gray-400">
      Ao criar sua conta, você aceita os
      <a href="#" class="underline hover:text-gray-600">Termos de Uso</a> e a
      <a href="#" class="underline hover:text-gray-600">Política de Privacidade</a>.
    </p>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'signup' })
useHead({ title: 'Criar conta — Athletto' })

const supabase = useSupabaseClient()
const { success } = useToast()

// ── Steps ────────────────────────────────────────────────────────────────────
const steps = ['Responsável', 'Seu clube']
const step = ref(0)

// ── Form ─────────────────────────────────────────────────────────────────────
const DRAFT_KEY = 'athletto_cadastro_draft'

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  confirmar: '',
  nomeClube: '',
  modalidade: '',
  plano: 'basico',
})

function saveDraft() {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, step: step.value }))
}

function restoreDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const draft = JSON.parse(raw)
    Object.assign(form, {
      nome: draft.nome ?? '',
      email: draft.email ?? '',
      senha: draft.senha ?? '',
      confirmar: draft.confirmar ?? '',
      nomeClube: draft.nomeClube ?? '',
      modalidade: draft.modalidade ?? '',
      plano: draft.plano ?? 'basico',
    })
    if (typeof draft.step === 'number') step.value = draft.step
  } catch {}
}

onMounted(() => {
  restoreDraft()
})

const errors = reactive({
  nome: '', email: '', senha: '', confirmar: '', nomeClube: '', modalidade: '',
})

const loading = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')

// ── Modalidades ───────────────────────────────────────────────────────────────
const modalidades = [
  'Futebol', 'Futsal', 'Flag Football', 'Natação', 'Tênis', 'Basquete',
  'Vôlei', 'Ciclismo', 'Jiu-Jitsu', 'Atletismo', 'Handebol', 'Outros',
]

// ── Password strength ─────────────────────────────────────────────────────────
const strength = ref(0)
const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Boa', 'Forte']
const strengthLabel = computed(() => strengthLabels[strength.value])

function calcStrength() {
  const s = form.senha
  let score = 0
  if (s.length >= 8) score++
  if (/[A-Z]/.test(s)) score++
  if (/[0-9]/.test(s)) score++
  if (/[^A-Za-z0-9]/.test(s)) score++
  strength.value = score
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateField(field: string) {
  switch (field) {
    case 'nome':
      errors.nome = form.nome.trim().length < 3 ? 'Informe seu nome completo.' : ''
      break
    case 'email':
      errors.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? 'Informe um e-mail válido.' : ''
      break
    case 'senha':
      errors.senha = form.senha.length < 8 ? 'A senha deve ter pelo menos 8 caracteres.' : ''
      break
    case 'confirmar':
      errors.confirmar = form.confirmar !== form.senha ? 'As senhas não coincidem.' : ''
      break
    case 'nomeClube':
      errors.nomeClube = form.nomeClube.trim().length < 2 ? 'Informe o nome do clube.' : ''
      break
    case 'modalidade':
      errors.modalidade = !form.modalidade ? 'Selecione uma modalidade.' : ''
      break
  }
}

function validateStep0() {
  ;(['nome', 'email', 'senha', 'confirmar'] as const).forEach(validateField)
  return !errors.nome && !errors.email && !errors.senha && !errors.confirmar
}

function validateStep1() {
  ;(['nomeClube', 'modalidade'] as const).forEach(validateField)
  return !errors.nomeClube && !errors.modalidade
}

function nextStep() {
  if (step.value === 0 && validateStep0()) step.value++
}

async function handleSubmit() {
  if (!validateStep1()) return

  loading.value = true
  errorMsg.value = ''

  try {
    // 1) Cria a conta no server (service role, email já confirmado — sem SMTP)
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.senha,
        nome: form.nome,
        nome_clube: form.nomeClube,
        modalidade: form.modalidade,
        plano: form.plano,
      },
    })

    localStorage.setItem('athletto_onboarding_nome_clube', form.nomeClube)

    // 2) Login imediato no client
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })
    if (loginErr) {
      // Conta criada mas login falhou (raro): manda para o login manual
      success('Conta criada!', 'Entre com seu e-mail e senha para continuar.')
      await navigateTo('/login')
      return
    }

    sessionStorage.removeItem(DRAFT_KEY)
    success('Conta criada!', 'Bem-vindo ao Athletto.')
    await navigateTo('/onboarding')
  } catch (err: any) {
    const status = err?.statusCode ?? err?.status ?? err?.response?.status
    const serverMsg: string = err?.statusMessage ?? err?.data?.statusMessage ?? err?.data?.message ?? ''
    if (status === 409) {
      errorMsg.value = 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.'
      step.value = 0
    } else if (status === 429) {
      errorMsg.value = 'Muitas tentativas. Aguarde um minuto e tente novamente.'
    } else if (status === 400 && serverMsg) {
      errorMsg.value = serverMsg
      step.value = 0
    } else {
      errorMsg.value = 'Não foi possível criar sua conta. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<!-- Inline sub-component para mensagem de erro de campo -->
<script lang="ts">
import { defineComponent, h } from 'vue'
const FieldError = defineComponent({
  props: { msg: String },
  setup(props) {
    return () => props.msg
      ? h('p', { class: 'mt-1.5 text-xs text-red-500 flex items-center gap-1' }, [
          h('svg', { class: 'w-3 h-3 shrink-0', fill: 'currentColor', viewBox: '0 0 20 20' }, [
            h('path', { 'fill-rule': 'evenodd', d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z', 'clip-rule': 'evenodd' }),
          ]),
          props.msg,
        ])
      : null
  },
})
export { FieldError }
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
