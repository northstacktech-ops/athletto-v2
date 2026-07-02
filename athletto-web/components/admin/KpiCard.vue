<template>
  <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-4 flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :style="{ backgroundColor: accent }">
      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <!-- financial -->
        <template v-if="icon === 'financial'">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </template>
        <template v-else-if="icon === 'athletes'">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </template>
        <template v-else-if="icon === 'groups'">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2"/>
          <path d="M5 11V9a2 2 0 012-2h10a2 2 0 012 2v2"/>
        </template>
        <template v-else-if="icon === 'gift'">
          <rect x="2" y="7" width="20" height="5" rx="1"/>
          <path d="M12 7v15M20 12v10H4V12"/>
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </template>
        <template v-else-if="icon === 'billing'">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
        </template>
        <template v-else-if="icon === 'frequency'">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </template>
      </svg>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ label }}</p>
      <p class="text-xl font-bold leading-tight truncate" :style="{ color: accent }">
        {{ value }}
      </p>
      <p v-if="badge" class="text-xs mt-0.5 truncate text-orange-500 font-semibold">
        {{ badge }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string
  icon: 'financial' | 'athletes' | 'groups' | 'gift' | 'billing' | 'frequency'
  accent?: string
  badge?: string | null
}>(), {
  accent: '#3d5afe',
  badge: null,
})
</script>
