<template>
  <div class="relative">
    <!-- Tooltip -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="tooltip"
        class="absolute z-10 pointer-events-none px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium shadow-lg"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translate(-50%, -100%) translateY(-8px)' }"
      >
        <p class="font-semibold mb-0.5">{{ tooltip.label }}</p>
        <div v-for="s in tooltip.series" :key="s.name" class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: s.color }" />
          <span class="opacity-70">{{ s.name }}:</span>
          <span class="font-bold">{{ s.formatted }}</span>
        </div>
      </div>
    </Transition>

    <svg
      ref="svgRef"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="none"
      class="block w-full"
      :style="{ height: height + 'px' }"
      @mousemove="onMouseMove"
      @mouseleave="tooltip = null"
    >
      <defs>
        <linearGradient v-for="(s, idx) in series" :key="idx" :id="`gradArea-${gid}-${idx}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="s.color" stop-opacity="0.25" />
          <stop offset="100%" :stop-color="s.color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Y gridlines -->
      <line
        v-for="(y, idx) in yLines" :key="`gl-${idx}`"
        :x1="PAD_L" :x2="W - PAD_R"
        :y1="y" :y2="y"
        stroke="currentColor"
        stroke-width="0.5"
        stroke-dasharray="2 3"
        class="text-gray-200 dark:text-white/[0.06]"
      />

      <!-- Y labels -->
      <text
        v-for="(y, idx) in yLines" :key="`yl-${idx}`"
        :x="PAD_L - 6"
        :y="y + 3"
        text-anchor="end"
        class="text-[8px] fill-gray-300 dark:fill-gray-600"
        font-family="inherit"
      >{{ yLabels[idx] }}</text>

      <!-- Series -->
      <g v-for="(s, idx) in series" :key="`s-${idx}`">
        <path :d="areaPaths[idx]" :fill="`url(#gradArea-${gid}-${idx})`" />
        <path :d="linePaths[idx]" fill="none" :stroke="s.color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Active line + dots -->
      <g v-if="activeIdx !== null">
        <line
          :x1="xCoords[activeIdx]"
          :x2="xCoords[activeIdx]"
          :y1="PAD_T"
          :y2="H - PAD_B"
          stroke="currentColor"
          stroke-width="0.5"
          class="text-gray-300 dark:text-white/15"
        />
        <circle
          v-for="(s, idx) in series" :key="`d-${idx}`"
          :cx="xCoords[activeIdx]"
          :cy="yCoords[idx][activeIdx]"
          r="2.5"
          fill="white"
          :stroke="s.color"
          stroke-width="1.5"
        />
      </g>

      <!-- X labels -->
      <text
        v-for="(label, i) in labels" :key="`xl-${i}`"
        :x="xCoords[i]"
        :y="H - 1"
        text-anchor="middle"
        class="text-[8px] fill-gray-400 dark:fill-gray-500"
        font-family="inherit"
      >{{ label }}</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

type Series = { name: string; data: number[]; color: string }

const props = withDefaults(defineProps<{
  labels: string[]
  series: Series[]
  height?: number
  format?: 'currency' | 'number'
}>(), {
  height: 220,
  format: 'currency',
})

// ── SVG dimensions ────────────────────────────────────────────
const W = 400
const H = 200
const PAD_L = 30
const PAD_R = 8
const PAD_T = 8
const PAD_B = 16

const gid = Math.random().toString(36).slice(2, 9)

// ── Compute scales ────────────────────────────────────────────
const maxValue = computed(() => {
  const all = props.series.flatMap(s => s.data)
  return Math.max(...all, 1)
})

function fmtShort(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}k`
  return String(Math.round(v))
}

function fmtFull(v: number) {
  return props.format === 'currency' ? formatCurrency(v) : v.toLocaleString('pt-BR')
}

const yLines = computed(() => {
  const top = PAD_T
  const bot = H - PAD_B
  return [top, top + (bot - top) * 0.33, top + (bot - top) * 0.66, bot]
})

const yLabels = computed(() => [
  fmtShort(maxValue.value),
  fmtShort(maxValue.value * 0.66),
  fmtShort(maxValue.value * 0.33),
  '0',
])

const xCoords = computed(() => {
  const n = props.labels.length
  if (n === 0) return []
  if (n === 1) return [W / 2]
  const usable = W - PAD_L - PAD_R
  return props.labels.map((_, i) => PAD_L + (i / (n - 1)) * usable)
})

const yCoords = computed(() =>
  props.series.map(s =>
    s.data.map(v => {
      const usable = H - PAD_T - PAD_B
      return PAD_T + (1 - v / maxValue.value) * usable
    }),
  ),
)

const linePaths = computed(() =>
  props.series.map((_, sIdx) => {
    const ys = yCoords.value[sIdx]
    return ys
      .map((y, i) => `${i === 0 ? 'M' : 'L'}${xCoords.value[i].toFixed(2)} ${y.toFixed(2)}`)
      .join(' ')
  }),
)

const areaPaths = computed(() =>
  props.series.map((_, sIdx) => {
    const ys = yCoords.value[sIdx]
    if (!ys.length) return ''
    const line = ys
      .map((y, i) => `${i === 0 ? 'M' : 'L'}${xCoords.value[i].toFixed(2)} ${y.toFixed(2)}`)
      .join(' ')
    const endX = xCoords.value[ys.length - 1]
    const startX = xCoords.value[0]
    return `${line} L${endX.toFixed(2)} ${H - PAD_B} L${startX.toFixed(2)} ${H - PAD_B} Z`
  }),
)

// ── Tooltip ───────────────────────────────────────────────────
const svgRef = ref<SVGElement | null>(null)
const activeIdx = ref<number | null>(null)
const tooltip = ref<{
  x: number
  y: number
  label: string
  series: { name: string; color: string; formatted: string }[]
} | null>(null)

function onMouseMove(e: MouseEvent) {
  if (!svgRef.value || !props.labels.length) return
  const rect = svgRef.value.getBoundingClientRect()
  const relX = ((e.clientX - rect.left) / rect.width) * W
  const n = props.labels.length
  const usable = W - PAD_L - PAD_R
  const norm = Math.max(0, Math.min(1, (relX - PAD_L) / usable))
  const idx = Math.round(norm * (n - 1))
  activeIdx.value = idx

  // Tooltip pos: map xCoords back to pixel space
  const pxX = (xCoords.value[idx] / W) * rect.width
  const pxY = ((Math.min(...yCoords.value.map(ys => ys[idx]))) / H) * rect.height

  tooltip.value = {
    x: pxX,
    y: pxY,
    label: props.labels[idx],
    series: props.series.map(s => ({
      name: s.name,
      color: s.color,
      formatted: fmtFull(s.data[idx] ?? 0),
    })),
  }
}
</script>
