<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] pointer-events-none"
        aria-modal="true"
        role="dialog"
      >
        <!-- Backdrop com "buraco" no item destacado: 4 ret\u00e2ngulos ao redor.
             Quando n\u00e3o h\u00e1 highlight, fallback para overlay s\u00f3lido. -->
        <template v-if="highlightBox">
          <!-- Top -->
          <div
            class="absolute left-0 top-0 right-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{ height: `${Math.max(0, highlightBox.top - HALO_PADDING)}px` }"
            @click="skip"
          />
          <!-- Bottom -->
          <div
            class="absolute left-0 right-0 bottom-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{ top: `${highlightBox.bottom + HALO_PADDING}px` }"
            @click="skip"
          />
          <!-- Left -->
          <div
            class="absolute left-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{
              top: `${Math.max(0, highlightBox.top - HALO_PADDING)}px`,
              width: `${Math.max(0, highlightBox.left - HALO_PADDING)}px`,
              height: `${highlightBox.height + HALO_PADDING * 2}px`,
            }"
            @click="skip"
          />
          <!-- Right -->
          <div
            class="absolute right-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{
              top: `${Math.max(0, highlightBox.top - HALO_PADDING)}px`,
              left: `${highlightBox.right + HALO_PADDING}px`,
              height: `${highlightBox.height + HALO_PADDING * 2}px`,
            }"
            @click="skip"
          />
        </template>
        <div
          v-else
          class="absolute inset-0 bg-slate-950/70 transition-opacity pointer-events-auto"
          @click="skip"
        />

        <!-- Halo destacando o item do sidebar -->
        <div
          v-if="highlightBox"
          class="absolute rounded-xl ring-4 ring-accent/80 transition-all duration-300 pointer-events-none"
          :style="highlightStyle"
        />

        <!-- Tooltip card -->
        <div
          v-if="tooltipBox"
          class="absolute w-[320px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5 transition-all duration-300 pointer-events-auto"
          :style="tooltipStyle"
        >
          <!-- Header -->
          <div class="flex items-start gap-3 mb-3">
            <div class="shrink-0 w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center">
              <component :is="currentIcon" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-0.5">
                Passo {{ stepIndex + 1 }} de {{ steps.length }}
              </p>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {{ currentStep.title }}
              </h3>
            </div>
          </div>

          <!-- Descrição -->
          <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            {{ currentStep.description }}
          </p>

          <!-- Progresso -->
          <div class="flex items-center gap-1 mb-4">
            <div
              v-for="(_, i) in steps"
              :key="i"
              class="h-1 rounded-full flex-1 transition-all duration-300"
              :class="i <= stepIndex ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'"
            />
          </div>

          <!-- Ações -->
          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              class="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              @click="skip"
            >
              Pular tour
            </button>

            <div class="flex items-center gap-2">
              <button
                v-if="stepIndex > 0"
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                @click="prev"
              >
                Voltar
              </button>
              <button
                type="button"
                class="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
                @click="next"
              >
                {{ isLast ? 'Concluir' : 'Próximo' }}
                <svg v-if="!isLast" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
                <svg v-else class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { h } from 'vue'

const TOUR_KEY = 'athletto_sidebar_tour_done'
const TOUR_PENDING_KEY = 'athletto_sidebar_tour_pending'

interface TourStep {
  tourId: string
  title: string
  description: string
  icon: () => any
}

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

const steps: TourStep[] = [
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
    description: 'Centro financeiro do clube. Crie planejamentos de cobrança, acompanhe mensalidades e gere relatórios completos.',
    icon: iconBilling,
  },
  {
    tourId: 'configuracoes',
    title: 'Ajustes',
    description: 'Configure seu clube: dados gerais, logo, modalidade, plano, integrações de pagamento e preferências.',
    icon: iconSettings,
  },
]

const HALO_PADDING = 6

const visible = ref(false)
const stepIndex = ref(0)
const highlightBox = ref<DOMRect | null>(null)
const tooltipBox = ref(true)
let resizeObserver: ResizeObserver | null = null

const currentStep = computed(() => steps[stepIndex.value])
const currentIcon = computed(() => currentStep.value.icon)
const isLast = computed(() => stepIndex.value === steps.length - 1)

const highlightStyle = computed(() => {
  if (!highlightBox.value) return {}
  return {
    top: `${highlightBox.value.top - HALO_PADDING}px`,
    left: `${highlightBox.value.left - HALO_PADDING}px`,
    width: `${highlightBox.value.width + HALO_PADDING * 2}px`,
    height: `${highlightBox.value.height + HALO_PADDING * 2}px`,
  }
})

const tooltipStyle = computed(() => {
  if (!highlightBox.value) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }
  // Posiciona à direita do item do sidebar.
  const TOOLTIP_WIDTH = 320
  const MARGIN = 24
  const left = highlightBox.value.right + MARGIN
  const maxLeft = window.innerWidth - TOOLTIP_WIDTH - 16

  return {
    top: `${Math.max(16, highlightBox.value.top - 8)}px`,
    left: `${Math.min(left, maxLeft)}px`,
  }
})

function updateHighlight() {
  const id = currentStep.value.tourId
  const el = document.querySelector<HTMLElement>(`[data-tour="${id}"]`)
  if (!el) {
    highlightBox.value = null
    return
  }
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  highlightBox.value = el.getBoundingClientRect()
}

function start() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(TOUR_KEY)) return
  // Consome o flag de pendência ao iniciar.
  localStorage.removeItem(TOUR_PENDING_KEY)
  stepIndex.value = 0
  visible.value = true
  nextTick(() => {
    updateHighlight()
  })
}

function next() {
  if (isLast.value) {
    finish()
    return
  }
  stepIndex.value++
  nextTick(updateHighlight)
}

function prev() {
  if (stepIndex.value === 0) return
  stepIndex.value--
  nextTick(updateHighlight)
}

function skip() {
  finish()
}

function finish() {
  visible.value = false
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOUR_KEY, '1')
  }
}

function onResize() {
  if (!visible.value) return
  updateHighlight()
}

onMounted(() => {
  if (typeof window === 'undefined') return
  // Tour é disparado externamente via evento global; aqui só registramos listener.
  window.addEventListener('athletto:start-sidebar-tour', start as EventListener)
  window.addEventListener('resize', onResize)
  resizeObserver = new ResizeObserver(() => updateHighlight())
  resizeObserver.observe(document.body)

  // Auto-start apenas quando o onboarding sinaliza explicitamente
  // (athletto_sidebar_tour_pending), evitando disparar para usuários antigos.
  if (!localStorage.getItem(TOUR_KEY) && localStorage.getItem(TOUR_PENDING_KEY)) {
    setTimeout(start, 600)
  }
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('athletto:start-sidebar-tour', start as EventListener)
  window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
})

defineExpose({ start })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
