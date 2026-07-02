<template>
  <div>
    <!-- Card explicativo -->
    <div
      v-if="!fechado"
      class="rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/70 dark:bg-brand-500/10 px-4 py-3.5 flex gap-3"
    >
      <span class="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-brand-900 dark:text-brand-100">{{ titulo }}</p>
        <p class="text-xs text-brand-800/80 dark:text-brand-200/80 mt-0.5 leading-relaxed">{{ texto }}</p>
      </div>
      <button
        type="button"
        class="p-1 rounded-md text-brand-700/60 hover:text-brand-900 dark:text-brand-300/60 dark:hover:text-white hover:bg-brand-100/60 dark:hover:bg-white/10 shrink-0 self-start"
        aria-label="Fechar dica"
        @click="fechar"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Reabrir -->
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      @click="abrir"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      Sobre esta seção
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ chave: string; titulo: string; texto: string }>()

const fechado = ref(false)

function storageKey() {
  return `athletto_guia_${props.chave}`
}

onMounted(() => {
  if (import.meta.client) fechado.value = localStorage.getItem(storageKey()) === '1'
})

// Ao trocar de aba (chave muda), reavalia o estado persistido daquela aba.
watch(() => props.chave, () => {
  if (import.meta.client) fechado.value = localStorage.getItem(storageKey()) === '1'
})

function fechar() {
  fechado.value = true
  if (import.meta.client) localStorage.setItem(storageKey(), '1')
}
function abrir() {
  fechado.value = false
  if (import.meta.client) localStorage.removeItem(storageKey())
}
</script>
