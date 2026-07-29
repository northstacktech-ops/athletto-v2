<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

        <div class="relative w-full sm:max-w-md bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <!-- Faixa de marca -->
          <div class="bg-brand-600 px-6 pt-7 pb-6 text-center relative">
            <button type="button" class="absolute top-3 right-3 p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="w-16 h-16 mx-auto rounded-2xl bg-white/15 grid place-items-center mb-3">
              <BrandMark class="w-9 h-9 text-white" />
            </div>
            <h2 class="text-lg font-bold text-white">Conta registrada! 🎉</h2>
            <p class="text-sm text-white/80 mt-1 leading-relaxed">
              Estamos validando seus dados de recebimento — é rápido e automático.
              Você é avisado assim que estiver tudo certo.
            </p>
          </div>

          <!-- Próximos passos -->
          <div class="p-6 space-y-3">
            <p class="text-sm font-semibold text-slate-700 dark:text-white/80">Enquanto isso, adiante o que importa:</p>

            <NuxtLink
              v-for="passo in passos" :key="passo.to"
              :to="passo.to"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors group"
              @click="$emit('close')"
            >
              <span class="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0" v-html="passo.icon" />
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-bold text-slate-900 dark:text-white">{{ passo.titulo }}</span>
                <span class="block text-xs text-slate-500 dark:text-white/50">{{ passo.desc }}</span>
              </span>
              <svg class="w-4 h-4 text-slate-300 group-hover:text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </NuxtLink>

            <button type="button" class="w-full mt-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white" @click="$emit('close')">
              Continuar configurando depois
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const passos = [
  { to: '/atletas', titulo: 'Cadastrar atletas', desc: 'Comece a montar seu elenco', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' },
  { to: '/turmas', titulo: 'Criar turmas', desc: 'Organize treinos e horários', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { to: '/calendario', titulo: 'Organizar calendário', desc: 'Planeje sua agenda', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
]
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
