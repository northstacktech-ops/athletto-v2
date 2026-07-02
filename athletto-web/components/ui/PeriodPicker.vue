<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      class="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-elevated-dark text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors"
      @click="open = !open"
    >
      <svg class="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      {{ currentOption?.label }}
      <svg class="w-3 h-3 text-gray-400 transition-transform" :class="open && 'rotate-180'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 mt-1.5 w-44 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-elevated-dark py-1 z-30"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <svg v-if="modelValue === opt.value" class="w-3.5 h-3.5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const options = [
  { value: '30d', label: 'Últimos 30 dias', months: 1 },
  { value: '90d', label: 'Últimos 90 dias', months: 3 },
  { value: '6m',  label: '6 meses',          months: 6 },
  { value: '12m', label: '12 meses',         months: 12 },
]

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const currentOption = computed(() => options.find(o => o.value === props.modelValue) ?? options[2])

function select(v: string) {
  emit('update:modelValue', v)
  open.value = false
}

function onOutside(e: MouseEvent) {
  if (!rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onOutside))
onBeforeUnmount(() => document.removeEventListener('click', onOutside))

defineExpose({ options })
</script>
