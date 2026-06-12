<template>
  <div class="space-y-4">

    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="s in (['ativos', 'dispensados'] as const)"
        :key="s"
        class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
        :class="filtro === s
          ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
          : 'bg-white dark:bg-surface-elevated-dark border-gray-200 dark:border-white/[0.10] text-gray-700 dark:text-gray-300'"
        @click="filtro = s"
      >
        {{ s === 'ativos' ? 'Ativos' : 'Dispensados' }}
        <span v-if="s === 'ativos'" class="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">
          {{ ativos.length }}
        </span>
      </button>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl"/>
    </div>

    <UiEmptyState
      v-else-if="lista.length === 0"
      :title="filtro === 'ativos' ? '✓ Tudo em dia' : 'Nada dispensado'"
      :description="filtro === 'ativos' ? 'Nenhum atleta com 3+ faltas seguidas no momento.' : 'Alertas dispensados aparecem aqui.'"
    />

    <ul v-else class="space-y-2">
      <li
        v-for="al in lista"
        :key="al.id"
        class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-4 flex items-start gap-3"
        :class="al.dispensado ? 'opacity-70' : ''"
      >
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style="background-color: #ef4444;">
          {{ getIniciais(al.atleta?.nome ?? '?') }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ al.atleta?.nome }}</p>
            <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {{ al.faltas_consecutivas }} faltas seguidas
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ al.turma?.nome ?? 'Turma' }} · detectado em {{ formatDate(al.data_deteccao) }}
            <template v-if="al.dispensado_em"> · dispensado em {{ formatDate(al.dispensado_em.slice(0,10)) }}</template>
          </p>

          <div v-if="!al.dispensado" class="mt-3 flex items-center gap-2 flex-wrap">
            <a
              v-if="al.atleta?.telefone_responsavel"
              :href="linkWhatsApp(al)"
              target="_blank"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 inline-flex items-center gap-1.5"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l.502.799-1.005 3.67 3.692-.968zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
              WhatsApp
            </a>
            <NuxtLink
              :to="`/atletas?atleta=${al.atleta_id}`"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.05] border border-gray-200 dark:border-white/[0.10]"
            >
              Ver atleta
            </NuxtLink>
            <button
              class="ml-auto text-xs font-semibold text-gray-400 hover:text-gray-700"
              @click="dispensar(al.id)"
            >
              Dispensar →
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { formatDate, getIniciais, gerarLinkWhatsApp, gerarMensagemEvasao } from '~/utils/format'
import type { AlertaEvasao } from '~/types'

const emit = defineEmits<{ (e: 'atualizado'): void }>()
const freqComp = useFrequencia()
const toast = useToast()

const loading = ref(true)
const filtro = ref<'ativos' | 'dispensados'>('ativos')
const todos = ref<AlertaEvasao[]>([])

async function carregar() {
  loading.value = true
  const { data } = await freqComp.listarAlertas(true)
  todos.value = data ?? []
  loading.value = false
}
onMounted(carregar)

const ativos = computed(() => todos.value.filter((a) => !a.dispensado))
const dispensados = computed(() => todos.value.filter((a) => a.dispensado))
const lista = computed(() => filtro.value === 'ativos' ? ativos.value : dispensados.value)

function linkWhatsApp(al: AlertaEvasao) {
  const fone = al.atleta?.telefone_responsavel ?? ''
  const msg = gerarMensagemEvasao('responsável', al.atleta?.nome ?? 'o atleta')
  return gerarLinkWhatsApp(fone, msg)
}

async function dispensar(id: string) {
  // Atualização otimista: a UI responde na hora; reverte se o servidor falhar.
  const estadoAnterior = todos.value.map((a) => ({ ...a }))
  todos.value = todos.value.map((a) =>
    a.id === id ? { ...a, dispensado: true, dispensado_em: new Date().toISOString() } : a,
  )

  const { error } = await freqComp.dispensarAlerta(id)
  if (error) {
    todos.value = estadoAnterior
    toast.error('Falha ao dispensar alerta', error.message ?? '')
    return
  }
  toast.success('Alerta dispensado', 'O atleta não aparecerá mais nos alertas ativos.')
  emit('atualizado')
}
</script>
