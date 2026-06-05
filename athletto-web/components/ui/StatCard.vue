<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm text-gray-500 font-medium truncate">{{ label }}</p>
        <div class="mt-1.5 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-gray-900">{{ value }}</span>
          <span v-if="unit" class="text-sm text-gray-400">{{ unit }}</span>
        </div>
        <p v-if="description" class="mt-1 text-xs text-gray-400">{{ description }}</p>
      </div>

      <div
        v-if="icon"
        class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        :class="iconBg"
      >
        <slot name="icon">
          <component :is="icon" class="w-5 h-5" :class="iconColor" />
        </slot>
      </div>
    </div>

    <!-- Trend -->
    <div v-if="trend !== undefined" class="mt-3 flex items-center gap-1.5">
      <span
        class="inline-flex items-center gap-0.5 text-xs font-medium"
        :class="trend >= 0 ? 'text-teal-600' : 'text-red-500'"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            :d="trend >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'"
          />
        </svg>
        {{ Math.abs(trend) }}%
      </span>
      <span class="text-xs text-gray-400">{{ trendLabel ?? 'vs. mês anterior' }}</span>
    </div>

    <!-- Alert highlight (para pendentes/dívidas) -->
    <div v-if="alert" class="mt-3">
      <NuxtLink
        v-if="alertTo"
        :to="alertTo"
        class="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
      >
        {{ alert }}
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </NuxtLink>
      <p v-else class="text-xs text-amber-600 font-medium">{{ alert }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  unit?: string
  description?: string
  icon?: object
  iconBg?: string
  iconColor?: string
  trend?: number
  trendLabel?: string
  alert?: string
  alertTo?: string
}>()
</script>
