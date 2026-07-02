<template>
  <div
    class="rounded-xl flex items-center justify-center shrink-0 select-none"
    :class="[corBg(cor), sizeClass]"
  >
    <span :class="emojiSize">{{ iconeEmoji(icone) }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  icone?: string | null
  cor?: string | null
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'md' })

const { iconeEmoji, corBg } = useTurmaVisual()

const sizeClass = computed(() => ({ sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-14 h-14' }[props.size]))
const emojiSize = computed(() => ({ sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }[props.size]))
</script>
