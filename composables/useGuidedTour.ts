/**
 * Engine genérico de tour guiado (spotlight + tooltip), extraído de
 * SidebarTour.vue pra ser reaproveitado em qualquer tela. Cada instância
 * tem sua própria chave de conclusão salva em localStorage (passada
 * explicitamente pelo chamador, ex. 'athletto_tour_atletas_done') — quem
 * decide QUANDO chamar `start()` (auto na primeira visita, botão manual,
 * evento global etc.) é o consumidor, não este composable.
 *
 * O alvo de cada passo é resolvido por `document.querySelector('[data-tour="id"]')`
 * — qualquer elemento na página vira um alvo só adicionando esse atributo.
 */

export interface TourStep {
  tourId: string
  title: string
  description: string
  /** Ícone opcional (render function, ex.: () => h('svg', ...)). Sem ícone, mostra um ponto simples. */
  icon?: () => any
}

const HALO_PADDING = 6
const TOOLTIP_WIDTH = 320
const TOOLTIP_MARGIN = 24

export function useGuidedTour(doneKey: string, steps: TourStep[]) {

  const visible = ref(false)
  const stepIndex = ref(0)
  const highlightBox = ref<DOMRect | null>(null)
  let resizeObserver: ResizeObserver | null = null

  const currentStep = computed(() => steps[stepIndex.value])
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
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    const left = highlightBox.value.right + TOOLTIP_MARGIN
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - 16
    return {
      top: `${Math.max(16, highlightBox.value.top - 8)}px`,
      left: `${Math.min(left, maxLeft)}px`,
    }
  })

  function updateHighlight() {
    const step = currentStep.value
    if (!step) { highlightBox.value = null; return }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.tourId}"]`)
    if (!el) { highlightBox.value = null; return }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    highlightBox.value = el.getBoundingClientRect()
  }

  function isDone() {
    return typeof window !== 'undefined' && !!localStorage.getItem(doneKey)
  }

  /** `force`: ignora o flag de "já visto" (usado pelo botão de ajuda pra rever). */
  function start(force = false) {
    if (typeof window === 'undefined' || steps.length === 0) return
    if (!force && isDone()) return
    stepIndex.value = 0
    visible.value = true
    nextTick(updateHighlight)
  }

  function next() {
    if (isLast.value) { finish(); return }
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
    if (typeof window !== 'undefined') localStorage.setItem(doneKey, '1')
  }

  function onResize() {
    if (visible.value) updateHighlight()
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('resize', onResize)
    resizeObserver = new ResizeObserver(() => updateHighlight())
    resizeObserver.observe(document.body)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', onResize)
    resizeObserver?.disconnect()
  })

  return {
    steps,
    visible,
    stepIndex,
    currentStep,
    isLast,
    highlightBox,
    highlightStyle,
    tooltipStyle,
    isDone,
    start,
    next,
    prev,
    skip,
    finish,
  }
}
