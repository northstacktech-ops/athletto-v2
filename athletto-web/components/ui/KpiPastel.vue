<template>
  <div
    class="bg-white dark:bg-surface-elevated-dark rounded-2xl border border-slate-200 dark:border-white/[0.08] transition-colors"
    :class="compact ? 'p-4' : 'p-5'"
  >
    <div class="flex items-start justify-between gap-2" :class="compact ? 'min-h-[24px]' : 'min-h-[28px]'">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-tight">
        {{ label }}
      </p>
      <span
        v-if="$slots.icon"
        class="rounded-lg flex items-center justify-center shrink-0"
        :class="[iconClass, compact ? 'w-7 h-7' : 'w-8 h-8']"
      >
        <slot name="icon" />
      </span>
    </div>

    <p
      class="font-bold leading-none truncate text-slate-900 dark:text-white"
      :class="compact ? 'text-[22px] mt-2' : 'text-[28px] mt-3'"
    >
      {{ value }}
    </p>

    <p v-if="delta || $slots.delta" class="truncate" :class="[deltaClass, compact ? 'text-[11px] mt-1.5' : 'text-xs mt-2']">
      <slot name="delta">{{ delta }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
type Tone = 'brand' | 'violet' | 'amber' | 'emerald' | 'slate' | 'rose'
type Trend = 'up' | 'down' | 'neutral'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  tone?: Tone
  delta?: string
  trend?: Trend
  /** Variante compacta: menor altura/padding/valor, para grids densos. */
  density?: 'comfortable' | 'compact'
}>(), {
  tone: 'brand',
  trend: 'neutral',
  density: 'comfortable',
})

const compact = computed(() => props.density === 'compact')

const iconClass = computed(() => {
  switch (props.tone) {
    case 'brand':   return 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
    case 'violet':  return 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'
    case 'amber':   return 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
    case 'emerald': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
    case 'rose':    return 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
    case 'slate':   return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
  }
})

const deltaClass = computed(() => {
  if (props.trend === 'up')   return 'text-emerald-600 dark:text-emerald-400 font-medium'
  if (props.trend === 'down') return 'text-rose-600 dark:text-rose-400 font-medium'
  return 'text-slate-500 dark:text-slate-400'
})
</script>
