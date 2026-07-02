<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div
      v-for="p in PLANOS_LISTA"
      :key="p.id"
      class="relative rounded-2xl border p-5 flex flex-col transition-all"
      :class="[
        modelValue === p.id
          ? 'border-brand-600 ring-2 ring-brand-500/30 bg-brand-50/40 dark:bg-brand-500/10'
          : p.destaque
            ? 'border-brand-300 dark:border-brand-500/40'
            : 'border-slate-200 dark:border-white/[0.10]',
        selecionavel ? 'cursor-pointer hover:border-brand-400' : '',
      ]"
      @click="selecionavel && $emit('update:modelValue', p.id)"
    >
      <!-- Selo -->
      <span
        v-if="p.tag"
        class="absolute -top-2.5 left-5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-brand-600 text-white"
      >{{ p.tag }}</span>

      <!-- Atual -->
      <span
        v-if="planoAtual === p.id"
        class="absolute -top-2.5 right-5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-slate-900 text-white dark:bg-white dark:text-slate-900"
      >Atual</span>

      <p class="text-lg font-bold text-slate-900 dark:text-white">{{ p.nome }}</p>
      <p class="mt-1">
        <span class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ formatCurrency(p.preco) }}</span>
        <span class="text-sm text-slate-500">/mês</span>
      </p>

      <ul class="mt-4 space-y-2 text-sm flex-1">
        <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg class="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ rotuloAtletas(p.limites.atletas) }}
        </li>
        <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg class="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ rotuloTurmas(p.limites.turmas) }}
        </li>
        <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg class="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ rotuloGestores(p.limites.gestores) }}
        </li>
        <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg class="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          App do atleta (consulta + pagamento Pix)
        </li>
      </ul>

      <!-- Radio (modo seleção) -->
      <div v-if="selecionavel" class="mt-4 flex items-center gap-2 text-sm font-semibold"
           :class="modelValue === p.id ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400'">
        <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
              :class="modelValue === p.id ? 'border-brand-600' : 'border-slate-300'">
          <span v-if="modelValue === p.id" class="w-2 h-2 rounded-full bg-brand-600" />
        </span>
        {{ modelValue === p.id ? 'Selecionado' : 'Selecionar' }}
      </div>

      <!-- Botão Assinar (modo assinatura — Pix direto, sem modal de seleção) -->
      <button
        v-if="assinavel"
        type="button"
        :disabled="planoAtual === p.id || gerando !== null"
        class="mt-4 w-full py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="planoAtual === p.id
          ? 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60'
          : 'text-white bg-brand-600 hover:bg-brand-700'"
        @click.stop="$emit('assinar', p.id)"
      >
        {{ rotuloBotao(p) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLANOS_LISTA, type Clube } from '~/types'
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  /** Plano selecionado (modo seleção, v-model). */
  modelValue?: Clube['plano'] | null
  /** Marca o plano atual do clube com o selo "Atual". */
  planoAtual?: Clube['plano'] | null
  /** Permite clicar pra selecionar (cadastro). */
  selecionavel?: boolean
  /** Mostra um botão de ação em cada plano (assina/upgrade direto, sem modal). */
  assinavel?: boolean
  /** Plano cujo Pix está sendo gerado (mostra "Gerando Pix…" no botão). */
  gerando?: Clube['plano'] | null
  /** Clube já tem plano pago ativo → o botão vira "Fazer upgrade"/"Mudar plano". */
  jaAssinante?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: Clube['plano']): void
  (e: 'assinar', v: Clube['plano']): void
}>()

// Rótulo do botão por plano. Sem assinatura ativa → "Assinar"; já assinante →
// "Fazer upgrade" (plano superior) ou "Mudar plano" (inferior); atual → "Plano atual".
const ORDEM = PLANOS_LISTA.map((p) => p.id)
function rotuloBotao(p: typeof PLANOS_LISTA[number]) {
  if (props.planoAtual === p.id) return 'Plano atual'
  if (props.gerando === p.id) return 'Gerando Pix…'
  if (!props.jaAssinante) return `Assinar ${p.nome}`
  const atualIdx = props.planoAtual ? ORDEM.indexOf(props.planoAtual) : -1
  return ORDEM.indexOf(p.id) > atualIdx ? 'Fazer upgrade' : 'Mudar plano'
}

const rotuloAtletas = (n: number | null) => (n === null ? 'Atletas ilimitados' : `Até ${n} atletas`)
const rotuloTurmas = (n: number | null) => (n === null ? 'Turmas ilimitadas' : `Até ${n} turmas`)
const rotuloGestores = (n: number | null) =>
  n === null ? 'Gestores ilimitados' : `${n} ${n === 1 ? 'gestor' : 'gestores'}`
</script>
