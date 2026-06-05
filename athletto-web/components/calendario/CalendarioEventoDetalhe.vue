<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full sm:max-w-lg bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <!-- Header -->
        <div class="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.07]">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                   :class="evento.tipo === 'treino' ? 'bg-brand-50 dark:bg-brand-500/15' : 'bg-violet-50 dark:bg-violet-500/15'">
                <svg class="w-4 h-4" :class="evento.tipo === 'treino' ? 'text-brand-600 dark:text-brand-400' : 'text-violet-600 dark:text-violet-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <template v-if="evento.tipo === 'treino'"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></template>
                  <template v-else><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></template>
                </svg>
              </div>
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">{{ evento.titulo }}</h2>
                <p class="text-sm text-slate-500 mt-0.5">{{ dataTexto }} · {{ horarioTexto }}</p>
                <span v-if="isTreino" class="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">Gerado da turma</span>
              </div>
            </div>
            <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05] shrink-0" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4 overflow-y-auto">
          <p v-if="evento.descricao" class="text-sm text-slate-600 dark:text-slate-300">{{ evento.descricao }}</p>

          <!-- Turmas vinculadas -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Turmas vinculadas</p>
            <div v-if="turmasVinculadas.length" class="flex flex-wrap gap-1.5">
              <span v-for="t in turmasVinculadas" :key="t.id" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>
                {{ t.nome }}
              </span>
            </div>
            <p v-else class="text-sm text-slate-400">Nenhuma turma vinculada.</p>
          </div>

          <!-- Atletas / participantes -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Participantes
              <span v-if="participantes.length" class="text-slate-300 dark:text-white/30">· {{ participantes.length }}</span>
            </p>
            <div v-if="carregando" class="space-y-2">
              <div v-for="i in 3" :key="i" class="skeleton h-9 rounded-lg"/>
            </div>
            <ul v-else-if="participantes.length" class="space-y-1 max-h-56 overflow-y-auto">
              <li v-for="a in participantes" :key="a.id" class="flex items-center gap-2.5 py-1">
                <UiAvatar :nome="a.nome" :src="a.foto_url" :numero="a.numero_camisa" size="sm"/>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{{ a.nome }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ a.posicao ?? 'Sem posição' }}</p>
                </div>
                <span v-if="a._viaTurma" class="ml-auto text-[10px] font-medium text-slate-400 shrink-0">via turma</span>
                <span v-else class="ml-auto text-[10px] font-semibold text-brand-500 shrink-0">individual</span>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-400">Nenhum atleta vinculado.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07] flex justify-between gap-3 bg-slate-50 dark:bg-white/[0.02] shrink-0">
          <button v-if="!isTreino" type="button" class="text-xs font-semibold text-red-500 hover:text-red-700" @click="excluir">
            Excluir evento
          </button>
          <span v-else/>
          <div class="flex gap-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors" @click="$emit('close')">Fechar</button>
            <button v-if="!isTreino" type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors" @click="$emit('editar', evento)">
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { EventoCalendario, Turma, Atleta } from '~/types'

const props = defineProps<{
  evento: EventoCalendario
  turmas: Turma[]
  atletas: Atleta[]
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'editar', ev: EventoCalendario): void; (e: 'excluido'): void }>()

const calComp = useCalendario()
const atletasComp = useAtletas()
const toast = useToast()

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

const isTreino = computed(() => props.evento.id.startsWith('treino-'))

const turmaIds = computed<string[]>(() => {
  if (props.evento.turma_ids?.length) return props.evento.turma_ids
  return props.evento.turma_id ? [props.evento.turma_id] : []
})

const turmasVinculadas = computed(() => props.turmas.filter((t) => turmaIds.value.includes(t.id)))

const dataTexto = computed(() => {
  const d = new Date(props.evento.data_inicio.slice(0, 10) + 'T00:00:00')
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
})

const horarioTexto = computed(() => {
  const ini = props.evento.data_inicio.includes('T') ? props.evento.data_inicio.slice(11, 16) : null
  const fim = props.evento.data_fim?.includes('T') ? props.evento.data_fim.slice(11, 16) : null
  if (ini && ini !== '00:00' && fim) return `${ini} – ${fim}`
  if (ini && ini !== '00:00') return ini
  return 'Dia inteiro'
})

// Participantes = atletas individuais (atleta_ids) ∪ membros das turmas vinculadas.
const carregando = ref(true)
const membrosTurmaIds = ref<Set<string>>(new Set())

const participantes = computed(() => {
  const individuais = new Set(props.evento.atleta_ids ?? [])
  const todosIds = new Set<string>([...individuais, ...membrosTurmaIds.value])
  return [...todosIds]
    .map((id) => {
      const a = props.atletas.find((x) => x.id === id)
      if (!a) return null
      return { ...a, _viaTurma: !individuais.has(id) }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome)) as (Atleta & { _viaTurma: boolean })[]
})

onMounted(async () => {
  if (turmaIds.value.length) {
    const mapa = await atletasComp.listarVinculosPorTurmas(turmaIds.value)
    const ids = new Set<string>()
    mapa.forEach((arr) => arr.forEach((id) => ids.add(id)))
    membrosTurmaIds.value = ids
  }
  carregando.value = false
})

async function excluir() {
  if (isTreino.value) return
  if (!window.confirm(`Excluir "${props.evento.titulo}"?`)) return
  const { error } = await calComp.excluir(props.evento.id)
  if (error) { toast.error('Falha ao excluir', error.message); return }
  toast.success('Evento excluído')
  emit('excluido')
}
</script>
