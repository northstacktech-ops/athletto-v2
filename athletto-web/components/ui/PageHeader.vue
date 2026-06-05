<template>
  <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <!-- Breadcrumb -->
      <nav v-if="breadcrumbs?.length" class="flex items-center gap-1.5 mb-1.5">
        <template v-for="(crumb, i) in breadcrumbs" :key="crumb.label">
          <NuxtLink
            v-if="crumb.to"
            :to="crumb.to"
            class="text-xs text-gray-400 hover:text-gray-600"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="text-xs text-gray-500">{{ crumb.label }}</span>
          <svg
            v-if="i < breadcrumbs.length - 1"
            class="w-3 h-3 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </template>
      </nav>

      <h1 class="text-xl sm:text-2xl font-semibold text-gray-900">{{ title }}</h1>
      <p v-if="description" class="mt-0.5 text-sm text-gray-500">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  breadcrumbs?: { label: string; to?: string }[]
}>()
</script>
