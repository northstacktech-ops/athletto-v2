<template>
  <!-- Wrapper externo: posicionamento relativo para o badge (sem overflow-hidden) -->
  <div class="relative shrink-0 inline-flex" :class="sizeClasses">

    <!-- Círculo interno: overflow-hidden só aqui, para recortar foto/iniciais -->
    <div
      class="rounded-full w-full h-full flex items-center justify-center font-bold overflow-hidden"
      :style="!src ? `background-color: ${bgColor};` : undefined"
    >
      <NuxtImg
        v-if="src"
        :src="src"
        :alt="nome"
        :width="pxSize"
        :height="pxSize"
        format="webp"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <span v-else class="text-white select-none" :class="textSizeClass">{{ iniciais }}</span>
    </div>

    <!-- Badge do número: fora do overflow-hidden, nunca cortado -->
    <span
      v-if="numero"
      class="absolute -bottom-0.5 -right-0.5 z-10 rounded-full bg-white dark:bg-surface-elevated-dark border-2 border-white dark:border-surface-elevated-dark text-slate-900 dark:text-white font-bold flex items-center justify-center leading-none"
      :class="badgeSizeClass"
    >
      {{ numero }}
    </span>

  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const props = withDefaults(defineProps<{
  src?: string | null
  nome: string
  size?: Size
  numero?: string | number | null
}>(), {
  size: 'md',
})

const PALETTE = [
  '#11358b', // ink
  '#334155', // slate-700
  '#1d4ed8', // brand-700
  '#047857', // emerald-700
  '#b45309', // amber-700
  '#9f1239', // rose-700
]

function hash(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

const iniciais = computed(() => getIniciais(props.nome))
const bgColor = computed(() => PALETTE[hash(props.nome) % PALETTE.length])
const bgClass = '' // bg via inline style

const sizeClasses = computed(() => ({
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
}[props.size]))

// Tamanho pedido ao otimizador de imagem (2x o CSS, para telas retina).
const pxSize = computed(() => ({
  xs: 48, sm: 64, md: 80, lg: 96, xl: 128, '2xl': 160,
}[props.size]))

const textSizeClass = computed(() => ({
  xs: 'text-[9px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-2xl',
}[props.size]))

const badgeSizeClass = computed(() => {
  const twoDigits = String(props.numero ?? '').length > 1
  return ({
    xs:  twoDigits ? 'w-4 h-4 text-[6px]'  : 'w-3 h-3 text-[7px]',
    sm:  twoDigits ? 'w-5 h-5 text-[8px]'  : 'w-4 h-4 text-[9px]',
    md:  twoDigits ? 'w-6 h-6 text-[9px]'  : 'w-5 h-5 text-xs',
    lg:  twoDigits ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-xs',
    xl:  twoDigits ? 'w-7 h-7 text-xs'     : 'w-6 h-6 text-xs',
    '2xl': twoDigits ? 'w-8 h-8 text-sm'   : 'w-7 h-7 text-sm',
  }[props.size])
})
</script>
