<template>
  <section class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden shadow-card">
    <header class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ titulo }}</h2>
        <p v-if="descricao" class="text-xs text-slate-500 mt-0.5">{{ descricao }}</p>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </header>
    <div class="px-5 divide-y divide-slate-100 dark:divide-white/[0.06]">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ titulo: string; descricao?: string }>()
</script>
