<template>
  <div class="relative select-none">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${W} ${H}`"
      class="block w-full"
      :style="{ height: height + 'px' }"
      @mousemove="onMouseMove"
      @mouseleave="activeMonth = null"
    >
      <!-- Y gridlines -->
      <line
        v-for="(y, i) in yLines" :key="`gl-${i}`"
        :x1="PAD_L" :x2="W - PAD_R"
        :y1="y" :y2="y"
        stroke="#e5e7eb"
        stroke-width="0.6"
        stroke-dasharray="3 3"
      />

      <!-- Bars -->
      <g v-for="(item, i) in data" :key="i">
        <!-- receita bar -->
        <rect
          :x="barX(i, 0)"
          :y="barY(item.receita)"
          :width="BAR_W"
          :height="barH(item.receita)"
          :fill="activeMonth === i ? '#4A7BF5' : '#6192FC'"
          rx="3"
          style="transition: fill 0.1s;"
        />
        <!-- receita label -->
        <text
          v-if="barH(item.receita) > 8"
          :x="barX(i, 0) + BAR_W / 2"
          :y="barY(item.receita) - 3"
          text-anchor="middle"
          font-family="Inter, sans-serif"
          font-size="7"
          fill="#4A7BF5"
          font-weight="600"
        >{{ fmtShort(item.receita) }}</text>

        <!-- despesa bar -->
        <rect
          :x="barX(i, 1)"
          :y="barY(item.despesa)"
          :width="BAR_W"
          :height="barH(item.despesa)"
          :fill="activeMonth === i ? '#EF4444' : '#F87171'"
          rx="3"
          style="transition: fill 0.1s;"
        />
        <!-- despesa label -->
        <text
          v-if="barH(item.despesa) > 8"
          :x="barX(i, 1) + BAR_W / 2"
          :y="barY(item.despesa) - 3"
          text-anchor="middle"
          font-family="Inter, sans-serif"
          font-size="7"
          fill="#EF4444"
          font-weight="600"
        >{{ fmtShort(item.despesa) }}</text>

        <!-- month label -->
        <text
          :x="groupCenter(i)"
          :y="H - 2"
          text-anchor="middle"
          font-family="Inter, sans-serif"
          font-size="8"
          :fill="activeMonth === i ? '#374151' : '#9ca3af'"
        >{{ item.mes }}</text>
      </g>

      <!-- Hover highlight -->
      <rect
        v-if="activeMonth !== null"
        :x="groupX(activeMonth) - 2"
        :y="PAD_T"
        :width="GROUP_W + 4"
        :height="H - PAD_T - PAD_B - 2"
        fill="rgba(0,0,0,0.03)"
        rx="4"
        style="pointer-events: none;"
      />
    </svg>

    <!-- Tooltip -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="activeMonth !== null"
        class="absolute z-10 pointer-events-none px-3 py-2 rounded-xl text-xs font-medium shadow-xl border border-gray-100"
        style="background: white; transform: translate(-50%, -100%) translateY(-10px);"
        :style="{ left: tooltipX + 'px', top: tooltipY + 'px', transform: 'translate(-50%, -100%) translateY(-10px)' }"
      >
        <p class="font-bold text-gray-900 mb-1.5">{{ data[activeMonth].mes }}</p>
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="w-2 h-2 rounded-full bg-ink-light shrink-0" />
          <span class="text-gray-500">Receita:</span>
          <span class="font-semibold text-gray-900">{{ fmtFull(data[activeMonth].receita) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <span class="text-gray-500">Despesa:</span>
          <span class="font-semibold text-gray-900">{{ fmtFull(data[activeMonth].despesa) }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = withDefaults(defineProps<{
  data: { mes: string; receita: number; despesa: number }[]
  height?: number
}>(), {
  height: 200,
})

// ── SVG layout ────────────────────────────────────────────────
const W = 500
const H = 180
const PAD_L = 4
const PAD_R = 4
const PAD_T = 20   // room for value labels
const PAD_B = 18   // room for month labels

// bar sizing
const n = computed(() => props.data.length || 1)
const INNER_W = computed(() => W - PAD_L - PAD_R)
const GROUP_W = computed(() => INNER_W.value / n.value)
const BAR_GAP = 2
const BAR_W = computed(() => (GROUP_W.value - BAR_GAP * 3) / 2)

function groupX(i: number) {
  return PAD_L + i * GROUP_W.value + BAR_GAP
}
function groupCenter(i: number) {
  return groupX(i) + GROUP_W.value / 2 - BAR_GAP / 2
}
function barX(i: number, series: 0 | 1) {
  return groupX(i) + series * (BAR_W.value + BAR_GAP)
}

// ── Scale ─────────────────────────────────────────────────────
const maxVal = computed(() => {
  const all = props.data.flatMap(d => [d.receita, d.despesa])
  return Math.max(...all, 1)
})

const chartH = computed(() => H - PAD_T - PAD_B)

function barH(v: number) {
  return Math.max(2, (v / maxVal.value) * chartH.value)
}
function barY(v: number) {
  return PAD_T + chartH.value - barH(v)
}

// Y gridlines (3 lines)
const yLines = computed(() => {
  const top = PAD_T
  const bot = PAD_T + chartH.value
  return [top, top + chartH.value * 0.5, bot]
})

// ── Formatting ────────────────────────────────────────────────
function fmtShort(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000)    return `${(v / 1000).toFixed(1)}k`
  return String(Math.round(v))
}

function fmtFull(v: number) {
  return formatCurrency(v)
}

// ── Hover / Tooltip ───────────────────────────────────────────
const svgRef = ref<SVGElement | null>(null)
const activeMonth = ref<number | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

function onMouseMove(e: MouseEvent) {
  if (!svgRef.value || !props.data.length) return
  const rect = svgRef.value.getBoundingClientRect()
  const relX = ((e.clientX - rect.left) / rect.width) * W
  const i = Math.floor((relX - PAD_L) / GROUP_W.value)
  if (i >= 0 && i < props.data.length) {
    activeMonth.value = i
    tooltipX.value = (groupCenter(i) / W) * rect.width
    tooltipY.value = ((PAD_T + chartH.value * 0.3) / H) * rect.height
  } else {
    activeMonth.value = null
  }
}
</script>
