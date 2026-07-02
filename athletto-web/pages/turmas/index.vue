<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Turmas</h1>
        <p class="page-description">
          <span class="font-semibold text-slate-700 dark:text-slate-300">{{ filtradas.length }}</span>
          de {{ turmas.length }} ·
          <span :class="limiteEval.perto || !limiteEval.podeCriar ? 'text-amber-600 font-semibold' : ''">
            {{ ativas.length }}{{ limiteEval.limite !== null ? ` / ${limiteEval.limite}` : '' }} ativas no plano {{ nomePlano(clube?.plano) }}
          </span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Toggle vista -->
        <div class="inline-flex rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-elevated-dark p-0.5">
          <button
            class="px-2.5 py-1 rounded text-xs font-semibold transition-colors"
            :class="vista === 'grid' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            @click="vista = 'grid'"
          >Grid</button>
          <button
            class="px-2.5 py-1 rounded text-xs font-semibold transition-colors"
            :class="vista === 'tabela' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            @click="vista = 'tabela'"
          >Tabela</button>
        </div>

        <button
          v-if="temPermissao('turmas', 'editar')"
          class="px-3 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors"
          :disabled="!limiteEval.podeCriar"
          :title="limiteEval.mensagem ?? ''"
          @click="abrirCadastro = true"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova turma
        </button>
      </div>
    </div>

    <!-- Aviso limite -->
    <div v-if="limiteEval.mensagem" class="px-4 py-2.5 rounded-lg flex items-center gap-2.5"
         :class="limiteEval.podeCriar ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'">
      <svg class="w-4 h-4 shrink-0" :class="limiteEval.podeCriar ? 'text-amber-600' : 'text-red-600'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
      <p class="text-sm font-medium" :class="limiteEval.podeCriar ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'">
        {{ limiteEval.mensagem }}
      </p>
      <NuxtLink to="/configuracoes#assinatura" class="ml-auto text-xs font-bold underline shrink-0">
        Fazer upgrade →
      </NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[220px]">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar por nome, local ou descrição..."
            class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <select v-model="filtroStatus" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium text-slate-700 dark:text-slate-300">
          <option value="">Todos os status</option>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
        </select>

        <button
          v-if="busca || filtroStatus"
          class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          @click="busca = ''; filtroStatus = ''"
        >
          Limpar
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="i in 6" :key="i" class="skeleton h-40 rounded-xl"/>
    </div>

    <!-- Empty total -->
    <UiEmptyState
      v-else-if="turmas.length === 0"
      title="Sem turmas ainda"
      description="Crie sua primeira turma para começar a registrar frequência e organizar cobranças."
    />

    <!-- Empty filtro -->
    <UiEmptyState
      v-else-if="filtradas.length === 0"
      title="Nenhuma turma encontrada"
      description="Tente ajustar o filtro ou a busca."
    />

    <!-- GRID -->
    <div v-else-if="vista === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <TurmasCard
        v-for="t in filtradas"
        :key="t.id"
        :turma="t"
        @editar="editar(t)"
        @vincular="vincular(t)"
      />
    </div>

    <!-- TABELA -->
    <div v-else class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-200 dark:border-white/[0.06]">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
              @click="sortBy('nome')"
            >
              <span class="inline-flex items-center gap-1">Nome <SortIcon field="nome" :sort-field="sortField" :sort-asc="sortAsc" /></span>
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500">Dias</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500">Horário</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500">Local</th>
            <th
              class="px-4 py-3 text-center text-xs font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
              @click="sortBy('atletas')"
            >
              <span class="inline-flex items-center justify-center gap-1">Atletas <SortIcon field="atletas" :sort-field="sortField" :sort-asc="sortAsc" /></span>
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
              @click="sortBy('mensalidade')"
            >
              <span class="inline-flex items-center justify-end gap-1">Mensalidade <SortIcon field="mensalidade" :sort-field="sortField" :sort-asc="sortAsc" /></span>
            </th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500">Status</th>
            <th class="px-4 py-3 w-[80px]"/>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <tr
            v-for="t in filtradas"
            :key="t.id"
            class="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
            @click="$router.push(`/turmas/${t.id}`)"
          >
            <td class="px-4 py-3">
              <p class="font-semibold text-slate-900 dark:text-white">{{ t.nome }}</p>
              <p v-if="t.descricao" class="text-xs text-slate-500 truncate max-w-[220px]">{{ t.descricao }}</p>
            </td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ formatDiasSemana(t.dias_semana) }}</td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{{ formatHorario(t.horario_inicio, t.horario_fim) }}</td>
            <td class="px-4 py-3 text-slate-500 text-xs">{{ t.local || '—' }}</td>
            <td class="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">{{ t.total_atletas ?? 0 }}</td>
            <td class="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
              R$ {{ (t.valor_mensalidade_padrao ?? 0).toFixed(0) }}/mês
            </td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="t.ativo ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'"
              >{{ t.ativo ? 'Ativa' : 'Inativa' }}</span>
            </td>
            <td class="px-4 py-3" @click.stop>
              <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  @click="vincular(t)"
                >Vincular</button>
                <button
                  class="text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  @click="editar(t)"
                >Editar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modais -->
    <TurmasFormModal
      v-if="abrirCadastro || turmaEditando"
      :turma="turmaEditando"
      @close="fecharForm"
      @salvo="onSalvo"
    />
    <TurmasAtletasDrawer
      v-if="turmaVinculando"
      :turma="turmaVinculando"
      @close="turmaVinculando = null"
      @atualizado="onSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'
import { formatDiasSemana, formatHorario } from '~/utils/format'
import { nomePlano, type Turma } from '~/types'

definePageMeta({ layout: 'default' })
useHead({ title: 'Turmas — Athletto' })

const { clube, temPermissao } = useAuth()
const turmasComp = useTurmas()
const planos = usePlanoLimites()
const router = useRouter()

const loading = ref(true)
const turmas = ref<(Turma & { total_atletas?: number })[]>([])
const abrirCadastro = ref(false)
const turmaEditando = ref<Turma | null>(null)
const turmaVinculando = ref<Turma | null>(null)

const vista = ref<'grid' | 'tabela'>('grid')
const busca = ref('')
const buscaDebounced = useDebouncedRef(busca, 400)
const filtroStatus = ref('')
const sortField = ref<'nome' | 'atletas' | 'mensalidade' | null>(null)
const sortAsc = ref(true)

async function carregar() {
  loading.value = true
  const { data } = await turmasComp.listar()
  turmas.value = data ?? []
  loading.value = false
}
onMounted(carregar)

const ativas = computed(() => turmas.value.filter((t) => t.ativo))
const limiteEval = computed(() => planos.avaliarTurmas(ativas.value.length))

const filtradas = computed(() => {
  let list = turmas.value
  const q = buscaDebounced.value.trim().toLowerCase()
  if (q) {
    list = list.filter((t) =>
      t.nome.toLowerCase().includes(q) ||
      (t.descricao ?? '').toLowerCase().includes(q) ||
      (t.local ?? '').toLowerCase().includes(q),
    )
  }
  if (filtroStatus.value === 'ativa') list = list.filter((t) => t.ativo)
  if (filtroStatus.value === 'inativa') list = list.filter((t) => !t.ativo)

  if (sortField.value) {
    const field = sortField.value
    list = [...list].sort((a, b) => {
      let va: string | number = 0
      let vb: string | number = 0
      if (field === 'nome') { va = a.nome.toLowerCase(); vb = b.nome.toLowerCase() }
      if (field === 'atletas') { va = a.total_atletas ?? 0; vb = b.total_atletas ?? 0 }
      if (field === 'mensalidade') { va = a.valor_mensalidade_padrao ?? 0; vb = b.valor_mensalidade_padrao ?? 0 }
      if (va < vb) return sortAsc.value ? -1 : 1
      if (va > vb) return sortAsc.value ? 1 : -1
      return 0
    })
  }
  return list
})

function sortBy(field: 'nome' | 'atletas' | 'mensalidade') {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
}

function editar(t: Turma) { turmaEditando.value = t }
function vincular(t: Turma) { turmaVinculando.value = t }
function fecharForm() { abrirCadastro.value = false; turmaEditando.value = null }
function onSalvo() { fecharForm(); turmaVinculando.value = null; carregar() }

const SortIcon = defineComponent({
  props: { field: String, sortField: String, sortAsc: Boolean },
  setup(props) {
    return () => {
      const active = props.sortField === props.field
      return h('svg', {
        class: `w-3 h-3 transition-colors ${active ? 'text-brand-600' : 'text-slate-300 dark:text-white/20'}`,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }, [
        h('polyline', { points: active && !props.sortAsc ? '6 15 12 9 18 15' : '6 9 12 15 18 9' }),
      ])
    }
  },
})
</script>
