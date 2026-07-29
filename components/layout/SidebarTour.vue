<template>
  <UiGuidedTourOverlay :tour="tour" />
</template>

<script setup lang="ts">
import { h } from 'vue'

const TOUR_PENDING_KEY = 'athletto_sidebar_tour_pending'

// Ícones inline simples (mesmo estilo do sidebar)
const iconDashboard = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('rect', { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }),
  h('rect', { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }),
  h('rect', { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }),
  h('rect', { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }),
])
const iconAthletes = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('circle', { cx: 12, cy: 7, r: 4 }),
  h('path', { d: 'M4 21v-1a8 8 0 0116 0v1' }),
])
const iconGroups = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' }),
  h('circle', { cx: 9, cy: 7, r: 4 }),
  h('path', { d: 'M23 21v-2a4 4 0 00-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 010 7.75' }),
])
const iconFrequency = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2' }),
  h('circle', { cx: 9, cy: 7, r: 4 }),
  h('polyline', { points: '16 11 18 13 22 9' }),
])
const iconCalendar = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2 }),
  h('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
  h('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
  h('line', { x1: 3, y1: 10, x2: 21, y2: 10 }),
])
const iconBilling = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z' }),
  h('path', { d: 'M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z' }),
])
const iconSettings = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('circle', { cx: 12, cy: 12, r: 3 }),
  h('path', { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' }),
])

// Chave preservada igual ao componente original — usuários que já viram e
// dispensaram o tour não podem ser tratados como "nunca viram" de novo.
const tour = useGuidedTour('athletto_sidebar_tour_done', [
  {
    tourId: 'painel',
    title: 'Painel',
    description: 'Sua visão geral do clube. Veja métricas em tempo real: receitas, atletas ativos, turmas e a agenda do dia.',
    icon: iconDashboard,
  },
  {
    tourId: 'atletas',
    title: 'Atletas',
    description: 'Gerencie todos os cadastros do seu clube. Crie perfis completos, acompanhe vínculos com turmas e o histórico financeiro de cada um.',
    icon: iconAthletes,
  },
  {
    tourId: 'turmas',
    title: 'Turmas',
    description: 'Organize seus grupos de treino. Configure horários, vincule atletas e defina o valor da mensalidade de cada turma.',
    icon: iconGroups,
  },
  {
    tourId: 'frequencia',
    title: 'Frequência',
    description: 'Registre a presença dos atletas nos treinos. Acompanhe quem está engajado e identifique quem precisa de atenção.',
    icon: iconFrequency,
  },
  {
    tourId: 'calendario',
    title: 'Calendário',
    description: 'Visualize toda a sua agenda em formato semanal ou mensal: treinos, jogos, eventos e reuniões num só lugar.',
    icon: iconCalendar,
  },
  {
    tourId: 'financeiro',
    title: 'Cobranças',
    description: 'Centro financeiro do clube. Mensalidades são cobradas automaticamente pelas turmas; use aqui pra viagens, uniformes e outras cobranças avulsas.',
    icon: iconBilling,
  },
  {
    tourId: 'configuracoes',
    title: 'Ajustes',
    description: 'Configure seu clube: dados gerais, logo, modalidade, plano, integrações de pagamento e preferências.',
    icon: iconSettings,
  },
])

onMounted(() => {
  if (typeof window === 'undefined') return
  // Tour também pode ser disparado externamente via evento global.
  window.addEventListener('athletto:start-sidebar-tour', onExternalStart)

  // Auto-start apenas quando o onboarding sinaliza explicitamente
  // (athletto_sidebar_tour_pending), evitando disparar para usuários antigos.
  if (!tour.isDone() && localStorage.getItem(TOUR_PENDING_KEY)) {
    localStorage.removeItem(TOUR_PENDING_KEY)
    setTimeout(() => tour.start(), 600)
  }
})

function onExternalStart() {
  tour.start(true)
}

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('athletto:start-sidebar-tour', onExternalStart)
})

defineExpose({ start: tour.start })
</script>
