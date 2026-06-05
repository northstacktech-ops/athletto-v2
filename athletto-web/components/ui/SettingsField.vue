<template>
  <div class="py-4 flex items-center gap-4 flex-wrap">
    <div class="flex-1 min-w-[200px]">
      <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ label }}</p>
      <p v-if="descricao" class="text-xs text-slate-500 mt-0.5 max-w-md">{{ descricao }}</p>
    </div>
    <div class="w-full sm:w-[300px] shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; descricao?: string }>()
</script>
