<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="tour.visible.value"
        class="fixed inset-0 z-[100] pointer-events-none"
        aria-modal="true"
        role="dialog"
      >
        <!-- Backdrop com "buraco" no item destacado: 4 retângulos ao redor.
             Quando não há highlight, fallback para overlay sólido. -->
        <template v-if="tour.highlightBox.value">
          <div
            class="absolute left-0 top-0 right-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{ height: `${Math.max(0, tour.highlightBox.value.top - HALO_PADDING)}px` }"
            @click="tour.skip"
          />
          <div
            class="absolute left-0 right-0 bottom-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{ top: `${tour.highlightBox.value.bottom + HALO_PADDING}px` }"
            @click="tour.skip"
          />
          <div
            class="absolute left-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{
              top: `${Math.max(0, tour.highlightBox.value.top - HALO_PADDING)}px`,
              width: `${Math.max(0, tour.highlightBox.value.left - HALO_PADDING)}px`,
              height: `${tour.highlightBox.value.height + HALO_PADDING * 2}px`,
            }"
            @click="tour.skip"
          />
          <div
            class="absolute right-0 bg-slate-950/70 transition-all duration-300 pointer-events-auto"
            :style="{
              top: `${Math.max(0, tour.highlightBox.value.top - HALO_PADDING)}px`,
              left: `${tour.highlightBox.value.right + HALO_PADDING}px`,
              height: `${tour.highlightBox.value.height + HALO_PADDING * 2}px`,
            }"
            @click="tour.skip"
          />
        </template>
        <div
          v-else
          class="absolute inset-0 bg-slate-950/70 transition-opacity pointer-events-auto"
          @click="tour.skip"
        />

        <!-- Halo destacando o elemento -->
        <div
          v-if="tour.highlightBox.value"
          class="absolute rounded-xl ring-4 ring-accent/80 transition-all duration-300 pointer-events-none"
          :style="tour.highlightStyle.value"
        />

        <!-- Tooltip card -->
        <div
          v-if="tour.currentStep.value"
          class="absolute w-[320px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5 transition-all duration-300 pointer-events-auto"
          :style="tour.tooltipStyle.value"
        >
          <div class="flex items-start gap-3 mb-3">
            <div class="shrink-0 w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center">
              <component :is="tour.currentStep.value.icon" v-if="tour.currentStep.value.icon" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <svg v-else class="w-5 h-5 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-0.5">
                Passo {{ tour.stepIndex.value + 1 }} de {{ tour.steps.length }}
              </p>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {{ tour.currentStep.value.title }}
              </h3>
            </div>
          </div>

          <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            {{ tour.currentStep.value.description }}
          </p>

          <div class="flex items-center gap-1 mb-4">
            <div
              v-for="(_, i) in tour.steps"
              :key="i"
              class="h-1 rounded-full flex-1 transition-all duration-300"
              :class="i <= tour.stepIndex.value ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'"
            />
          </div>

          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              class="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              @click="tour.skip"
            >
              Pular tour
            </button>

            <div class="flex items-center gap-2">
              <button
                v-if="tour.stepIndex.value > 0"
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                @click="tour.prev"
              >
                Voltar
              </button>
              <button
                type="button"
                class="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
                @click="tour.next"
              >
                {{ tour.isLast.value ? 'Concluir' : 'Próximo' }}
                <svg v-if="!tour.isLast.value" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
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
import type { useGuidedTour } from '~/composables/useGuidedTour'

defineProps<{ tour: ReturnType<typeof useGuidedTour> }>()

const HALO_PADDING = 6
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
