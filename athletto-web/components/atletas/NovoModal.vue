<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

        <div class="relative w-full sm:max-w-md bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ etapa === 'link' ? 'Link de cadastro' : 'Adicionar atleta' }}
            </h2>
            <button type="button" class="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Escolha -->
          <div v-if="etapa === 'escolha'" class="p-6 space-y-3">
            <p class="text-sm text-gray-500 dark:text-white/60">Como você quer adicionar o atleta?</p>

            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors text-left"
              @click="$emit('manual')"
            >
              <span class="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </span>
              <span class="flex-1">
                <span class="block text-sm font-bold text-gray-900 dark:text-white">Cadastrar manualmente</span>
                <span class="block text-xs text-gray-500 dark:text-white/50">Você preenche os dados do atleta agora</span>
              </span>
            </button>

            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors text-left"
              @click="etapa = 'link'"
            >
              <span class="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </span>
              <span class="flex-1">
                <span class="block text-sm font-bold text-gray-900 dark:text-white">Enviar link de cadastro</span>
                <span class="block text-xs text-gray-500 dark:text-white/50">O responsável preenche os dados pelo celular</span>
              </span>
            </button>
          </div>

          <!-- Link -->
          <div v-else class="p-6 space-y-4">
            <template v-if="slug">
              <p class="text-sm text-gray-500 dark:text-white/60">Compartilhe este link com o responsável. Ele preenche os dados e o atleta entra na sua lista.</p>
              <div>
                <p class="text-xs font-semibold text-gray-500 mb-1">Link público de cadastro</p>
                <div class="flex gap-2">
                  <input :value="linkPublico" readonly class="form-input font-mono text-xs flex-1" />
                  <button type="button" class="px-3 rounded-lg text-sm font-semibold border border-gray-200 dark:border-white/12 hover:bg-gray-50 dark:hover:bg-white/10" @click="copiar">{{ copiado ? 'Copiado!' : 'Copiar' }}</button>
                </div>
              </div>
              <a :href="waLink" target="_blank" rel="noopener" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2z"/></svg>
                Enviar por WhatsApp
              </a>
              <button type="button" class="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white" @click="etapa = 'escolha'">← Voltar</button>
            </template>
            <template v-else>
              <p class="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                Defina o endereço público do seu clube primeiro, em <NuxtLink to="/configuracoes#equipe" class="font-bold underline" @click="$emit('close')">Configurações → Equipe</NuxtLink>.
              </p>
              <button type="button" class="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white" @click="etapa = 'escolha'">← Voltar</button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; slug?: string }>()
defineEmits<{ (e: 'close'): void; (e: 'manual'): void }>()

const etapa = ref<'escolha' | 'link'>('escolha')
const copiado = ref(false)

watch(() => props.open, (v) => { if (v) etapa.value = 'escolha' })

const linkPublico = computed(() => {
  const base = import.meta.client ? window.location.origin : 'https://www.athletto.com.br'
  return `${base}/cadastro/${props.slug ?? ''}`
})

const waLink = computed(() =>
  `https://wa.me/?text=${encodeURIComponent(`Cadastre-se no nosso clube pelo Athletto: ${linkPublico.value}`)}`,
)

async function copiar() {
  try {
    await navigator.clipboard.writeText(linkPublico.value)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
  } catch { /* ignore */ }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
