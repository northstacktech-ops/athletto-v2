<template>
  <div class="space-y-4 animate-fade-in">

    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Notificações</h1>
        <p class="page-description">
          {{ unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia' }}
        </p>
      </div>
      <button
        v-if="unreadCount > 0"
        class="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
        @click="markAllRead"
      >
        Marcar todas como lidas
      </button>
    </div>

    <div class="card-base shadow-card overflow-hidden">
      <div v-if="items.length === 0" class="py-16 flex flex-col items-center text-center px-6">
        <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <p class="text-sm text-slate-500">Sem notificações por aqui ainda.</p>
      </div>

      <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
        <li v-for="n in items" :key="n.id">
          <component
            :is="n.to ? 'NuxtLink' : 'button'"
            :to="n.to"
            type="button"
            class="w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            :class="!n.read ? 'bg-brand-50/40 dark:bg-brand-600/5' : ''"
            @click="onClickItem(n)"
          >
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="notifIconBg(n.type)">
              <svg class="w-4.5 h-4.5" :class="notifIconColor(n.type)" fill="currentColor" viewBox="0 0 24 24">
                <path v-if="n.type === 'danger'"  fill-rule="evenodd" clip-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.74c1.154 2-.29 4.5-2.598 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                <path v-else-if="n.type === 'warning'" fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"/>
                <path v-else-if="n.type === 'success'" fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"/>
                <path v-else fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ n.title }}</p>
              <p v-if="n.description" class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ n.description }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">{{ formatNotifTime(n.created_at) }}</p>
            </div>
            <span v-if="!n.read" class="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
          </component>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/composables/useNotifications'

definePageMeta({ layout: 'default' })
useHead({ title: 'Notificações — Athletto' })

const { items, unreadCount, markAllRead, markRead, carregar } = useNotifications()
onMounted(carregar)

function onClickItem(n: Notification) {
  markRead(n.id)
}
</script>
