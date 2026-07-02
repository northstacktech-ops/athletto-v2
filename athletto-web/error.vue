<template>
  <div class="min-h-screen bg-gray-50 dark:bg-surface-canvas-dark flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-white dark:bg-surface-elevated-dark rounded-2xl border border-gray-200 dark:border-white/[0.10] p-8 text-center">

      <!-- Ilustração -->
      <div class="relative w-24 h-24 mx-auto mb-5">
        <div class="absolute inset-0 rounded-full" :style="{ backgroundColor: corCirculo, opacity: 0.15 }"/>
        <div class="absolute inset-3 rounded-full flex items-center justify-center" :style="{ backgroundColor: corCirculo }">
          <span class="text-[28px] font-extrabold text-white">{{ statusCode }}</span>
        </div>
      </div>

      <h1 class="text-[22px] font-extrabold text-gray-900 dark:text-white">{{ titulo }}</h1>
      <p class="text-[13.5px] text-gray-500 mt-2 leading-relaxed">{{ descricao }}</p>

      <div v-if="isDev && error?.stack" class="mt-5 text-left">
        <details class="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-3">
          <summary class="text-[11px] font-semibold text-gray-500 cursor-pointer">Stack (dev only)</summary>
          <pre class="text-[10px] text-gray-600 dark:text-gray-400 mt-2 overflow-x-auto font-mono">{{ error.stack }}</pre>
        </details>
      </div>

      <div class="mt-6 flex flex-col sm:flex-row gap-2">
        <button
          class="flex-1 px-4 py-2.5 rounded-lg text-[12.5px] font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.10] hover:bg-gray-50 dark:hover:bg-white/[0.02]"
          @click="voltar"
        >
          Voltar
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-lg text-[12.5px] font-semibold text-white"
          style="background-color: #3d5afe;"
          @click="ir('/')"
        >
          Ir para o painel
        </button>
      </div>

      <p class="text-[11.5px] text-gray-400 mt-6">
        Problema persiste? Fale com a gente em
        <a href="mailto:suporte@athletto.com.br" class="underline">suporte@athletto.com.br</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError | null }>()

const isDev = process.dev

const statusCode = computed(() => props.error?.statusCode ?? 500)
const titulo = computed(() => {
  switch (statusCode.value) {
    case 404: return 'Página não encontrada'
    case 403: return 'Acesso negado'
    case 500: return 'Algo deu errado'
    default:  return 'Ops!'
  }
})
const descricao = computed(() => {
  switch (statusCode.value) {
    case 404: return 'A página que você procurou não existe ou foi movida.'
    case 403: return 'Você não tem permissão para acessar este recurso.'
    case 500: return 'Estamos investigando. Tente novamente em alguns instantes.'
    default:  return props.error?.message ?? 'Erro inesperado.'
  }
})
const corCirculo = computed(() => {
  if (statusCode.value === 404) return '#3d5afe'
  if (statusCode.value === 403) return '#f97316'
  return '#ef4444'
})

function voltar() {
  if (process.client && window.history.length > 1) window.history.back()
  else ir('/')
}
function ir(path: string) {
  clearError({ redirect: path })
}
</script>
