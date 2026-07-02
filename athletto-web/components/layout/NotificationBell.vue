<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      class="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
      :class="variant === 'dark'
        ? 'text-white/80 hover:text-white hover:bg-white/10'
        : 'text-slate-500 hover:text-ink hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10'"
      :title="`${unreadCount} notificações`"
      @click="open = !open"
    >
      <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2"
        :class="variant === 'dark' ? 'ring-brand-700' : 'ring-white dark:ring-surface-canvas-dark'"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-elevated-dark overflow-hidden z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Notificações</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ unreadCount }} não lidas</p>
          </div>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            @click="markAllRead"
          >
            Marcar todas como lidas
          </button>
        </div>

        <!-- List -->
        <div class="max-h-[400px] overflow-y-auto scrollbar-slim">
          <div v-if="items.length === 0" class="py-12 flex flex-col items-center text-center px-6">
            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-2">
              <svg class="w-5 h-5 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Sem notificações</p>
          </div>

          <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.04]">
            <li v-for="n in items" :key="n.id">
              <component
                :is="n.to ? 'NuxtLink' : 'button'"
                :to="n.to"
                type="button"
                class="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                :class="!n.read ? 'bg-brand-50/40 dark:bg-brand-600/5' : ''"
                @click="onClickItem(n)"
              >
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :class="iconBg(n.type)"
                >
                  <svg class="w-4 h-4" :class="iconColor(n.type)" fill="currentColor" viewBox="0 0 24 24">
                    <path v-if="n.type === 'danger'"  fill-rule="evenodd" clip-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.74c1.154 2-.29 4.5-2.598 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                    <path v-else-if="n.type === 'warning'" fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"/>
                    <path v-else-if="n.type === 'success'" fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"/>
                    <path v-else fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ n.title }}</p>
                  <p v-if="n.description" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ n.description }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatTime(n.created_at) }}</p>
                </div>
                <span v-if="!n.read" class="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
              </component>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/composables/useNotifications'

const { variant = 'light' } = defineProps<{ variant?: 'light' | 'dark' }>()

const { items, unreadCount, markAllRead, markRead } = useNotifications()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function iconBg(type: Notification['type']) {
  switch (type) {
    case 'danger':  return 'bg-red-50 dark:bg-red-500/10'
    case 'warning': return 'bg-amber-50 dark:bg-amber-500/10'
    case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10'
    default:        return 'bg-brand-50 dark:bg-brand-500/10'
  }
}

function iconColor(type: Notification['type']) {
  switch (type) {
    case 'danger':  return 'text-red-500'
    case 'warning': return 'text-amber-500'
    case 'success': return 'text-emerald-500'
    default:        return 'text-brand-500'
  }
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}m atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

function onClickItem(n: Notification) {
  markRead(n.id)
  open.value = false
}

function onOutside(e: MouseEvent) {
  if (!rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onOutside))
onBeforeUnmount(() => document.removeEventListener('click', onOutside))
</script>
