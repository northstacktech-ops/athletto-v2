<template>
  <div
    class="rounded-xl p-4 flex items-center gap-3 shadow-card"
    :class="hero ? 'bg-ink text-white' : 'bg-white dark:bg-surface-elevated-dark border border-slate-200 dark:border-white/[0.10]'"
  >
    <div
      class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      :class="hero ? 'bg-white/10 text-white' : iconBg"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <template v-if="icon === 'up'"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></template>
        <template v-else-if="icon === 'down'"><polyline points="1 6 10.5 15.5 15.5 10.5 23 18"/><polyline points="7 18 1 18 1 12"/></template>
        <template v-else-if="icon === 'wallet'"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></template>
        <template v-else-if="icon === 'clock'"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></template>
      </svg>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs font-semibold uppercase tracking-wide truncate" :class="hero ? 'text-white/60' : 'text-slate-500 dark:text-slate-400'">{{ label }}</p>
      <p
        class="text-xl font-bold leading-tight truncate"
        :class="hero ? 'text-white' : valueColor"
      >{{ value }}</p>
      <p v-if="badge" class="text-xs mt-0.5 font-semibold truncate" :class="hero ? 'text-red-300' : 'text-red-500'">{{ badge }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
type Tone = 'default' | 'income' | 'expense' | 'pending'

const props = withDefaults(defineProps<{
  label: string
  value: string
  icon: 'up' | 'down' | 'wallet' | 'clock'
  tone?: Tone
  hero?: boolean
  badge?: string | null
}>(), { tone: 'default', hero: false, badge: null })

const iconBg = computed(() => {
  switch (props.tone) {
    case 'income': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
    case 'expense': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
    case 'pending': return 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
    default: return 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
  }
})

const valueColor = computed(() => 'text-slate-900 dark:text-white')
</script>
