<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Calendário</h1>
        <p class="text-sm text-slate-500 mt-0.5">Treinos automáticos + eventos manuais</p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Toggle vista -->
        <div class="inline-flex rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-elevated-dark p-0.5">
          <button
            class="px-3 py-1 rounded text-xs font-semibold transition-colors"
            :class="vista === 'semana' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            @click="vista = 'semana'"
          >Semana</button>
          <button
            class="px-3 py-1 rounded text-xs font-semibold transition-colors"
            :class="vista === 'mes' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            @click="vista = 'mes'"
          >Mês</button>
        </div>

        <button
          v-if="podeEditar"
          class="px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 transition-colors"
          @click="abrirCadastro = true"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo evento
        </button>
      </div>
    </div>

    <!-- Barra de navegação -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3 flex items-center gap-3">
      <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors" @click="navegar(-1)">
        <svg class="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h2 class="flex-1 text-center text-base font-bold text-slate-900 dark:text-white capitalize">
        {{ tituloNavegacao }}
      </h2>
      <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors" @click="navegar(1)">
        <svg class="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button
        class="ml-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.10] text-slate-600 dark:text-slate-300 transition-colors"
        @click="irHoje"
      >Hoje</button>
    </div>

    <!-- ══ VISTA SEMANAL ══ -->
    <template v-if="vista === 'semana'">
      <div v-if="loading" class="grid grid-cols-7 gap-px">
        <div v-for="i in 7" :key="i" class="skeleton h-[420px] rounded-xl"/>
      </div>

      <div v-else class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden overflow-x-auto">
        <div class="min-w-[980px]">
        <!-- Cabeçalho dos dias -->
        <div class="grid grid-cols-7 border-b border-slate-200 dark:border-white/[0.06]">
          <div
            v-for="cell in celulasSemanais"
            :key="cell.iso"
            class="px-2 py-3 text-center border-r border-slate-100 dark:border-white/[0.04] last:border-r-0 cursor-pointer"
            :class="cell.iso === diaSelecionadoIso ? 'bg-slate-50 dark:bg-white/[0.03]' : ''"
            @click="diaSelecionadoIso = cell.iso"
          >
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ cell.dayName }}</p>
            <span
              class="mt-1 w-7 h-7 rounded-full inline-flex items-center justify-center text-sm font-bold transition-colors"
              :class="cell.hoje
                ? 'bg-brand-600 text-white'
                : cell.iso === diaSelecionadoIso
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-800 dark:text-slate-200'"
            >{{ cell.dia }}</span>
            <p v-if="cell.eventos.length" class="text-xs text-slate-400 mt-0.5">
              {{ cell.eventos.length }} evento{{ cell.eventos.length > 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <!-- Grade de eventos -->
        <div class="grid grid-cols-7 min-h-[380px]">
          <div
            v-for="cell in celulasSemanais"
            :key="cell.iso"
            class="border-r border-slate-100 dark:border-white/[0.04] last:border-r-0 p-2 flex flex-col gap-1.5"
            :class="cell.iso === diaSelecionadoIso ? 'bg-slate-50/60 dark:bg-white/[0.02]' : ''"
          >
            <!-- Eventos do dia -->
            <button
              v-for="e in cell.eventos"
              :key="e.id"
              class="w-full text-left rounded-lg border-l-2 p-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] hover:shadow-sm transition-shadow group/ev"
              :class="e.tipo === 'treino' ? 'border-l-brand-500' : 'border-l-violet-500'"
              @click="abrirDetalhe(e)"
            >
              <p class="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate">{{ e.titulo }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ horarioTexto(e) }}</p>
              <span v-if="e.id.startsWith('treino-')" class="text-[9px] text-slate-400">auto</span>
            </button>

            <!-- Adicionar -->
            <button
              v-if="podeEditar"
              class="w-full mt-auto py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05] dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
              @click="abrirCadastroEm(cell.iso)"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar
            </button>
          </div>
        </div>
        </div>
      </div>
    </template>

    <!-- ══ VISTA MENSAL ══ -->
    <template v-else>
      <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="lg:col-span-3 skeleton h-[500px] rounded-xl"/>
        <div class="skeleton h-[300px] rounded-xl"/>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Grid mensal -->
        <div class="lg:col-span-3 bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden">
          <!-- Cabeçalho semana -->
          <div class="grid grid-cols-7 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div v-for="(d, i) in diasSemana" :key="i" class="px-2 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
              {{ d }}
            </div>
          </div>

          <div class="grid grid-cols-7">
            <button
              v-for="cell in celulas"
              :key="cell.iso"
              class="min-h-[90px] sm:min-h-[110px] border-r border-b border-slate-100 dark:border-white/[0.06] p-1.5 text-left transition-colors flex flex-col"
              :class="[
                cell.outro ? 'bg-slate-50/40 dark:bg-white/[0.01]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]',
                cell.iso === diaSelecionadoIso ? 'ring-2 ring-inset ring-brand-500' : '',
              ]"
              @click="diaSelecionadoIso = cell.iso"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="text-xs font-bold rounded-full w-5 h-5 inline-flex items-center justify-center"
                  :class="cell.hoje ? 'bg-brand-600 text-white' : (cell.outro ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300')"
                >{{ cell.dia }}</span>
                <span v-if="cell.eventos.length > 3" class="text-[9px] text-slate-400">+{{ cell.eventos.length - 3 }}</span>
              </div>
              <div class="flex flex-col gap-0.5 overflow-hidden">
                <span
                  v-for="(e, idx) in cell.eventos.slice(0, 3)"
                  :key="`${cell.iso}-${idx}`"
                  class="px-1.5 py-px rounded text-[9.5px] font-medium truncate bg-white dark:bg-white/[0.04] border border-l-2 text-slate-700 dark:text-slate-200"
                  :class="e.tipo === 'treino' ? 'border-l-brand-500 border-slate-200 dark:border-white/[0.08]' : 'border-l-violet-500 border-slate-200 dark:border-white/[0.08]'"
                >{{ e.titulo }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Painel lateral -->
        <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden flex flex-col h-fit lg:max-h-[600px]">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
            <p class="text-xs font-semibold text-slate-500 capitalize">{{ diaSelecionadoTexto.weekday }}</p>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{{ diaSelecionadoTexto.dia }}</h3>
            <p class="text-xs text-slate-500">{{ diaSelecionadoTexto.mes }}</p>
          </div>

          <UiEmptyState v-if="eventosDoDia.length === 0" size="sm" title="Sem eventos" description="Nada agendado neste dia." />

          <ul v-else class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
            <li
              v-for="e in eventosDoDia"
              :key="e.id"
              class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] group cursor-pointer"
              @click="abrirDetalhe(e)"
            >
              <div class="flex items-start gap-2.5">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-slate-100 dark:bg-white/[0.05]">
                  <svg class="w-3.5 h-3.5" :class="e.tipo === 'treino' ? 'text-brand-600' : 'text-violet-600'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <template v-if="e.tipo === 'treino'">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </template>
                    <template v-else>
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </template>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ e.titulo }}</p>
                  <p class="text-xs text-slate-500">{{ horarioTexto(e) }}<template v-if="e.id.startsWith('treino-')"> · gerado da turma</template></p>
                  <p v-if="e.descricao" class="text-xs text-slate-400 mt-1 line-clamp-2">{{ e.descricao }}</p>
                </div>
                <span v-if="e.id.startsWith('treino-')" class="text-xs font-medium text-slate-400">auto</span>
              </div>
            </li>
          </ul>

          <div v-if="podeEditar" class="px-5 py-3 border-t border-slate-100 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.02]">
            <button class="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 dark:hover:text-white inline-flex items-center justify-center gap-1.5" @click="abrirCadastroEm(diaSelecionadoIso)">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar evento neste dia
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal de detalhe (ver vinculados) -->
    <CalendarioEventoDetalhe
      v-if="eventoDetalhe"
      :evento="eventoDetalhe"
      :turmas="turmas"
      :atletas="atletas"
      @close="eventoDetalhe = null"
      @editar="onEditarDoDetalhe"
      @excluido="() => { eventoDetalhe = null; carregar() }"
    />

    <!-- Modal de criação/edição -->
    <CalendarioFormModal
      v-if="abrirCadastro || eventoEditando"
      :evento="eventoEditando"
      :data-inicial="dataNovoEvento"
      :turmas="turmas"
      :atletas="atletas"
      @close="fechar"
      @salvo="onSalvo"
      @excluido="onSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import type { EventoCalendario, Turma, Atleta } from '~/types'

definePageMeta({ layout: 'default' })
useHead({ title: 'Calendário — Athletto' })

const calComp = useCalendario()
const turmasComp = useTurmas()
const atletasComp = useAtletas()
const { temPermissao } = useAuth()

// Controla os botões de escrita (novo evento / adicionar no dia).
const podeEditar = computed(() => temPermissao('calendario', 'editar'))

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const mesesNomes = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// ── Estado central ──────────────────────────────────────────
const vista = ref<'semana' | 'mes'>('semana')
const diaBase = ref(new Date())             // âncora de navegação
const diaSelecionadoIso = ref(toIso(new Date()))
const loading = ref(true)
const eventos = ref<EventoCalendario[]>([])
const turmas = ref<Turma[]>([])
const atletas = ref<Atleta[]>([])
const abrirCadastro = ref(false)
const eventoEditando = ref<EventoCalendario | null>(null)
const eventoDetalhe = ref<EventoCalendario | null>(null)
const dataNovoEvento = ref<string | null>(null)

// ── Carregamento ────────────────────────────────────────────
async function carregar() {
  loading.value = true

  // Determina quais meses precisam ser carregados
  const mesesSet = new Set<string>()
  if (vista.value === 'semana') {
    const dom = inicioSemana(diaBase.value)
    for (let i = 0; i < 7; i++) {
      const d = new Date(dom)
      d.setDate(d.getDate() + i)
      mesesSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
    }
  } else {
    mesesSet.add(`${diaBase.value.getFullYear()}-${diaBase.value.getMonth() + 1}`)
  }

  const [{ data: ts }, { data: ats }, ...evResults] = await Promise.all([
    turmasComp.listar(),
    atletasComp.listar(),
    ...[...mesesSet].map((m) => {
      const [a, me] = m.split('-').map(Number)
      return calComp.listarPorMes(a, me)
    }),
  ])

  turmas.value = ts ?? []
  atletas.value = ats ?? []

  const evsTodos: EventoCalendario[] = []
  for (const r of evResults) {
    evsTodos.push(...((r as any).data ?? []))
  }
  // Deduplica por id
  const seen = new Set<string>()
  eventos.value = evsTodos.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  loading.value = false
}

onMounted(carregar)
watch([vista, diaBase], carregar)

// ── Navegação ───────────────────────────────────────────────
function navegar(delta: number) {
  const d = new Date(diaBase.value)
  if (vista.value === 'semana') {
    d.setDate(d.getDate() + delta * 7)
  } else {
    d.setMonth(d.getMonth() + delta)
  }
  diaBase.value = d
}

function irHoje() {
  diaBase.value = new Date()
  diaSelecionadoIso.value = toIso(new Date())
}

// ── Título da barra de navegação ────────────────────────────
const tituloNavegacao = computed(() => {
  if (vista.value === 'mes') {
    return `${mesesNomes[diaBase.value.getMonth()]} ${diaBase.value.getFullYear()}`
  }
  // Semana: ex "12 – 18 jan 2026"
  const dom = inicioSemana(diaBase.value)
  const sab = new Date(dom)
  sab.setDate(sab.getDate() + 6)
  const mD = mesesNomes[dom.getMonth()].slice(0, 3)
  const mS = mesesNomes[sab.getMonth()].slice(0, 3)
  if (dom.getMonth() === sab.getMonth()) {
    return `${dom.getDate()} – ${sab.getDate()} ${mD} ${sab.getFullYear()}`
  }
  return `${dom.getDate()} ${mD} – ${sab.getDate()} ${mS} ${sab.getFullYear()}`
})

// ── Células da semana ───────────────────────────────────────
const celulasSemanais = computed(() => {
  const dom = inicioSemana(diaBase.value)
  const hojeIso = toIso(new Date())
  return diasSemana.map((dayName, i) => {
    const d = new Date(dom)
    d.setDate(d.getDate() + i)
    const iso = toIso(d)
    const evs = eventos.value
      .filter((e) => e.data_inicio.slice(0, 10) === iso)
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
    return { dia: d.getDate(), iso, hoje: iso === hojeIso, dayName, eventos: evs }
  })
})

// ── Células do mês ──────────────────────────────────────────
const celulas = computed(() => {
  const ano = diaBase.value.getFullYear()
  const mes = diaBase.value.getMonth() + 1
  const primeiro = new Date(ano, mes - 1, 1)
  const diaInicial = primeiro.getDay()
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const hojeIso = toIso(new Date())

  type Cell = { dia: number; iso: string; outro: boolean; hoje: boolean; eventos: EventoCalendario[] }
  const cells: Cell[] = []

  const diasMesAnt = new Date(ano, mes - 1, 0).getDate()
  for (let i = diaInicial - 1; i >= 0; i--) {
    const dia = diasMesAnt - i
    const mesPrev = mes === 1 ? 12 : mes - 1
    const anoPrev = mes === 1 ? ano - 1 : ano
    const iso = `${anoPrev}-${String(mesPrev).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    cells.push({ dia, iso, outro: true, hoje: false, eventos: [] })
  }
  for (let d = 1; d <= diasNoMes; d++) {
    const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ dia: d, iso, outro: false, hoje: iso === hojeIso, eventos: [] })
  }
  while (cells.length % 7 !== 0) {
    const ultIdx = cells.length
    const mesProx = mes === 12 ? 1 : mes + 1
    const anoProx = mes === 12 ? ano + 1 : ano
    const dia = ultIdx - (diaInicial + diasNoMes) + 1
    const iso = `${anoProx}-${String(mesProx).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    cells.push({ dia, iso, outro: true, hoje: false, eventos: [] })
  }

  for (const e of eventos.value) {
    const iso = e.data_inicio.slice(0, 10)
    const cell = cells.find((c) => c.iso === iso)
    if (cell) cell.eventos.push(e)
  }
  cells.forEach((c) => c.eventos.sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)))
  return cells
})

// ── Painel lateral (mensal) ─────────────────────────────────
const eventosDoDia = computed(() => {
  return eventos.value
    .filter((e) => e.data_inicio.slice(0, 10) === diaSelecionadoIso.value)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
})

const diaSelecionadoTexto = computed(() => {
  const d = new Date(diaSelecionadoIso.value + 'T00:00:00')
  return {
    weekday: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.getDay()],
    dia: d.getDate(),
    mes: `${mesesNomes[d.getMonth()]} ${d.getFullYear()}`,
  }
})

// ── Helpers ─────────────────────────────────────────────────
function horarioTexto(e: EventoCalendario) {
  const ini = e.data_inicio.includes('T') ? e.data_inicio.slice(11, 16) : null
  const fim = e.data_fim?.includes('T') ? e.data_fim.slice(11, 16) : null
  if (ini && fim) return `${ini} – ${fim}`
  if (ini) return ini
  return 'Dia inteiro'
}

function inicioSemana(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  r.setDate(r.getDate() - r.getDay()) // domingo
  return r
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function abrirCadastroEm(iso: string) {
  dataNovoEvento.value = iso
  abrirCadastro.value = true
}

function editar(e: EventoCalendario) {
  eventoEditando.value = e
}

// Clicar em qualquer evento abre o detalhe (mostra turmas/atletas vinculados).
function abrirDetalhe(e: EventoCalendario) {
  eventoDetalhe.value = e
}

// "Editar" dentro do detalhe → fecha o detalhe e abre o formulário.
function onEditarDoDetalhe(e: EventoCalendario) {
  eventoDetalhe.value = null
  eventoEditando.value = e
}

function fechar() {
  abrirCadastro.value = false
  eventoEditando.value = null
  dataNovoEvento.value = null
}

function onSalvo() {
  fechar()
  carregar()
}
</script>
