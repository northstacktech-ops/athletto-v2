<template>
  <div class="card px-card py-card" :class="extraClass">
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="skeleton h-3 w-20 mb-3" />
        <div class="skeleton h-6 w-28 mb-3" />
        <div class="skeleton h-2.5 w-32" />
      </div>
      <div class="skeleton w-10 h-10 rounded-lg shrink-0" />
    </div>
    <div v-if="withSparkline" class="skeleton h-8 w-full mt-3" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  withSparkline?: boolean
  extraClass?: string
}>()
</script>
