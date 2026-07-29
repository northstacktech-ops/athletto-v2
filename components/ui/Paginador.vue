<template>
  <div class="flex items-center justify-between gap-2">
    <button
      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      :disabled="modelValue <= 1"
      @click="ir(modelValue - 1)"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      Anterior
    </button>

    <span class="text-xs font-medium text-slate-500">
      Página {{ modelValue }} de {{ totalPaginas }}
    </span>

    <button
      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      :disabled="modelValue >= totalPaginas"
      @click="ir(modelValue + 1)"
    >
      Próxima
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: number; totalPaginas: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

function ir(p: number) {
  const alvo = Math.min(Math.max(1, p), props.totalPaginas)
  if (alvo !== props.modelValue) emit('update:modelValue', alvo)
}
</script>
