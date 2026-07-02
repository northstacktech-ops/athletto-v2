<template>
  <div
    class="group relative bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.06] border-l-4 px-card py-card transition-colors shadow-card"
    :class="borderClasses"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <!-- Label -->
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          {{ label }}
        </p>

        <!-- Value -->
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-2xl font-bold leading-none truncate" :class="valueClasses">
            {{ formattedValue }}
          </span>
          <span v-if="unit" class="text-sm font-medium text-gray-400 dark:text-gray-500">{{ unit }}</span>
        </div>

        <!-- Delta -->
        <div v-if="trend !== undefined && trend !== null" class="mt-2.5 flex items-center gap-1.5">
          <span
            class="inline-flex items-center gap-0.5 text-xs font-semibold"
            :class="deltaClasses"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="trend >= 0" d="M7 17l5-5 4 4 5-5"/>
              <path v-else d="M7 7l5 5 4-4 5 5"/>
            </svg>
            {{ Math.abs(trend) }}{{ trendUnit }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ trendLabel ?? 'vs mês anterior' }}</span>
        </div>
      </div>

      <!-- Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="iconBgClasses"
      >
        <slot name="icon">
          <svg class="w-5 h-5" :class="iconColorClasses" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </slot>
      </div>
    </div>

    <!-- Sparkline (opcional) -->
    <div v-if="sparklineData?.length" class="mt-3 -mb-1 opacity-80">
      <UiSparkline :data="sparklineData" :color="sparkColor" :width="180" :height="32" class="w-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

type Variant = 'brand' | 'success' | 'danger' | 'warning' | 'neutral'

const props = withDefaults(defineProps<{
  label: string
  value: number | string
  format?: 'currency' | 'number' | 'percent' | 'none'
  unit?: string
  trend?: number | null
  trendUnit?: string
  trendLabel?: string
  trendInverse?: boolean   // se true, queda é positivo (ex: inadimplência)
  variant?: Variant
  sparklineData?: number[]
}>(), {
  variant: 'brand',
  format: 'none',
  trendUnit: '%',
  trendInverse: false,
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  switch (props.format) {
    case 'currency': return formatCurrency(props.value)
    case 'percent':  return `${props.value.toFixed(1)}%`
    case 'number':   return props.value.toLocaleString('pt-BR')
    default:         return String(props.value)
  }
})

const variantTokens: Record<Variant, {
  border: string
  value: string
  iconBg: string
  iconColor: string
  spark: string
}> = {
  brand: {
    border:    'border-l-[#11358B] dark:border-l-[#6192FC]',
    value:     'text-[#11358B] dark:text-[#6192FC]',
    iconBg:    'bg-ink-light/10 dark:bg-[#6192FC]/15',
    iconColor: 'text-[#11358B] dark:text-white',
    spark:     '#11358B',
  },
  success: {
    border:    'border-l-emerald-500',
    value:     'text-emerald-600 dark:text-emerald-400',
    iconBg:    'bg-emerald-50 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    spark:     '#10b981',
  },
  danger: {
    border:    'border-l-red-500',
    value:     'text-red-600 dark:text-red-400',
    iconBg:    'bg-red-50 dark:bg-red-500/15',
    iconColor: 'text-red-500 dark:text-red-400',
    spark:     '#ef4444',
  },
  warning: {
    border:    'border-l-amber-500',
    value:     'text-amber-600 dark:text-amber-400',
    iconBg:    'bg-amber-50 dark:bg-amber-500/15',
    iconColor: 'text-amber-500 dark:text-amber-400',
    spark:     '#f59e0b',
  },
  neutral: {
    border:    'border-l-gray-300 dark:border-l-white/15',
    value:     'text-gray-900 dark:text-white',
    iconBg:    'bg-gray-100 dark:bg-white/[0.06]',
    iconColor: 'text-gray-500 dark:text-gray-400',
    spark:     '#6b7280',
  },
}

const borderClasses    = computed(() => variantTokens[props.variant].border)
const valueClasses     = computed(() => variantTokens[props.variant].value)
const iconBgClasses    = computed(() => variantTokens[props.variant].iconBg)
const iconColorClasses = computed(() => variantTokens[props.variant].iconColor)
const sparkColor       = computed(() => variantTokens[props.variant].spark)

const deltaClasses = computed(() => {
  if (props.trend === undefined || props.trend === null) return ''
  // Se trendInverse, queda é positiva
  const positive = props.trendInverse ? props.trend < 0 : props.trend >= 0
  return positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
})
</script>
