<template>
  <NuxtLink
    :to="item.to"
    :title="collapsed ? item.label : undefined"
    class="relative flex items-center text-sm font-medium transition-all duration-150 outline-none group rounded-full"
    :class="[
      collapsed ? 'justify-center w-9 h-9 mx-auto' : 'gap-3 px-3 py-2 w-full',
      isActive ? 'text-[#0b0d12]' : 'text-white/65 hover:text-white',
    ]"
    style="text-decoration: none;"
  >
    <span
      v-if="isActive"
      class="absolute inset-0 rounded-full"
      style="background-color: #ccff00;"
    />
    <span
      v-else
      class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      style="background-color: rgba(255,255,255,0.07);"
    />

    <span class="relative shrink-0 w-[18px] h-[18px] flex items-center justify-center">
      <svg v-if="item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <svg v-else-if="item.icon === 'athletes'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <svg v-else-if="item.icon === 'groups'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <svg v-else-if="item.icon === 'frequency'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <svg v-else-if="item.icon === 'calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <svg v-else-if="item.icon === 'billing'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm2 8h2m4 0h6"/>
      </svg>
      <svg v-else-if="item.icon === 'settings'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <svg v-else-if="item.icon === 'support'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
      </svg>
      <svg v-else-if="item.icon === 'gift'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M20 12v10H4V12"/>
        <path d="M22 7H2v5h20V7z"/>
        <path d="M12 22V7"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
      </svg>
    </span>

    <span v-if="!collapsed" class="relative truncate flex-1">{{ item.label }}</span>

    <span
      v-if="!collapsed && hasBadge"
      class="relative shrink-0 min-w-[20px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold leading-none"
      :class="badgeClasses"
    >
      {{ item.badge }}
    </span>

    <span
      v-else-if="!collapsed && item.dot"
      class="relative shrink-0 w-2 h-2 rounded-full"
      :class="[dotColor, item.dotVariant === 'danger' && 'animate-pulse']"
    />

    <span
      v-if="collapsed && showCollapsedIndicator"
      class="absolute top-0.5 right-0.5 w-[16px] h-[16px] rounded-full inline-flex items-center justify-center text-[9px] font-bold leading-none"
      :class="collapsedIndicatorClasses"
    >
      <template v-if="hasBadge">{{ (item.badge ?? 0) > 9 ? '9+' : item.badge }}</template>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
const route = useRoute()

const props = defineProps<{
  item: {
    label: string
    to: string
    icon: string
    exact?: boolean
    badge?: number | null
    badgeVariant?: 'danger' | 'warning' | 'success' | 'default'
    dot?: boolean
    dotVariant?: 'brand' | 'danger' | 'warning' | 'success'
  }
  collapsed?: boolean
}>()

const isActive = computed(() => {
  if (props.item.exact) return route.path === props.item.to
  return route.path === props.item.to || route.path.startsWith(props.item.to + '/')
})

const hasBadge = computed(() =>
  props.item.badge !== undefined && props.item.badge !== null && props.item.badge > 0,
)
const showCollapsedIndicator = computed(() => hasBadge.value || !!props.item.dot)

const badgeClasses = computed(() => {
  const variant = props.item.badgeVariant ?? 'default'
  if (isActive.value) {
    switch (variant) {
      case 'danger':  return 'bg-red-600 text-white'
      case 'warning': return 'bg-amber-600 text-white'
      default:        return 'bg-[#0b0d12]/20 text-[#0b0d12]'
    }
  }
  switch (variant) {
    case 'danger':  return 'bg-red-500/20 text-red-400'
    case 'warning': return 'bg-amber-500/20 text-amber-400'
    case 'success': return 'bg-emerald-500/20 text-emerald-400'
    default:        return 'bg-white/[0.10] text-white/60'
  }
})
const collapsedIndicatorClasses = computed(() => {
  const variant = props.item.badgeVariant ?? props.item.dotVariant ?? 'default'
  switch (variant) {
    case 'danger':  return 'bg-red-500 text-white'
    case 'warning': return 'bg-amber-500 text-white'
    case 'success': return 'bg-emerald-500 text-white'
    default:        return 'bg-[#ccff00] text-[#0b0d12]'
  }
})
const dotColor = computed(() => {
  switch (props.item.dotVariant) {
    case 'danger':  return 'bg-red-500'
    case 'warning': return 'bg-amber-400'
    case 'success': return 'bg-emerald-500'
    default:        return 'bg-[#ccff00]'
  }
})
</script>
