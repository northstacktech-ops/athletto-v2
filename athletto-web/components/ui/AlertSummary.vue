<template>
  <div
    v-if="items.length > 0"
    class="card overflow-hidden"
  >
    <div class="flex items-center gap-2.5 px-card pt-card pb-3 border-b border-gray-100 dark:border-white/[0.04]">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-500/15">
        <svg class="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.74c1.154 2-.29 4.5-2.598 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
        </svg>
      </div>
      <h3 class="text-base font-semibold text-gray-900 dark:text-white flex-1">Requer atenção</h3>
      <span class="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-xs font-bold">
        {{ items.length }}
      </span>
    </div>

    <ul class="divide-y divide-gray-100 dark:divide-white/[0.04]">
      <li v-for="item in items.slice(0, maxItems)" :key="item.id" class="flex items-center gap-3 px-card py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          :class="avatarClasses(item.severity)"
        >
          {{ item.avatar ?? '!' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.title }}</p>
          <p class="text-xs mt-0.5" :class="hintClasses(item.severity)">{{ item.hint }}</p>
        </div>
        <NuxtLink
          v-if="item.to"
          :to="item.to"
          class="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors shrink-0"
          :class="ctaClasses(item.severity)"
        >
          {{ item.ctaLabel ?? 'Ver' }}
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </NuxtLink>
      </li>
    </ul>

    <div v-if="items.length > maxItems" class="px-card py-3 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02]">
      <NuxtLink v-if="seeAllTo" :to="seeAllTo" class="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">
        Ver todos os {{ items.length }} alertas →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
export type AlertItem = {
  id: string | number
  title: string
  hint: string
  avatar?: string
  to?: string
  ctaLabel?: string
  severity?: 'danger' | 'warning' | 'info'
}

withDefaults(defineProps<{
  items: AlertItem[]
  maxItems?: number
  seeAllTo?: string
}>(), {
  maxItems: 3,
})

function avatarClasses(severity?: AlertItem['severity']) {
  switch (severity) {
    case 'danger':  return 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
    case 'warning': return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
    default:        return 'bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300'
  }
}

function hintClasses(severity?: AlertItem['severity']) {
  switch (severity) {
    case 'danger':  return 'text-red-500 dark:text-red-400'
    case 'warning': return 'text-amber-600 dark:text-amber-400'
    default:        return 'text-gray-500 dark:text-gray-400'
  }
}

function ctaClasses(severity?: AlertItem['severity']) {
  switch (severity) {
    case 'danger':  return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15'
    case 'warning': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
    default:        return 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 hover:bg-brand-100'
  }
}
</script>
