<template>
  <button
    class="text-left w-full bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-4 hover:border-slate-300 dark:hover:border-white/[0.20] hover:shadow-sm transition-all"
    @click="$emit('click')"
  >
    <div class="flex items-start gap-3">
      <UiAvatar
        :src="atleta.foto_url"
        :nome="atleta.nome"
        :numero="atleta.numero_camisa"
        size="lg"
      />
      <div class="flex-1 min-w-0">
        <p class="font-bold text-sm text-slate-900 dark:text-white truncate">{{ atleta.nome }}</p>
        <p class="text-xs text-slate-500 truncate">{{ atleta.posicao ?? 'Sem posição' }}</p>
      </div>
      <UiStatusBadge v-if="!atleta.ativo" variant="inativo" />
    </div>

    <div class="mt-3 flex items-center gap-2 flex-wrap">
      <UiStatusBadge :variant="atleta.status" />
      <UiStatusBadge :variant="atleta.saude" dot />
    </div>

    <p v-if="atleta.telefone_responsavel" class="text-xs text-slate-400 mt-2 truncate inline-flex items-center gap-1">
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
      </svg>
      {{ atleta.telefone_responsavel }}
    </p>
  </button>
</template>

<script setup lang="ts">
import type { Atleta } from '~/types'

defineProps<{ atleta: Atleta }>()
defineEmits<{ (e: 'click'): void }>()
</script>
