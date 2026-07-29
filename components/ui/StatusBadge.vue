<template>
  <span
    class="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-semibold"
    :class="info.classes"
  >
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full"
      :class="info.dotClass"
    />
    {{ info.label }}
  </span>
</template>

<script setup lang="ts">
type Variant =
  | 'success' | 'error' | 'warning' | 'info' | 'neutral'
  | 'titular' | 'novato' | 'selecionado' | 'afastado'
  | 'saudavel' | 'lesionado' | 'em_recuperacao'
  | 'ativo' | 'inativo' | 'encerrado'
  | 'pendente' | 'pago' | 'isento' | 'cancelado'
  | 'paid' | 'unpaid' | 'overdue'

const props = defineProps<{
  variant: Variant
  dot?: boolean
}>()

const MAP: Record<Variant, { classes: string; dotClass: string; label: string }> = {
  success:       { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dotClass: 'bg-emerald-500',  label: 'Ativo' },
  error:         { classes: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',                 dotClass: 'bg-red-500',      label: 'Erro' },
  warning:       { classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',         dotClass: 'bg-amber-500',    label: 'Atenção' },
  info:          { classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',         dotClass: 'bg-brand-500',    label: 'Info' },
  neutral:       { classes: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70',             dotClass: 'bg-slate-400',    label: '' },
  titular:       { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dotClass: 'bg-emerald-500',  label: 'Titular' },
  novato:        { classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',         dotClass: 'bg-brand-500',    label: 'Novato' },
  selecionado:   { classes: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',     dotClass: 'bg-violet-500',   label: 'Selecionado' },
  afastado:      { classes: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70',             dotClass: 'bg-slate-400',    label: 'Afastado' },
  saudavel:      { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dotClass: 'bg-emerald-500',  label: 'Saudável' },
  lesionado:     { classes: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',                 dotClass: 'bg-red-500',      label: 'Lesionado' },
  em_recuperacao:{ classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',         dotClass: 'bg-amber-500',    label: 'Em recuperação' },
  ativo:         { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dotClass: 'bg-emerald-500',  label: 'Ativo' },
  inativo:       { classes: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70',             dotClass: 'bg-slate-400',    label: 'Inativo' },
  encerrado:     { classes: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60',             dotClass: 'bg-slate-400',    label: 'Encerrado' },
  pendente:      { classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',         dotClass: 'bg-amber-500',    label: 'Pendente' },
  pago:          { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dotClass: 'bg-emerald-500',  label: 'Pago' },
  isento:        { classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',         dotClass: 'bg-brand-500',    label: 'Isento' },
  cancelado:     { classes: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60',             dotClass: 'bg-slate-400',    label: 'Cancelado' },
  paid:          { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dotClass: 'bg-emerald-500',  label: 'Pago' },
  unpaid:        { classes: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70',             dotClass: 'bg-slate-400',    label: 'Não pago' },
  overdue:       { classes: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',                 dotClass: 'bg-red-500',      label: 'Atrasado' },
}

const info = computed(() => MAP[props.variant] ?? MAP.neutral)
</script>
