<template>
  <NuxtLink
    :to="`/turmas/${turma.id}`"
    class="block bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-4 flex flex-col gap-3 hover:border-slate-300 hover:shadow-card dark:hover:border-white/[0.20] transition-all"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-start gap-3 min-w-0 flex-1">
        <TurmasTurmaIcone :icone="turma.icone" :cor="turma.cor" size="md"/>
        <div class="min-w-0">
          <h3 class="font-bold text-base text-slate-900 dark:text-white truncate">{{ turma.nome }}</h3>
          <p v-if="turma.descricao" class="text-xs text-slate-500 line-clamp-2 mt-0.5">{{ turma.descricao }}</p>
        </div>
      </div>
      <span v-if="!turma.ativo" class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-600 dark:bg-white/[0.08] dark:text-slate-400">Inativa</span>
    </div>

    <div class="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
      <span class="inline-flex items-center gap-1">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
        {{ formatDiasSemana(turma.dias_semana) }}
      </span>
      <span class="inline-flex items-center gap-1">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {{ formatHorario(turma.horario_inicio, turma.horario_fim) }}
      </span>
      <span v-if="turma.local" class="inline-flex items-center gap-1">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {{ turma.local }}
      </span>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
      <div class="flex items-center gap-1.5 min-w-0">
        <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
          {{ turma.total_atletas ?? 0 }} {{ (turma.total_atletas ?? 0) === 1 ? 'atleta' : 'atletas' }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">R$ {{ (turma.valor_mensalidade_padrao ?? 0).toFixed(0) }}/mês</span>
        <button
          class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
          @click.prevent.stop="$emit('vincular')"
        >
          Vincular
        </button>
        <button
          class="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click.prevent.stop="$emit('editar')"
        >
          Editar
        </button>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { formatDiasSemana, formatHorario } from '~/utils/format'
import type { Turma } from '~/types'

defineProps<{ turma: Turma & { total_atletas?: number } }>()
defineEmits<{ (e: 'editar'): void; (e: 'vincular'): void }>()
</script>
