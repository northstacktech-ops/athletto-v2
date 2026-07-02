<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-canvas-dark px-4">
    <div class="w-full max-w-sm bg-white dark:bg-surface-elevated-dark rounded-2xl shadow-card border border-slate-200 dark:border-white/[0.08] p-6">
      <h1 class="text-xl font-bold text-slate-900 dark:text-white">Primeiro acesso</h1>
      <p class="text-sm text-slate-500 mt-1">
        Você foi convidado como gestor. Informe seu e-mail e crie uma senha para entrar.
      </p>

      <form class="mt-5 space-y-4" @submit.prevent="enviar">
        <div>
          <label class="block text-sm font-semibold mb-1">E-mail</label>
          <input v-model="email" type="email" required class="form-input" placeholder="email@exemplo.com"/>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Nova senha</label>
          <input v-model="senha" type="password" required class="form-input" placeholder="Mínimo 8 caracteres"/>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Confirmar senha</label>
          <input v-model="senha2" type="password" required class="form-input"/>
        </div>

        <p v-if="erro" class="text-sm text-red-600">{{ erro }}</p>

        <button
          type="submit"
          :disabled="!pode || loading"
          class="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {{ loading ? 'Criando acesso...' : 'Criar senha e entrar' }}
        </button>
      </form>

      <NuxtLink to="/login" class="block text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-4">
        Já tenho senha — entrar
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Primeiro acesso — Athletto' })

const supabase = useSupabaseClient()
const { carregarPerfil } = useAuth()

const email = ref('')
const senha = ref('')
const senha2 = ref('')
const loading = ref(false)
const erro = ref('')

const pode = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) && senha.value.length >= 8 && senha.value === senha2.value,
)

async function enviar() {
  if (!pode.value) {
    erro.value = senha.value !== senha2.value ? 'As senhas não coincidem.' : 'Preencha os campos corretamente.'
    return
  }
  loading.value = true
  erro.value = ''
  try {
    await $fetch('/api/gestores/definir-senha', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase(), senha: senha.value },
    })
    // Senha definida → entra direto.
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim().toLowerCase(),
      password: senha.value,
    })
    if (error) throw error
    await carregarPerfil()
    await navigateTo('/')
  } catch (e: any) {
    erro.value = e?.data?.statusMessage ?? e?.message ?? 'Não foi possível concluir o primeiro acesso.'
  } finally {
    loading.value = false
  }
}
</script>
