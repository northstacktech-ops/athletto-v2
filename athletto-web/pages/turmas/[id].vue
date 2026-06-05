<template>
  <div v-if="loading" class="space-y-4 animate-fade-in">
    <div class="skeleton h-10 w-40 rounded-lg" />
    <div class="skeleton h-[420px] rounded-xl" />
  </div>

  <UiEmptyState
    v-else-if="!turma"
    title="Turma não encontrada"
    description="Verifique o link ou volte à lista."
  />

  <div v-else class="space-y-4 animate-fade-in">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm">
      <NuxtLink to="/turmas" class="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-1">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Turmas
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <span class="text-slate-900 dark:text-white font-semibold truncate">{{ turma.nome }}</span>
    </div>

    <!-- Header -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] shadow-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-900 text-white shrink-0">
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ turma.nome }}</h1>
        <p v-if="turma.descricao" class="text-sm text-slate-500 mt-0.5">{{ turma.descricao }}</p>
        <div class="flex items-center gap-3 text-xs text-slate-500 flex-wrap mt-2">
          <span class="inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            {{ formatDiasSemana(turma.dias_semana) }}
          </span>
          <span class="inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ formatHorario(turma.horario_inicio, turma.horario_fim) }}
          </span>
          <span v-if="turma.local" class="inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ turma.local }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]" @click="abrirEdicao = true">
          Editar turma
        </button>
        <NuxtLink :to="`/frequencia?turma=${turma.id}`" class="px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
          Registrar frequência
        </NuxtLink>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <UiKpiPastel
        tone="violet"
        label="Atletas"
        :value="atletasDaTurma.length"
        :delta="`${bolsistas} com bolsa`"
      />
      <UiKpiPastel
        tone="brand"
        label="Mensalidade padrão"
        :value="`R$ ${(turma.valor_mensalidade_padrao ?? 0).toFixed(0)}`"
        delta="Valor base"
      />
      <UiKpiPastel
        tone="emerald"
        label="Receita estimada"
        :value="formatCurrency(receitaEstimada)"
        :delta="`Média ${formatCurrency(mensalidadeMedia)} / atleta`"
      />
      <UiKpiPastel
        :tone="freqTone"
        label="Presença média"
        :value="presencaMedia === null ? '—' : `${presencaMedia}%`"
        :delta="atletasEmAlerta > 0 ? `${atletasEmAlerta} em alerta` : 'Sem alertas'"
        :trend="atletasEmAlerta > 0 ? 'down' : 'up'"
      />
    </div>

    <!-- Tabs -->
    <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] shadow-card overflow-hidden">
      <div class="px-4 pt-4">
        <UiTabsPill v-model="aba" :tabs="tabs" />
      </div>

      <div class="p-6">
        <!-- VISÃO -->
        <div v-if="aba === 'visao'" class="space-y-6">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-slate-400 text-xs">Dias da semana</dt>
              <dd class="font-semibold text-slate-900 dark:text-white">{{ formatDiasSemana(turma.dias_semana) }}</dd>
            </div>
            <div>
              <dt class="text-slate-400 text-xs">Horário</dt>
              <dd class="font-semibold text-slate-900 dark:text-white">{{ formatHorario(turma.horario_inicio, turma.horario_fim) }}</dd>
            </div>
            <div v-if="turma.local">
              <dt class="text-slate-400 text-xs">Local</dt>
              <dd class="font-semibold text-slate-900 dark:text-white">{{ turma.local }}</dd>
            </div>
            <div>
              <dt class="text-slate-400 text-xs">Criada em</dt>
              <dd class="font-semibold text-slate-900 dark:text-white">{{ formatDate(turma.criado_em.slice(0, 10)) }}</dd>
            </div>
            <div>
              <dt class="text-slate-400 text-xs">Mensalidade padrão</dt>
              <dd class="font-semibold text-slate-900 dark:text-white">R$ {{ (turma.valor_mensalidade_padrao ?? 0).toFixed(2).replace('.', ',') }} / mês</dd>
            </div>
            <div>
              <dt class="text-slate-400 text-xs">Status</dt>
              <dd class="font-semibold" :class="turma.ativo ? 'text-emerald-600' : 'text-slate-500'">
                {{ turma.ativo ? 'Ativa' : 'Inativa' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- ATLETAS -->
        <div v-else-if="aba === 'atletas'">
          <div v-if="atletasDaTurma.length === 0" class="text-center py-12">
            <p class="text-sm text-slate-400">Nenhum atleta vinculado.</p>
          </div>
          <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <li v-for="a in atletasDaTurma" :key="a.id" class="py-3 flex items-center gap-3">
              <UiAvatar :src="a.foto_url" :nome="a.nome" :numero="a.numero_camisa" size="md" />
              <div class="flex-1 min-w-0">
                <NuxtLink :to="`/atletas/${a.id}`" class="font-semibold text-sm text-slate-900 dark:text-white hover:underline truncate block">{{ a.nome }}</NuxtLink>
                <p class="text-xs text-slate-500">{{ a.posicao ?? 'Sem posição' }} · {{ a.status }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-slate-900 dark:text-white">R$ {{ valorAtleta(a).toFixed(0) }}</p>
                <p v-if="a.valor_mensalidade !== null && a.valor_mensalidade !== undefined" class="text-xs font-semibold text-amber-600">PERSONALIZADO</p>
                <p v-else class="text-xs text-slate-400">padrão</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- FREQUÊNCIA -->
        <div v-else-if="aba === 'frequencia'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UiKpiPastel
              :tone="freqTone"
              label="Presença média"
              :value="presencaMedia === null ? '—' : `${presencaMedia}%`"
            />
            <UiKpiPastel
              tone="brand"
              label="Treinos registrados"
              :value="datasRegistradas.length"
            />
            <UiKpiPastel
              tone="amber"
              label="Em alerta"
              :value="atletasEmAlerta"
              :delta="atletasEmAlerta > 0 ? '3 faltas seguidas' : 'Tudo ok'"
              :trend="atletasEmAlerta > 0 ? 'down' : 'up'"
            />
          </div>

          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Últimos treinos</h3>
            <p v-if="datasRegistradas.length === 0" class="text-sm text-slate-400 italic">Nenhuma frequência registrada ainda.</p>
            <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
              <li v-for="d in datasRegistradas.slice(0, 8)" :key="d.data" class="py-2.5 flex items-center justify-between text-sm">
                <span class="font-semibold text-slate-900 dark:text-white">{{ formatDate(d.data) }}</span>
                <span class="text-slate-500">{{ d.presentes }}/{{ d.total }} presentes</span>
                <span class="font-bold" :class="d.percent >= 80 ? 'text-emerald-600' : d.percent >= 60 ? 'text-amber-600' : 'text-red-600'">
                  {{ d.percent }}%
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- FINANCEIRO -->
        <div v-else-if="aba === 'financeiro'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UiKpiPastel
              tone="emerald"
              label="Receita mensal estimada"
              :value="formatCurrency(receitaEstimada)"
              :delta="`${atletasDaTurma.length} atletas`"
            />
            <UiKpiPastel
              tone="amber"
              label="Bolsas ativas"
              :value="bolsistas"
              delta="Valor personalizado"
            />
            <UiKpiPastel
              tone="brand"
              label="Mensalidade média"
              :value="formatCurrency(mensalidadeMedia)"
              delta="Por atleta"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Mensalidades por atleta</h3>
              <p class="text-xs text-slate-400">Padrão da turma: <span class="font-semibold text-slate-600 dark:text-slate-300">R$ {{ (turma.valor_mensalidade_padrao ?? 0).toFixed(2).replace('.', ',') }}</span></p>
            </div>

            <p v-if="atletasDaTurma.length === 0" class="text-sm text-slate-400 italic">Vincule atletas para ver a estimativa de receita.</p>

            <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
              <li v-for="a in atletasDaTurma" :key="a.id">
                <!-- Linha normal -->
                <div v-if="editandoAtletaId !== a.id" class="py-3 flex items-center gap-3">
                  <UiAvatar :src="a.foto_url" :nome="a.nome" :numero="a.numero_camisa" size="sm" />
                  <div class="flex-1 min-w-0">
                    <NuxtLink :to="`/atletas/${a.id}`" class="text-sm font-medium text-slate-900 dark:text-white hover:underline truncate block">{{ a.nome }}</NuxtLink>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span v-if="a.valor_mensalidade === 0"
                        class="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                        Bolsa integral
                      </span>
                      <span v-else-if="a.valor_mensalidade !== null && a.valor_mensalidade !== undefined"
                        class="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                        Taxa pessoal
                      </span>
                      <span v-else class="text-xs text-slate-400">Padrão da turma</span>
                    </div>
                  </div>
                  <p class="text-sm font-bold text-slate-900 dark:text-white shrink-0">R$ {{ valorAtleta(a).toFixed(2).replace('.', ',') }}</p>
                  <button
                    class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    title="Editar mensalidade"
                    @click="abrirEdicaoAtleta(a)">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>

                <!-- Linha de edição inline -->
                <div v-else class="py-3 space-y-3 bg-slate-50 dark:bg-white/[0.02] -mx-6 px-6 border-y border-brand-200 dark:border-brand-500/30">
                  <div class="flex items-center gap-2">
                    <UiAvatar :src="a.foto_url" :nome="a.nome" :numero="a.numero_camisa" size="sm" />
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ a.nome }}</p>
                  </div>

                  <!-- Input de valor -->
                  <div class="flex items-end gap-3 flex-wrap">
                    <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Valor personalizado</label>
                      <div class="relative w-40">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">R$</span>
                        <input
                          v-model.number="novoValorEditando"
                          type="number" min="0" step="0.01"
                          class="form-input pl-9 text-sm py-1.5"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <!-- Atalhos -->
                    <div class="flex flex-wrap gap-2 pb-0.5">
                      <button type="button"
                        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        :disabled="savingValor"
                        @click="salvarValorAtleta(a.id, 'padrao')">
                        Padrão turma
                      </button>
                      <button type="button"
                        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 transition-colors"
                        :disabled="savingValor"
                        @click="salvarValorAtleta(a.id, 'isento')">
                        Isentar (R$ 0)
                      </button>
                    </div>
                  </div>

                  <!-- Ações -->
                  <div class="flex items-center gap-2">
                    <button type="button"
                      class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors"
                      :disabled="savingValor"
                      @click="salvarValorAtleta(a.id, 'valor')">
                      {{ savingValor ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button type="button"
                      class="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors"
                      :disabled="savingValor"
                      @click="editandoAtletaId = null">
                      Cancelar
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- CONFIGURAR -->
        <div v-else-if="aba === 'configurar'" class="space-y-4">
          <p class="text-sm text-slate-500">Use o botão abaixo para abrir o formulário completo com todos os campos da turma (nome, dias, horário, local, mensalidade padrão).</p>
          <button
            class="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white"
            @click="abrirEdicao = true"
          >
            Editar dados da turma
          </button>
          <hr class="border-slate-200 dark:border-white/[0.06]"/>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Zona de perigo</h3>
            <p class="text-xs text-slate-500 mb-3">Desativar a turma irá desvincular todos os atletas. A operação pode ser revertida reativando manualmente.</p>
            <button
              v-if="turma.ativo"
              class="px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
              @click="desativar"
            >
              Desativar turma
            </button>
          </div>
        </div>
      </div>
    </div>

    <TurmasFormModal
      v-if="abrirEdicao"
      :turma="turma"
      @close="abrirEdicao = false"
      @salvo="onSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import { formatDiasSemana, formatHorario, formatDate, formatCurrency } from '~/utils/format'
import type { Turma, Atleta, Frequencia } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const turmasComp = useTurmas()
const atletasComp = useAtletas()
const freqComp = useFrequencia()
const toast = useToast()

// ── Edição inline de mensalidade por atleta (aba Financeiro) ─────────────────
const editandoAtletaId = ref<string | null>(null)
const novoValorEditando = ref(0)
const savingValor = ref(false)

function abrirEdicaoAtleta(a: Atleta) {
  novoValorEditando.value = valorAtleta(a)
  editandoAtletaId.value = a.id
}

async function salvarValorAtleta(atletaId: string, tipo: 'valor' | 'isento' | 'padrao') {
  savingValor.value = true
  try {
    const novoValor = tipo === 'valor' ? novoValorEditando.value
      : tipo === 'isento' ? 0
      : null
    await atletasComp.atualizar(atletaId, { valor_mensalidade: novoValor })
    // Atualiza o array local para refletir imediatamente sem recarregar
    const idx = atletasDaTurma.value.findIndex((a) => a.id === atletaId)
    if (idx !== -1) atletasDaTurma.value[idx] = { ...atletasDaTurma.value[idx], valor_mensalidade: novoValor }
    const label = tipo === 'padrao' ? 'Valor padrão da turma restaurado'
      : tipo === 'isento' ? 'Atleta isento (R$ 0,00)'
      : `Mensalidade atualizada para R$ ${novoValor!.toFixed(2)}`
    toast.success('Mensalidade atualizada', label)
    editandoAtletaId.value = null
  } catch (err: any) {
    toast.error('Erro ao salvar', err?.message ?? '')
  } finally {
    savingValor.value = false
  }
}

const turmaId = computed(() => route.params.id as string)

const loading = ref(true)
const turma = ref<(Turma & { total_atletas?: number }) | null>(null)
const atletasDaTurma = ref<Atleta[]>([])
const freqs = ref<Frequencia[]>([])
const abrirEdicao = ref(false)

const tabs = [
  { value: 'visao' as const, label: 'Visão geral' },
  { value: 'atletas' as const, label: 'Atletas' },
  { value: 'frequencia' as const, label: 'Frequência' },
  { value: 'financeiro' as const, label: 'Financeiro' },
  { value: 'configurar' as const, label: 'Configurar' },
]
type TabValue = typeof tabs[number]['value']
const hashToTab: Record<string, TabValue> = {
  '#visao': 'visao', '#atletas': 'atletas', '#frequencia': 'frequencia',
  '#financeiro': 'financeiro', '#configurar': 'configurar',
}
const aba = ref<TabValue>(hashToTab[route.hash] ?? 'visao')
watch(aba, (v) => router.replace({ hash: `#${v}` }))

async function carregar() {
  loading.value = true
  try {
    const tRes = await turmasComp.buscarPorId(turmaId.value)
    turma.value = tRes.data
    if (turma.value) {
      useHead({ title: `${turma.value.nome} — Atletto` })

      const atRes = await freqComp.atletasDaTurma(turma.value.id)
      atletasDaTurma.value = (atRes.data ?? []) as Atleta[]

      const fRes = await freqComp.historicoPorTurma(turma.value.id)
      freqs.value = (fRes.data ?? []) as Frequencia[]
    }
  } finally {
    loading.value = false
  }
}
onMounted(carregar)

const valorAtleta = (a: Atleta) =>
  (a.valor_mensalidade !== null && a.valor_mensalidade !== undefined)
    ? a.valor_mensalidade
    : (turma.value?.valor_mensalidade_padrao ?? 0)

const receitaEstimada = computed(() =>
  atletasDaTurma.value.reduce((s, a) => s + valorAtleta(a), 0),
)

const bolsistas = computed(() =>
  atletasDaTurma.value.filter((a) => a.valor_mensalidade !== null && a.valor_mensalidade !== undefined).length,
)

const mensalidadeMedia = computed(() => {
  if (atletasDaTurma.value.length === 0) return 0
  return receitaEstimada.value / atletasDaTurma.value.length
})

// Agrupa por data
const datasRegistradas = computed(() => {
  const map = new Map<string, { presentes: number; total: number }>()
  for (const f of freqs.value) {
    const cur = map.get(f.data) ?? { presentes: 0, total: 0 }
    cur.total += 1
    if (f.presente) cur.presentes += 1
    map.set(f.data, cur)
  }
  return Array.from(map.entries())
    .map(([data, v]) => ({ data, presentes: v.presentes, total: v.total, percent: Math.round((v.presentes / v.total) * 100) }))
    .sort((a, b) => b.data.localeCompare(a.data))
})

const presencaMedia = computed(() => {
  if (freqs.value.length === 0) return null
  return Math.round((freqs.value.filter((f) => f.presente).length / freqs.value.length) * 100)
})

const atletasEmAlerta = computed(() => {
  let count = 0
  for (const a of atletasDaTurma.value) {
    const meus = freqs.value.filter((f) => f.atleta_id === a.id)
    if (meus.length < 3) continue
    const ultimas3 = meus.sort((x, y) => y.data.localeCompare(x.data)).slice(0, 3)
    if (ultimas3.every((f) => !f.presente)) count++
  }
  return count
})

const freqColor = computed(() => {
  const v = presencaMedia.value
  if (v === null) return 'text-slate-400'
  if (v >= 80) return 'text-emerald-600'
  if (v >= 60) return 'text-amber-500'
  return 'text-red-500'
})

const freqTone = computed<'emerald' | 'amber' | 'rose' | 'slate'>(() => {
  const v = presencaMedia.value
  if (v === null) return 'slate'
  if (v >= 80) return 'emerald'
  if (v >= 60) return 'amber'
  return 'rose'
})

async function desativar() {
  if (!turma.value) return
  if (!window.confirm(`Desativar a turma "${turma.value.nome}"? Atletas serão desvinculados.`)) return
  try {
    await turmasComp.desativar(turma.value.id)
    toast.success('Turma desativada', 'Os dados históricos permanecem salvos.')
    router.push('/turmas')
  } catch (err: any) {
    toast.error('Falha ao desativar turma', err?.message ?? '')
  }
}

async function onSalvo() {
  abrirEdicao.value = false
  await carregar()
}
</script>
