<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="cancelar"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div
          class="relative w-full sm:max-w-2xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ title }}</h2>
              <p class="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                A imagem será recortada em formato quadrado e salva como PNG {{ outputSize }}x{{ outputSize }}.
              </p>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              @click="cancelar"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto">
            <!-- Step 1: drag-and-drop / file picker -->
            <div v-if="step === 'pick'" class="p-6">
              <label
                class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
                :class="dragOver
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/[0.02] hover:border-brand-400'"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
              >
                <svg class="w-10 h-10 text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.79-1A4.5 4.5 0 0118 16M12 12v9m0 0l-3-3m3 3l3-3"/>
                </svg>
                <p class="text-sm font-semibold text-gray-700 dark:text-white">Arraste a imagem ou clique para escolher</p>
                <p class="text-xs text-gray-500 dark:text-white/50 mt-1">PNG, JPEG ou WEBP — até 5MB</p>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="onPick"
                />
              </label>
            </div>

            <!-- Step 2: crop -->
            <div v-else class="bg-slate-900">
              <Cropper
                ref="cropperRef"
                class="cropper-visivel w-full"
                :style="{ height: '60vh', maxHeight: '480px' }"
                :src="imageSrc"
                :stencil-props="{ aspectRatio: 1, movable: true, resizable: true }"
                :stencil-component="circle ? 'circle-stencil' : 'rectangle-stencil'"
                image-restriction="fit-area"
                background-class="bg-slate-900"
              />
              <div class="flex items-center justify-between gap-3 px-6 py-3 bg-slate-800/80 text-xs text-white/70 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="hidden sm:inline">Arraste a foto para enquadrar.</span>
                  <button type="button" class="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-base leading-none" title="Diminuir zoom" @click="zoomOut">−</button>
                  <button type="button" class="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-base leading-none" title="Aumentar zoom" @click="zoomIn">+</button>
                  <button type="button" class="px-2.5 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center gap-1" title="Centralizar" @click="centralizar">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                    Centralizar
                  </button>
                </div>
                <button
                  type="button"
                  class="text-xs font-semibold text-white/80 hover:text-white"
                  @click="step = 'pick'; imageSrc = ''"
                >
                  Escolher outra imagem
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-2 bg-gray-50 dark:bg-white/[0.02]">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              @click="cancelar"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="step !== 'crop' || saving"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="confirmar"
            >
              {{ saving ? 'Processando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  /** Aceita stencil circular (visual apenas — o arquivo final é sempre quadrado). */
  circle?: boolean
  /** Dimensão do PNG final (quadrado). */
  outputSize?: number
}>(), {
  title: 'Recortar imagem',
  circle: false,
  outputSize: 512,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', file: File): void
}>()

const step = ref<'pick' | 'crop'>('pick')
const imageSrc = ref('')
const dragOver = ref(false)
const saving = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)

const toast = useToast()

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

watch(() => props.open, (val) => {
  if (val) {
    step.value = 'pick'
    imageSrc.value = ''
    dragOver.value = false
    saving.value = false
  } else if (imageSrc.value && imageSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageSrc.value)
  }
})

function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadFile(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

function loadFile(file: File) {
  if (!ACCEPTED.includes(file.type)) {
    toast.error('Formato não suportado', 'Use PNG, JPEG ou WEBP.')
    return
  }
  if (file.size > MAX_BYTES) {
    toast.error('Arquivo muito grande', 'Tamanho máximo: 5MB.')
    return
  }
  if (imageSrc.value && imageSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageSrc.value)
  }
  imageSrc.value = URL.createObjectURL(file)
  step.value = 'crop'
}

async function confirmar() {
  if (!cropperRef.value) return
  saving.value = true
  try {
    const result = cropperRef.value.getResult()
    const sourceCanvas: HTMLCanvasElement | null = result?.canvas ?? null
    if (!sourceCanvas) {
      toast.error('Falha ao processar imagem', 'Tente novamente.')
      return
    }

    // Redimensiona para outputSize x outputSize via canvas auxiliar.
    const out = document.createElement('canvas')
    out.width = props.outputSize
    out.height = props.outputSize
    const ctx = out.getContext('2d')
    if (!ctx) {
      toast.error('Canvas indisponível', 'Navegador sem suporte.')
      return
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(sourceCanvas, 0, 0, props.outputSize, props.outputSize)

    const blob: Blob | null = await new Promise((resolve) =>
      out.toBlob((b) => resolve(b), 'image/png', 0.92),
    )
    if (!blob) {
      toast.error('Falha ao exportar imagem', 'Tente outra imagem.')
      return
    }

    const file = new File([blob], `imagem-${Date.now()}.png`, { type: 'image/png' })
    emit('confirm', file)
  } finally {
    saving.value = false
  }
}

function zoomIn() {
  cropperRef.value?.zoom?.(1.15)
}
function zoomOut() {
  cropperRef.value?.zoom?.(0.85)
}
function centralizar() {
  // Reposiciona a imagem preenchendo o stencil (volta ao enquadramento inicial).
  cropperRef.value?.reset?.()
}

function cancelar() {
  emit('close')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Moldura de recorte bem visível: escurece a área de fora, destaca a borda e as alças. */
.cropper-visivel :deep(.vue-advanced-cropper__foreground) {
  opacity: 0.62;
}
.cropper-visivel :deep(.vue-simple-line) {
  border-color: rgba(255, 255, 255, 0.9);
  border-width: 2px;
}
.cropper-visivel :deep(.vue-simple-handler) {
  background: #fff;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45);
}
</style>
