<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="group block relative overflow-hidden rounded-xl border border-l-4 bg-white dark:bg-surface-elevated-dark transition-all"
    :class="containerClasses"
  >
    <div class="flex items-start gap-3 p-card">
      <!-- Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="iconBgClasses"
      >
        <slot name="icon">
          <svg class="w-5 h-5" :class="iconColorClasses" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M11.484 2.17a.75.75 0 011.032 0 11.209 11.209 0 007.877 3.08.75.75 0 01.722.515 12.74 12.74 0 01.635 3.985c0 5.942-4.064 10.933-9.563 12.348a.749.749 0 01-.374 0C6.314 20.683 2.25 15.692 2.25 9.75c0-1.39.223-2.73.635-3.985a.75.75 0 01.722-.516l.143.001c2.996 0 5.718-1.17 7.734-3.08zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zM12 15a.75.75 0 000 1.5h.007a.75.75 0 000-1.5H12z" clip-rule="evenodd"/>
          </svg>
        </slot>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Eyebrow -->
        <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
          {{ eyebrow }}
        </p>

        <!-- Title -->
        <p class="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {{ title }}
        </p>

        <!-- Description -->
        <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          {{ description }}
        </p>

        <!-- CTA -->
        <div v-if="cta" class="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-0.5" :class="ctaClasses">
          {{ cta }}
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      <slot name="aside" />
    </div>
  </component>
</template>

<script setup lang="ts">
type Variant = 'brand' | 'success' | 'danger' | 'warning' | 'neutral'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  eyebrow?: string
  cta?: string
  to?: string
  variant?: Variant
}>(), {
  variant: 'brand',
})

const variantTokens: Record<Variant, {
  container: string
  iconBg: string
  iconColor: string
  cta: string
}> = {
  brand: {
    container: 'border-gray-200 dark:border-white/[0.06] border-l-[#2041fe] dark:border-l-[#6e84ff] hover:border-gray-300 dark:hover:border-white/[0.1]',
    iconBg:    'bg-[#edefff] dark:bg-[#6e84ff]',
    iconColor: 'text-[#2041fe] dark:text-white',
    cta:       'text-brand-600 dark:text-brand-400',
  },
  success: {
    container: 'border-gray-200 dark:border-white/[0.06] border-l-emerald-500 hover:border-gray-300 dark:hover:border-white/[0.1]',
    iconBg:    'bg-emerald-50 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    cta:       'text-emerald-600 dark:text-emerald-400',
  },
  danger: {
    container: 'border-gray-200 dark:border-white/[0.06] border-l-red-500 hover:border-gray-300 dark:hover:border-white/[0.1]',
    iconBg:    'bg-red-50 dark:bg-red-500/15',
    iconColor: 'text-red-500 dark:text-red-400',
    cta:       'text-red-600 dark:text-red-400',
  },
  warning: {
    container: 'border-gray-200 dark:border-white/[0.06] border-l-amber-400 hover:border-gray-300 dark:hover:border-white/[0.1]',
    iconBg:    'bg-amber-50 dark:bg-amber-500/15',
    iconColor: 'text-amber-500 dark:text-amber-400',
    cta:       'text-amber-600 dark:text-amber-400',
  },
  neutral: {
    container: 'border-gray-200 dark:border-white/[0.06] border-l-gray-300 dark:border-l-white/15 hover:border-gray-300 dark:hover:border-white/[0.1]',
    iconBg:    'bg-gray-100 dark:bg-white/[0.06]',
    iconColor: 'text-gray-500 dark:text-gray-400',
    cta:       'text-gray-700 dark:text-gray-300',
  },
}

const containerClasses = computed(() => variantTokens[props.variant].container)
const iconBgClasses    = computed(() => variantTokens[props.variant].iconBg)
const iconColorClasses = computed(() => variantTokens[props.variant].iconColor)
const ctaClasses       = computed(() => variantTokens[props.variant].cta)
</script>
