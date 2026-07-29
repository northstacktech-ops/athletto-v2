<template>
  <div class="space-y-4">

    <!-- ════════════════════════════════════════════════════════════════
         VISÃO 1 — Landing de pendências do dia
    ═══════════════════════════════════════════════════════════════════ -->
    <template v-if="view === 'pendencias'">

      <!-- Resumo do dia -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">Treinos hoje</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{{ pendenciasLoading ? '—' : turmasHoje.length }}</p>
        </div>
        <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">Pendentes</p>
          <p class="text-xl font-bold mt-0.5" :class="pendentesCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'">
            {{ pendenciasLoading ? '—' : pendentesCount }}
          </p>
        </div>
        <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">Registradas</p>
          <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {{ pendenciasLoading ? '—' : registradasCount }}
          </p>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="pendenciasLoading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl"/>
      </div>

      <!-- Cards de turmas com treino hoje -->
      <template v-else-if="turmasHoje.length > 0">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">
            Chamada de hoje · {{ formatDate(hoje) }}
          </h2>
          <span class="text-xs text-slate-400">{{ diaSemanaHoje }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="item in turmasHojeOrdenadas"
            :key="item.turma.id"
            class="text-left bg-white dark:bg-surface-elevated-dark rounded-xl border p-4 transition-all hover:shadow-card hover:-translate-y-0.5"
            :class="item.registrada
              ? 'border-slate-200 dark:border-white/[0.10]'
              : 'border-amber-200 dark:border-amber-500/30'"
            @click="abrirTurma(item.turma.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ item.turma.nome }}</p>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ formatHorario(item.turma.horario_inicio, item.turma.horario_fim) }} · {{ item.totalAtletas }} atletas
                </p>
              </div>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0"
                :class="item.registrada
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'"
              >
                {{ item.registrada ? 'Registrada' : 'Pendente' }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 mt-3 text-xs font-semibold" :class="item.registrada ? 'text-slate-500' : 'text-brand-600 dark:text-brand-400'">
              {{ item.registrada ? 'Editar chamada' : 'Registrar agora' }}
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </button>
        </div>
      </template>

      <!-- Nenhum treino hoje -->
      <UiEmptyState
        v-else
        size="sm"
        title="Nenhum treino agendado para hoje 🎉"
        description="Você pode registrar a frequência de outra data ou turma abaixo."
      />

      <!-- Registrar manualmente (outra data/turma) -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3">
        <p class="text-xs font-semibold text-slate-500 mb-2">Registrar outra data ou turma</p>
        <div class="flex items-center gap-2 flex-wrap">
          <select v-model="turmaManual" class="form-input flex-1 min-w-[220px]">
            <option value="">Selecione uma turma...</option>
            <option v-for="t in turmas" :key="t.id" :value="t.id">
              {{ t.nome }} · {{ formatDiasSemana(t.dias_semana) }}
            </option>
          </select>
          <input v-model="dataManual" type="date" :max="hoje" class="form-input w-auto"/>
          <button
            class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
            :disabled="!turmaManual || !dataManual"
            @click="abrirManual"
          >
            Abrir
          </button>
        </div>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════
         VISÃO 2 — Lista de chamada (registro)
    ═══════════════════════════════════════════════════════════════════ -->
    <template v-else>

      <!-- Cabeçalho com voltar -->
      <div class="flex items-center gap-3 flex-wrap">
        <button
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          @click="voltarPendencias"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Voltar
        </button>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ turmaSelecionada?.nome ?? 'Turma' }}</p>
          <p class="text-xs text-slate-500">{{ formatDate(data) }}</p>
        </div>
        <input v-model="data" type="date" :max="hoje" class="form-input w-auto ml-auto"/>
      </div>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 6" :key="i" class="skeleton h-14 rounded-lg"/>
      </div>

      <UiEmptyState
        v-else-if="atletas.length === 0"
        title="Sem atletas nesta turma"
        description="Vincule atletas à turma antes de registrar frequência."
      />

      <template v-else>
        <!-- Resumo -->
        <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] p-3 flex items-center gap-3 text-sm flex-wrap">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"/>
            <span class="font-semibold text-gray-900 dark:text-white">{{ presentesCount }}</span>
            <span class="text-gray-500">presentes</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-red-500"/>
            <span class="font-semibold text-gray-900 dark:text-white">{{ ausentesCount }}</span>
            <span class="text-gray-500">faltas</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-gray-300"/>
            <span class="font-semibold text-gray-900 dark:text-white">{{ pendentes }}</span>
            <span class="text-gray-500">pendentes</span>
          </div>
          <button
            class="ml-auto text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            :class="{ 'invisible': loading }"
            @click="marcarTodos(true)"
          >
            ✓ Todos presentes
          </button>
        </div>

        <!-- Lista -->
        <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.07]">
          <div
            v-for="a in atletas"
            :key="a.id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <UiAvatar :nome="a.nome" :src="a.foto_url" :numero="a.numero_camisa" size="sm"/>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ a.nome }}</p>
              <p class="text-xs text-gray-400">{{ a.posicao ?? 'Sem posição' }}</p>
            </div>

            <div class="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/[0.10]">
              <button
                class="px-3 py-1.5 text-xs font-semibold transition-colors"
                :class="estado[a.id] === true
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-surface-canvas-dark text-gray-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'"
                @click="setEstado(a.id, true)"
              >
                Presente
              </button>
              <button
                class="px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 dark:border-white/[0.10]"
                :class="estado[a.id] === false
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-surface-canvas-dark text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20'"
                @click="setEstado(a.id, false)"
              >
                Falta
              </button>
            </div>
          </div>
        </div>

        <!-- Save bar -->
        <div class="sticky bottom-4 bg-white dark:bg-surface-elevated-dark border border-gray-200 dark:border-white/[0.10] rounded-xl p-3 flex items-center justify-between shadow-lg">
          <p v-if="dirty" class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>
            {{ Object.keys(estado).length }} alteraç{{ Object.keys(estado).length === 1 ? 'ão' : 'ões' }} sem salvar
          </p>
          <p v-else class="text-xs text-gray-500">Tudo salvo</p>
          <button :disabled="!dirty || salvando" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors" @click="salvar">
            {{ salvando ? 'Salvando...' : 'Salvar frequência' }}
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatDiasSemana, formatHorario, formatDate } from '~/utils/format'
import type { Atleta, Turma, Frequencia } from '~/types'

const props = defineProps<{ turmas: Turma[] }>()

const freqComp = useFrequencia()
const toast = useToast()

const hoje = new Date().toISOString().slice(0, 10)
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const diaSemanaHoje = DIAS_FULL[new Date().getDay()]

// ── Controle de visão ────────────────────────────────────────────────────────
const view = ref<'pendencias' | 'lista'>('pendencias')

// ── Landing: pendências do dia ───────────────────────────────────────────────
interface Pendencia { turma: Turma; registrada: boolean; totalAtletas: number }
const pendenciasLoading = ref(true)
const turmasHoje = ref<Pendencia[]>([])

const turmasHojeOrdenadas = computed(() =>
  [...turmasHoje.value].sort((a, b) => Number(a.registrada) - Number(b.registrada)),
)
const pendentesCount = computed(() => turmasHoje.value.filter((t) => !t.registrada).length)
const registradasCount = computed(() => turmasHoje.value.filter((t) => t.registrada).length)

async function carregarPendencias() {
  pendenciasLoading.value = true
  const diaHoje = new Date().getDay()
  const candidatas = props.turmas.filter((t) => (t.dias_semana ?? []).includes(diaHoje))

  turmasHoje.value = await Promise.all(
    candidatas.map(async (turma) => {
      const [{ data: regs }, { data: as }] = await Promise.all([
        freqComp.buscarPorTurmaData(turma.id, hoje),
        freqComp.atletasDaTurma(turma.id),
      ])
      const atletasList = (as ?? []).map((x: any) => (x.atletas ? x.atletas : x))
      return {
        turma,
        registrada: (regs ?? []).length > 0,
        totalAtletas: atletasList.length,
      }
    }),
  )
  pendenciasLoading.value = false
  // Sem auto-seleção: a tela sempre mostra a lista do dia. O gestor clica no
  // treino que quer registrar (evita o "voltar" sem efeito quando há 1 turma).
}

// ── Seletor manual ───────────────────────────────────────────────────────────
const turmaManual = ref('')
const dataManual = ref(hoje)

function abrirManual() {
  if (!turmaManual.value || !dataManual.value) return
  abrirTurma(turmaManual.value, dataManual.value)
}

// ── Lista de chamada ─────────────────────────────────────────────────────────
const turmaId = ref('')
const data = ref(hoje)
const loading = ref(false)
const salvando = ref(false)
const atletas = ref<Atleta[]>([])
const estado = reactive<Record<string, boolean>>({}) // atleta_id → presente?
const original = reactive<Record<string, boolean>>({})

const turmaSelecionada = computed(() => props.turmas.find((t) => t.id === turmaId.value) ?? null)

function abrirTurma(id: string, dataAlvo?: string) {
  turmaId.value = id
  data.value = dataAlvo ?? hoje
  view.value = 'lista'
}

function voltarPendencias() {
  view.value = 'pendencias'
  turmaId.value = ''
  carregarPendencias()
}

async function carregar() {
  if (!turmaId.value || !data.value) return
  loading.value = true
  Object.keys(estado).forEach((k) => delete estado[k])
  Object.keys(original).forEach((k) => delete original[k])

  const [{ data: as }, { data: regs }] = await Promise.all([
    freqComp.atletasDaTurma(turmaId.value),
    freqComp.buscarPorTurmaData(turmaId.value, data.value),
  ])
  atletas.value = (as ?? []).map((x: any) => (x.atletas ? x.atletas : x)) as Atleta[]

  ;(regs as Frequencia[] | null ?? []).forEach((r) => {
    estado[r.atleta_id] = r.presente
    original[r.atleta_id] = r.presente
  })
  loading.value = false
}

// Recarrega a lista quando turma/data mudam estando na visão de lista.
watch([turmaId, data], () => {
  if (view.value === 'lista') carregar()
})

const presentesCount = computed(() => Object.values(estado).filter((v) => v === true).length)
const ausentesCount = computed(() => Object.values(estado).filter((v) => v === false).length)
const pendentes = computed(() => atletas.value.length - presentesCount.value - ausentesCount.value)

const dirty = computed(() => {
  if (Object.keys(estado).length === 0) return false
  for (const id of Object.keys(estado)) {
    if (estado[id] !== original[id]) return true
  }
  return false
})

function setEstado(id: string, v: boolean) {
  estado[id] = v
}

function marcarTodos(presente: boolean) {
  atletas.value.forEach((a) => (estado[a.id] = presente))
}

async function salvar() {
  if (!dirty.value || !turmaId.value || !data.value) return
  salvando.value = true
  try {
    const registros = Object.entries(estado).map(([atleta_id, presente]) => ({ atleta_id, presente }))
    const { error } = await freqComp.registrar(turmaId.value, data.value, registros)
    if (error) throw error
    Object.assign(original, estado)
    toast.success('Frequência salva', `${registros.length} registros`)
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    salvando.value = false
  }
}

// As turmas chegam de forma assíncrona do componente pai — recarrega as
// pendências assim que a lista é populada (e sempre que mudar), desde que o
// usuário ainda esteja na visão de pendências.
watch(
  () => props.turmas,
  () => { if (view.value === 'pendencias') carregarPendencias() },
  { immediate: true, deep: true },
)
</script>
