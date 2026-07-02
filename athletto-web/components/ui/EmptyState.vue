<template>
  <div class="flex flex-col items-center justify-center text-center" :class="paddingClass">
    <!-- Icon area -->
    <div
      class="rounded-2xl flex items-center justify-center mb-3"
      :class="[
        size === 'sm' ? 'w-10 h-10' : 'w-14 h-14',
        iconBg ?? 'bg-gray-100 dark:bg-white/[0.04]',
      ]"
    >
      <slot name="icon">
        <svg class="text-gray-400 dark:text-gray-600" :class="size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </slot>
    </div>

    <h3
      class="font-semibold text-gray-900 dark:text-white"
      :class="size === 'sm' ? 'text-sm mb-0.5' : 'text-base mb-1'"
    >{{ title }}</h3>
    <p
      v-if="description"
      class="text-gray-500 dark:text-gray-400 max-w-sm"
      :class="size === 'sm' ? 'text-sm mb-3' : 'text-sm mb-4'"
    >{{ description }}</p>

    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description?: string
  iconBg?: string
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const paddingClass = computed(() => props.size === 'sm' ? 'py-8 px-4' : 'py-12 px-4')
</script>
