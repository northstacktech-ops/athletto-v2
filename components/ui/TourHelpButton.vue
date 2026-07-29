<template>
  <button
    type="button"
    title="Rever dicas desta tela"
    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-500/10 border border-slate-200 dark:border-white/[0.10] transition-colors shrink-0"
    @click="tour.start(true)"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 2-3 4"/>
      <path d="M12 17h.01"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import type { useGuidedTour } from '~/composables/useGuidedTour'

defineProps<{ tour: ReturnType<typeof useGuidedTour> }>()
</script>
