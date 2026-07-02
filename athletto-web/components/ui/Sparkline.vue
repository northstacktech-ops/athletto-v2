<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    class="block"
    :style="{ width: width + 'px', height: height + 'px' }"
  >
    <!-- Area fill (gradient) -->
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="strokeColor" stop-opacity="0.28" />
        <stop offset="100%" :stop-color="strokeColor" stop-opacity="0" />
      </linearGradient>
    </defs>

    <path
      v-if="areaPath"
      :d="areaPath"
      :fill="`url(#${gradId})`"
      stroke="none"
    />
    <path
      v-if="linePath"
      :d="linePath"
      fill="none"
      :stroke="strokeColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Last point dot -->
    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="1.8"
      :fill="strokeColor"
    />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: number[]
  width?: number
  height?: number
  color?: string
}>(), {
  width: 84,
  height: 28,
  color: '#2041fe',
})

// Internal viewBox (high resolution for crisp paths)
const W = 100
const H = 32
const PAD = 2

const strokeColor = computed(() => props.color)
const gradId = `sparkgrad-${Math.random().toString(36).slice(2, 9)}`

const points = computed(() => {
  if (!props.data.length) return []
  const max = Math.max(...props.data, 0.0001)
  const min = Math.min(...props.data, 0)
  const range = max - min || 1
  const n = props.data.length
  return props.data.map((v, i) => {
    const x = n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2)
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
    return { x, y }
  })
})

const linePath = computed(() => {
  if (!points.value.length) return ''
  return points.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (!points.value.length) return ''
  const start = points.value[0]
  const end = points.value[points.value.length - 1]
  const line = points.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
  return `${line} L${end.x.toFixed(2)} ${H} L${start.x.toFixed(2)} ${H} Z`
})

const lastPoint = computed(() => points.value[points.value.length - 1] ?? null)
</script>
