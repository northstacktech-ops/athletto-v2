<template>
  <div class="space-y-4">

    <!-- Senha -->
    <UiSettingsSection titulo="Senha de acesso" descricao="Altere sua senha periodicamente. Use ao menos 8 caracteres com letras e números.">
      <UiSettingsField label="Nova senha" descricao="Mínimo 8 caracteres">
        <input v-model="novaSenha" type="password" class="form-input" placeholder="••••••••"/>
      </UiSettingsField>
      <UiSettingsField label="Confirmar nova senha">
        <input v-model="confirmar" type="password" class="form-input" placeholder="••••••••"/>
      </UiSettingsField>
      <div class="py-4 flex justify-end">
        <button
          :disabled="!podeSalvarSenha || salvandoSenha"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
          @click="salvarSenha"
        >
          {{ salvandoSenha ? 'Salvando...' : 'Atualizar senha' }}
        </button>
      </div>
    </UiSettingsSection>

    <!-- Sessões -->
    <UiSettingsSection titulo="Sessões ativas" descricao="Sua sessão atual e encerramento das demais.">
      <div class="py-4 flex items-center gap-3 flex-wrap">
        <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div class="flex-1 min-w-[180px]">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">
            Este dispositivo <span class="ml-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">atual</span>
          </p>
          <p class="text-xs text-slate-500 truncate">{{ navegador }} · entrou {{ ultimoLogin }}</p>
        </div>
      </div>
      <div class="py-2">
        <button
          :disabled="encerrando"
          class="px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          @click="encerrarOutras"
        >
          {{ encerrando ? 'Encerrando...' : 'Encerrar todas as outras sessões' }}
        </button>
        <p class="text-xs text-slate-400 mt-1.5">Desconecta sua conta de outros navegadores/dispositivos. Você continua logado aqui.</p>
      </div>
    </UiSettingsSection>

  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const novaSenha = ref('')
const confirmar = ref('')
const salvandoSenha = ref(false)
const encerrando = ref(false)

const podeSalvarSenha = computed(
  () => novaSenha.value.length >= 8 && novaSenha.value === confirmar.value,
)

const navegador = computed(() => (import.meta.client ? navigator.userAgent.split(') ').pop() ?? navigator.userAgent : 'Navegador'))
const ultimoLogin = computed(() => {
  const t = (user.value as any)?.last_sign_in_at
  if (!t) return 'agora'
  return new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
})

async function salvarSenha() {
  if (!podeSalvarSenha.value) return
  salvandoSenha.value = true
  const { error } = await supabase.auth.updateUser({ password: novaSenha.value })
  salvandoSenha.value = false
  if (error) {
    toast.error('Falha ao atualizar senha', error.message)
    return
  }
  novaSenha.value = confirmar.value = ''
  toast.success('Senha atualizada com sucesso')
}

async function encerrarOutras() {
  if (!window.confirm('Encerrar todas as outras sessões? Você seguirá logado neste dispositivo.')) return
  encerrando.value = true
  // Encerra as sessões dos demais dispositivos (mantém a atual).
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  encerrando.value = false
  if (error) {
    toast.error('Falha ao encerrar sessões', error.message)
    return
  }
  toast.success('Outras sessões encerradas')
}
</script>
