<template>
  <div class="space-y-4 animate-fade-in">

    <!-- ── Header ───────────────────────────────────────────── -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Atletas</h1>
        <p class="page-description">
          <span class="font-semibold text-slate-700 dark:text-slate-300">{{ filtrados.length }}</span>
          de {{ todos.length }} ·
          <span :class="limiteEval.perto || !limiteEval.podeCriar ? 'text-amber-600 font-semibold' : ''">
            {{ totalAtivos }}{{ limiteEval.limite !== null ? ` / ${limiteEval.limite}` : '' }} ativos no plano {{ nomePlano(clube?.plano) }}
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
          v-if="temPermissao('atletas', 'editar')"
          class="px-3 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="!limiteEval.podeCriar"
          :title="limiteEval.mensagem ?? ''"
          @click="abrirNovo = true"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo atleta
        </button>
      </div>
    </div>

    <!-- Aviso de limite -->
    <div v-if="limiteEval.mensagem" class="px-4 py-2.5 rounded-lg flex items-center gap-2.5"
         :class="limiteEval.podeCriar ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'">
      <svg class="w-4 h-4 shrink-0" :class="limiteEval.podeCriar ? 'text-amber-600' : 'text-red-600'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
      </svg>
      <p class="text-sm font-medium" :class="limiteEval.podeCriar ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'">
        {{ limiteEval.mensagem }}
      </p>
      <NuxtLink to="/configuracoes#assinatura" class="ml-auto text-xs font-bold underline shrink-0">
        Fazer upgrade →
      </NuxtLink>
    </div>

    <!-- ── Filtros ──────────────────────────────────────────── -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[220px]">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar por nome, apelido ou CPF..."
            class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <select v-model="filtroStatus" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium text-slate-700 dark:text-slate-300">
          <option value="">Todos os status</option>
          <option value="titular">Titular</option>
          <option value="novato">Novato</option>
          <option value="selecionado">Selecionado</option>
          <option value="afastado">Afastado</option>
        </select>

        <select v-model="filtroSaude" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium text-slate-700 dark:text-slate-300">
          <option value="">Saúde — todas</option>
          <option value="saudavel">Saudável</option>
          <option value="lesionado">Lesionado</option>
          <option value="em_recuperacao">Em recuperação</option>
        </select>

        <select v-model="filtroTurma" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm font-medium text-slate-700 dark:text-slate-300">
          <option value="">Turma — todas</option>
          <option v-for="t in turmas" :key="t.id" :value="t.id">{{ t.nome }}</option>
        </select>

        <label class="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 ml-1">
          <input v-model="incluirInativos" type="checkbox" class="rounded w-3.5 h-3.5"/>
          Incluir inativos
        </label>

        <button v-if="filtrosAtivos" class="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white ml-auto px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </div>

    <!-- ── Conteúdo ─────────────────────────────────────────── -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div v-for="i in 8" :key="i" class="skeleton h-32 rounded-xl"/>
    </div>

    <UiEmptyState
      v-else-if="filtrados.length === 0 && todos.length === 0"
      title="Sem atletas ainda"
      description="Cadastre seu primeiro atleta para começar."
    />
    <UiEmptyState
      v-else-if="filtrados.length === 0"
      title="Nenhum atleta encontrado"
      description="Tente ajustar os filtros ou limpar a busca."
    />

    <!-- Grid -->
    <div v-else-if="vista === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <AtletasCard
        v-for="a in filtrados"
        :key="a.id"
        :atleta="a"
        @click="abrirDetalhe(a)"
      />
    </div>

    <!-- Tabela -->
    <div v-else class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-gray-200 dark:border-white/[0.10] overflow-hidden shadow-card">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
            <tr class="text-xs uppercase tracking-wider">
              <th class="text-left px-5 py-3 font-bold text-slate-500 dark:text-slate-400">
                <button type="button" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" @click="toggleSort('nome')">
                  Atleta <SortIcon :state="sortState('nome')" />
                </button>
              </th>
              <th class="text-left px-3 py-3 font-bold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                <button type="button" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" @click="toggleSort('posicao')">
                  Posição <SortIcon :state="sortState('posicao')" />
                </button>
              </th>
              <th class="text-left px-3 py-3 font-bold text-slate-500 dark:text-slate-400">
                <button type="button" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" @click="toggleSort('status')">
                  Status <SortIcon :state="sortState('status')" />
                </button>
              </th>
              <th class="text-left px-3 py-3 font-bold text-slate-500 dark:text-slate-400">Saúde</th>
              <th class="text-left px-3 py-3 font-bold text-slate-500 dark:text-slate-400 hidden lg:table-cell">Responsável</th>
              <th class="px-3 py-3"/>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-for="a in filtrados" :key="a.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors group" @click="abrirDetalhe(a)">
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <UiAvatar :src="a.foto_url" :nome="a.nome" size="sm" />
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900 dark:text-white truncate">
                      {{ a.nome }}
                      <span v-if="a.numero_camisa" class="text-slate-400 font-normal"> #{{ a.numero_camisa }}</span>
                    </p>
                    <p class="text-xs text-slate-400 truncate">{{ a.apelido ?? formatCpfMascarado(a.cpf) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">{{ a.posicao ?? '—' }}</td>
              <td class="px-3 py-3">
                <UiStatusBadge :variant="a.status" />
              </td>
              <td class="px-3 py-3">
                <UiStatusBadge :variant="a.saude" dot />
              </td>
              <td class="px-3 py-3 text-slate-500 hidden lg:table-cell">{{ a.telefone_responsavel ?? '—' }}</td>
              <td class="px-3 py-3 text-right">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-700 dark:bg-white/[0.05] dark:text-slate-300 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-300 transition-colors">
                  Ver
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ver mais -->
    <div v-if="!loading && temMais" class="flex justify-center pt-2">
      <button
        :disabled="carregandoMais"
        class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-elevated-dark border border-slate-200 dark:border-white/[0.10] hover:bg-slate-50 dark:hover:bg-white/[0.05] disabled:opacity-50 transition-colors"
        @click="verMais"
      >
        {{ carregandoMais ? 'Carregando...' : 'Ver mais' }}
      </button>
    </div>

    <!-- ── Modais ──────────────────────────────────────────── -->
    <AtletasNovoModal
      :open="abrirNovo"
      :slug="clube?.slug ?? ''"
      @close="abrirNovo = false"
      @manual="abrirNovo = false; abrirCadastro = true"
    />
    <AtletasFormModal
      v-if="abrirCadastro"
      :turmas="turmas"
      @close="abrirCadastro = false"
      @salvo="onSalvo"
    />
    <AtletasDetalheDrawer
      v-if="atletaSelecionado"
      :atleta="atletaSelecionado"
      :turmas="turmas"
      @close="atletaSelecionado = null"
      @atualizado="onSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCpfMascarado } from '~/utils/format'
import { nomePlano, type Atleta, type AtletaStatus, type AtletaSaude, type Turma } from '~/types'

definePageMeta({ layout: 'default' })
useHead({ title: 'Atletas — Athletto' })

const { clube, temPermissao } = useAuth()
const atletasComp = useAtletas()
const turmasComp = useTurmas()
const planos = usePlanoLimites()

const loading = ref(true)
const todos = ref<Atleta[]>([])
const turmas = ref<Turma[]>([])
const vista = ref<'grid' | 'tabela'>('grid')

// Paginação: carrega em blocos para não puxar todos os atletas de uma vez
const BLOCO = 50
const carregandoMais = ref(false)
const temMais = ref(true)

const busca = ref('')
const filtroStatus = ref<AtletaStatus | ''>('')
const filtroSaude = ref<AtletaSaude | ''>('')
const filtroTurma = ref('')
const incluirInativos = ref(false)

const abrirNovo = ref(false)
const abrirCadastro = ref(false)
const atletaSelecionado = ref<Atleta | null>(null)

async function carregar() {
  loading.value = true
  const [a, t, total] = await Promise.all([
    atletasComp.listar({ incluir_inativos: true, limite: BLOCO, offset: 0 }),
    turmasComp.listar(),
    atletasComp.contarAtivos(),
  ])
  const lista = a.data ?? []
  todos.value = lista
  turmas.value = t.data ?? []
  totalAtivos.value = total
  temMais.value = lista.length === BLOCO
  loading.value = false
}

async function verMais() {
  if (carregandoMais.value || !temMais.value) return
  carregandoMais.value = true
  const { data } = await atletasComp.listar({
    incluir_inativos: true,
    limite: BLOCO,
    offset: todos.value.length,
  })
  const novos = data ?? []
  todos.value = [...todos.value, ...novos]
  temMais.value = novos.length === BLOCO
  carregandoMais.value = false
}

onMounted(carregar)

const ativos = computed(() => todos.value.filter((a) => a.ativo))
// total exato (count no servidor), independente da paginação da lista
const totalAtivos = ref(0)
const limiteEval = computed(() => planos.avaliarAtletas(totalAtivos.value))

const filtrosAtivos = computed(() =>
  !!busca.value || !!filtroStatus.value || !!filtroSaude.value || !!filtroTurma.value || incluirInativos.value,
)

type SortKey = 'nome' | 'posicao' | 'status'
type SortDir = 'asc' | 'desc'
const sortBy = ref<SortKey>('nome')
const sortDir = ref<SortDir>('asc')

function toggleSort(key: SortKey) {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortDir.value = 'asc'
  }
}
function sortState(key: SortKey): 'asc' | 'desc' | 'none' {
  if (sortBy.value !== key) return 'none'
  return sortDir.value
}

const filtrados = computed(() => {
  let lista = incluirInativos.value ? todos.value : todos.value.filter((a) => a.ativo)
  if (filtroStatus.value) lista = lista.filter((a) => a.status === filtroStatus.value)
  if (filtroSaude.value) lista = lista.filter((a) => a.saude === filtroSaude.value)
  if (filtroTurma.value) {
    const atletasNaTurma = new Set(
      atletasNaTurmaMap.value.get(filtroTurma.value) ?? [],
    )
    lista = lista.filter((a) => atletasNaTurma.has(a.id))
  }
  if (busca.value) {
    const q = busca.value.toLowerCase()
    lista = lista.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        (a.apelido ?? '').toLowerCase().includes(q) ||
        a.cpf.includes(q),
    )
  }
  const sorted = [...lista].sort((a, b) => {
    const k = sortBy.value
    const va = (a[k] ?? '').toString().toLowerCase()
    const vb = (b[k] ?? '').toString().toLowerCase()
    if (va === vb) return 0
    return va > vb ? 1 : -1
  })
  return sortDir.value === 'asc' ? sorted : sorted.reverse()
})

// Map turma_id → atleta_ids (carregado sob demanda quando o filtro muda)
const atletasNaTurmaMap = ref(new Map<string, string[]>())
watch(filtroTurma, async (t) => {
  if (!t || atletasNaTurmaMap.value.has(t)) return
  const vinculos = await atletasComp.listarVinculosPorTurmas([t])
  atletasNaTurmaMap.value.set(t, vinculos.get(t) ?? [])
})

function limparFiltros() {
  busca.value = ''
  filtroStatus.value = ''
  filtroSaude.value = ''
  filtroTurma.value = ''
  incluirInativos.value = false
}

function abrirDetalhe(a: Atleta) {
  atletaSelecionado.value = a
}

async function onSalvo() {
  abrirCadastro.value = false
  atletaSelecionado.value = null
  await carregar()
}

const SortIcon = defineComponent({
  props: { state: { type: String, default: 'none' } },
  setup(props) {
    return () => h('svg', {
      class: 'w-3 h-3 opacity-60',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('polyline', {
        points: '8 6 12 2 16 6',
        class: props.state === 'asc' ? 'opacity-100' : 'opacity-40',
      }),
      h('polyline', {
        points: '8 18 12 22 16 18',
        class: props.state === 'desc' ? 'opacity-100' : 'opacity-40',
      }),
    ])
  },
})
</script>
