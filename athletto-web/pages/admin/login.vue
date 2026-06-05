<template>
  <div>
    <div class="mb-6">
      <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider mb-3">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Painel Admin
      </div>
      <h1 class="text-2xl font-extrabold text-gray-900 mb-1">Acesso administrativo</h1>
      <p class="text-sm text-gray-500">Restrito a superadministradores da plataforma Athletto.</p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="handleLogin">
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

      <div>
        <label for="email" class="auth-label">E-mail</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="admin@athletto.com.br"
          required
          :disabled="loading"
          class="auth-input"
        />
      </div>

      <div>
        <label for="senha" class="auth-label">Senha</label>
        <input
          id="senha"
          v-model="form.senha"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
          :disabled="loading"
          class="auth-input"
        />
      </div>

      <button type="submit" class="btn-primary" :disabled="loading">
        <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span>{{ loading ? 'Validando...' : 'Entrar no Admin' }}</span>
      </button>

      <p class="text-center text-xs text-gray-400 pt-2">
        <NuxtLink to="/login" class="hover:text-gray-600">← Voltar ao login de gestor</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Acesso Admin — Athletto' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const form = reactive({ email: '', senha: '' })
const loading = ref(false)
const errorMsg = ref('')

async function validarSuperadmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('superadmins')
    .select('id, ativo')
    .eq('id', userId)
    .maybeSingle()
  return Boolean(data && data.ativo)
}

async function handleLogin() {
  errorMsg.value = ''
  if (!form.email || !form.senha) {
    errorMsg.value = 'Preencha e-mail e senha.'
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })
    if (error) throw error

    if (!user.value) throw new Error('Sessão não estabelecida.')

    const ok = await validarSuperadmin(user.value.id)
    if (!ok) {
      await supabase.auth.signOut()
      errorMsg.value = 'Este usuário não tem permissão de superadmin.'
      return
    }

    toast.success('Bem-vindo, admin', 'Acesso autorizado.')
    await navigateTo('/admin')
  } catch (err: any) {
    const msg: string = err?.message ?? ''
    if (msg.includes('Invalid login credentials')) {
      errorMsg.value = 'E-mail ou senha incorretos.'
    } else {
      errorMsg.value = msg || 'Não foi possível entrar.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (user.value) {
    const ok = await validarSuperadmin(user.value.id)
    if (ok) navigateTo('/admin')
  }
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
