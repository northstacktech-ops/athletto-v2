<template>
  <div class="space-y-4">

    <!-- Senha -->
    <UiSettingsSection titulo="Senha de acesso" descricao="Altere sua senha periodicamente. Use ao menos 8 caracteres com letras e números.">
      <UiSettingsField label="Senha atual">
        <input v-model="senhaAtual" type="password" class="form-input" placeholder="••••••••"/>
      </UiSettingsField>
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

    <!-- 2FA -->
    <UiSettingsSection titulo="Autenticação em duas etapas (2FA)" descricao="Camada extra de proteção via aplicativo autenticador.">
      <UiSettingsField label="Status atual" :descricao="dois_fa ? 'Ativada — você precisará do código a cada login.' : 'Desativada. Recomendamos ativar para mais segurança.'">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold" :class="dois_fa ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'">
            <span class="w-1.5 h-1.5 rounded-full" :class="dois_fa ? 'bg-emerald-500' : 'bg-slate-400'"/>
            {{ dois_fa ? 'Ativa' : 'Inativa' }}
          </span>
          <button class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60" disabled>
            {{ dois_fa ? 'Desativar' : 'Ativar 2FA' }}
          </button>
        </div>
        <p class="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Autenticação em duas etapas via app (TOTP) estará disponível em breve. Por enquanto, sua conta está protegida por senha.
        </p>
      </UiSettingsField>
    </UiSettingsSection>

    <!-- Sessões -->
    <UiSettingsSection titulo="Sessões ativas" descricao="Dispositivos onde você está conectado neste momento.">
      <div v-for="s in sessoes" :key="s.id" class="py-4 flex items-center gap-3 flex-wrap">
        <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <template v-if="s.tipo === 'desktop'"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></template>
            <template v-else><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></template>
          </svg>
        </div>
        <div class="flex-1 min-w-[180px]">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ s.dispositivo }} <span v-if="s.atual" class="ml-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">atual</span></p>
          <p class="text-xs text-slate-500">{{ s.localizacao }} · último acesso {{ s.ultimoAcesso }}</p>
        </div>
        <button v-if="!s.atual" class="text-xs font-semibold text-red-600 hover:text-red-700" disabled>Encerrar</button>
      </div>
    </UiSettingsSection>

  </div>
</template>

<script setup lang="ts">
const toast = useToast()

const senhaAtual = ref('')
const novaSenha = ref('')
const confirmar = ref('')
const salvandoSenha = ref(false)
const dois_fa = ref(false)

const podeSalvarSenha = computed(
  () => senhaAtual.value.length >= 6 && novaSenha.value.length >= 8 && novaSenha.value === confirmar.value,
)

async function salvarSenha() {
  if (!podeSalvarSenha.value) return
  salvandoSenha.value = true
  await new Promise((r) => setTimeout(r, 600))
  senhaAtual.value = novaSenha.value = confirmar.value = ''
  salvandoSenha.value = false
  toast.success('Senha atualizada com sucesso')
}

const sessoes = [
  { id: '1', dispositivo: 'Chrome — Windows', tipo: 'desktop' as const, localizacao: 'São Paulo, BR', ultimoAcesso: 'agora', atual: true },
  { id: '2', dispositivo: 'Safari — iPhone', tipo: 'mobile' as const, localizacao: 'São Paulo, BR', ultimoAcesso: 'há 2h', atual: false },
]
</script>

