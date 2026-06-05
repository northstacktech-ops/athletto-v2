<template>
  <div class="inline-flex flex-col items-start gap-3">
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="relative group shrink-0 overflow-hidden border-2 hover:border-brand-400 transition-colors"
        :class="[
          shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
          uploading && 'opacity-70 cursor-wait',
          modelValue ? 'border-gray-200 dark:border-white/10' : 'border-dashed border-gray-300 dark:border-white/15',
        ]"
        :style="{ width: `${size}px`, height: `${size}px` }"
        :disabled="uploading"
        @click="abrir"
      >
        <img
          v-if="modelValue"
          :src="modelValue"
          class="w-full h-full object-cover"
          alt=""
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-white/[0.03] text-slate-300 dark:text-white/25"
        >
          <slot name="placeholder">
            <!-- Ícone neutro padrão (imagem) — placeholder estático e limpo -->
            <svg :width="size * 0.38" :height="size * 0.38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </slot>
        </div>

        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white pointer-events-none"
        >
          <svg v-if="!uploading" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.66.9l.82 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 17a4 4 0 100-8 4 4 0 000 8z"/>
          </svg>
          <span class="text-[11px] font-semibold mt-1.5 uppercase tracking-wider">
            {{ uploading ? '' : (modelValue ? 'Trocar' : 'Enviar') }}
          </span>
        </div>

        <!-- Spinner overlay -->
        <div
          v-if="uploading"
          class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
        >
          <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </button>

      <div v-if="!hideMeta" class="space-y-1">
        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ label }}</p>
        <p class="text-xs text-gray-500 dark:text-white/50 max-w-[220px]">
          <slot name="hint">PNG ou JPEG. Será recortado e salvo como {{ outputSize }}x{{ outputSize }}.</slot>
        </p>
        <button
          v-if="modelValue && allowRemove"
          type="button"
          class="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 mt-1"
          :disabled="uploading"
          @click="$emit('remove')"
        >
          Remover
        </button>
      </div>
    </div>

    <BrandImageCropperModal
      :open="modalOpen"
      :title="label"
      :circle="shape === 'circle'"
      :output-size="outputSize"
      @close="modalOpen = false"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string | null | undefined
  label: string
  placeholderIniciais?: string
  shape?: 'square' | 'circle'
  size?: number
  outputSize?: number
  uploading?: boolean
  allowRemove?: boolean
  hideMeta?: boolean
}>(), {
  shape: 'square',
  size: 120,
  outputSize: 512,
  uploading: false,
  allowRemove: false,
  hideMeta: false,
  placeholderIniciais: 'A',
})

const emit = defineEmits<{
  (e: 'confirm', file: File): void
  (e: 'remove'): void
}>()

const modalOpen = ref(false)

function abrir() {
  modalOpen.value = true
}

function onConfirm(file: File) {
  modalOpen.value = false
  emit('confirm', file)
}
</script>
