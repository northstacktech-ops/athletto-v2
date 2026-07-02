<template>
  <div
    class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] gap-1 max-w-full overflow-x-auto no-scrollbar"
    role="tablist"
  >
    <button
      v-for="t in tabs"
      :key="String(t.value)"
      type="button"
      role="tab"
      :aria-selected="modelValue === t.value"
      class="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
      :class="modelValue === t.value
        ? 'bg-white text-slate-900 dark:bg-brand-600 dark:text-white shadow-sm'
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'"
      @click="$emit('update:modelValue', t.value)"
    >
      {{ t.label }}
      <span
        v-if="t.badge !== undefined && t.badge !== null && t.badge !== 0"
        class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold leading-none"
        :class="modelValue === t.value
          ? 'bg-brand-600 text-white'
          : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/70'"
      >
        {{ t.badge }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
defineProps<{
  modelValue: T
  tabs: { value: T; label: string; badge?: number | string | null }[]
}>()
defineEmits<{ (e: 'update:modelValue', v: T): void }>()
</script>
