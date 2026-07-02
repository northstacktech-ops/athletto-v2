<template>
  <NuxtLink
    :to="item.to"
    :title="collapsed ? item.label : undefined"
    :data-tour="tourId"
    class="relative flex items-center text-sm font-medium transition-all duration-150 outline-none group rounded-lg"
    :class="[
      collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full',
      isActive ? 'text-white' : 'text-white/65 hover:text-white',
    ]"
    style="text-decoration: none;"
  >
    <!-- Active pill background -->
    <span
      v-if="isActive"
      class="absolute inset-0 rounded-lg bg-white/10"
    />

    <!-- Active accent bar (left) — only when expanded -->
    <span
      v-if="isActive && !collapsed"
      class="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent"
    />

    <!-- Hover background -->
    <span
      v-else-if="!isActive"
      class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.04]"
    />

    <!-- Icon -->
    <span class="relative shrink-0 w-[18px] h-[18px] flex items-center justify-center">

      <!-- Painel: grid de 4 quadrados -->
      <svg v-if="item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>

      <!-- Atletas: perfil único de pessoa -->
      <svg v-else-if="item.icon === 'athletes'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <circle cx="12" cy="7" r="4"/>
        <path d="M4 21v-1a8 8 0 0116 0v1"/>
      </svg>

      <!-- Turmas: dois usuários (grupo/equipe) -->
      <svg v-else-if="item.icon === 'groups'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>

      <!-- Frequência: pessoa com checkmark (check-in de presença) -->
      <svg v-else-if="item.icon === 'frequency'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>

      <!-- Calendário: calendário com evento destacado -->
      <svg v-else-if="item.icon === 'calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
      </svg>

      <!-- Cobranças: carteira/wallet -->
      <svg v-else-if="item.icon === 'billing'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
        <path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
        <circle cx="16.5" cy="14" r="1.5" fill="currentColor" stroke="none"/>
      </svg>

      <!-- Configurações: engrenagem -->
      <svg v-else-if="item.icon === 'settings'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>

      <!-- Suporte: círculo com ponto de interrogação -->
      <svg v-else-if="item.icon === 'support'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none"/>
      </svg>

      <!-- Convide e ganhe: presente -->
      <svg v-else-if="item.icon === 'gift'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M20 12v10H4V12"/>
        <path d="M22 7H2v5h20V7z"/>
        <path d="M12 22V7"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
      </svg>

      <!-- Financeiro (alias): cifrão -->
      <svg v-else-if="item.icon === 'financial'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>

    </span>

    <!-- Label (expanded only) -->
    <span v-if="!collapsed" class="relative truncate flex-1">{{ item.label }}</span>

    <!-- Badge pill (expanded) -->
    <span
      v-if="!collapsed && hasBadge"
      class="relative shrink-0 min-w-[20px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold leading-none"
      :class="badgeClasses"
    >
      {{ item.badge }}
    </span>

    <!-- Dot (expanded, no badge) -->
    <span
      v-else-if="!collapsed && item.dot"
      class="relative shrink-0 w-2 h-2 rounded-full"
      :class="[dotColor, item.dotVariant === 'danger' && 'animate-pulse']"
    />

    <!-- Collapsed: indicator overlay -->
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
    badge?: number | null
    badgeVariant?: 'danger' | 'warning' | 'success' | 'default'
    dot?: boolean
    dotVariant?: 'brand' | 'danger' | 'warning' | 'success'
  }
  collapsed?: boolean
}>()

const isActive = computed(() => {
  if (props.item.to === '/') return route.path === '/'
  return route.path.startsWith(props.item.to)
})

// Identificador estável para o tour guiado (data-tour="painel|atletas|...").
const tourId = computed(() => {
  const t = props.item.to
  if (t === '/') return 'painel'
  return t.replace(/^\//, '').split('/')[0]
})

const hasBadge = computed(() =>
  props.item.badge !== undefined && props.item.badge !== null && props.item.badge > 0,
)

const showCollapsedIndicator = computed(() =>
  hasBadge.value || !!props.item.dot,
)

const badgeClasses = computed(() => {
  const variant = props.item.badgeVariant ?? 'default'
  switch (variant) {
    case 'danger':  return 'bg-red-500/25 text-red-200'
    case 'warning': return 'bg-amber-500/25 text-amber-200'
    case 'success': return 'bg-emerald-500/25 text-emerald-200'
    default:        return 'bg-white/10 text-white/80'
  }
})

const collapsedIndicatorClasses = computed(() => {
  const variant = props.item.badgeVariant ?? props.item.dotVariant ?? 'default'
  switch (variant) {
    case 'danger':  return 'bg-red-500 text-white'
    case 'warning': return 'bg-amber-500 text-white'
    case 'success': return 'bg-emerald-500 text-white'
    default:        return 'bg-accent text-ink'
  }
})

const dotColor = computed(() => {
  switch (props.item.dotVariant) {
    case 'danger':  return 'bg-red-400'
    case 'warning': return 'bg-amber-400'
    case 'success': return 'bg-emerald-400'
    default:        return 'bg-accent'
  }
})
</script>
