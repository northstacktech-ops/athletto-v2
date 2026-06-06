<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full sm:max-w-2xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <!-- Header com steps -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Novo planejamento financeiro</h2>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ passo === 1 ? 'Defina o tipo e o valor base da cobrança' : passo === 2 ? 'Selecione as turmas para vincular atletas' : 'Revise e ajuste o valor por atleta' }}
              </p>
            </div>
            <button class="p-1 text-gray-400 hover:text-gray-600" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Indicador de etapas -->
          <div class="flex items-center gap-1 mt-3">
            <template v-for="(label, i) in ['Configuração', 'Turmas', 'Revisão']" :key="i">
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  :class="passo > i + 1 ? 'bg-emerald-500 text-white' : passo === i + 1 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'">
                  <svg v-if="passo > i + 1" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span class="text-xs font-medium" :class="passo === i + 1 ? 'text-slate-900 dark:text-white' : 'text-gray-400'">{{ label }}</span>
              </div>
              <div v-if="i < 2" class="flex-1 h-px bg-gray-200 dark:bg-white/10 mx-1"/>
            </template>
          </div>
        </div>

        <!-- Passo 1: Configuração -->
        <div v-if="passo === 1" class="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome do planejamento *</label>
            <input v-model="form.nome" required maxlength="80" class="form-input" placeholder="Ex: Mensalidade Junho 2026"/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <textarea v-model="form.descricao" rows="2" maxlength="200" class="form-input" placeholder="Observações sobre este planejamento..."/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo de cobrança</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                :class="form.tipo === 'recorrente' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-surface-canvas-dark text-gray-600 border-gray-200 dark:border-white/[0.10] hover:bg-gray-50'"
                @click="form.tipo = 'recorrente'">
                Recorrente
              </button>
              <button type="button" class="py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                :class="form.tipo === 'unico' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-surface-canvas-dark text-gray-600 border-gray-200 dark:border-white/[0.10] hover:bg-gray-50'"
                @click="form.tipo = 'unico'">
                Único
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Valor padrão por atleta *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">R$</span>
                <input v-model.number="form.valor" type="number" min="0" step="0.01" required class="form-input pl-9" placeholder="0,00"/>
              </div>
            </div>
            <div v-if="form.tipo === 'recorrente'">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Periodicidade</label>
              <select v-model="form.periodicidade" class="form-input">
                <option value="mensal">Mensal</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div v-else>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Data de vencimento</label>
              <input v-model="form.data_vencimento" type="date" class="form-input"/>
            </div>
          </div>

          <div v-if="form.tipo === 'recorrente'">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Dia de vencimento (1 – 28)</label>
            <input v-model.number="form.dia_vencimento" type="number" min="1" max="28" class="form-input"/>
          </div>
        </div>

        <!-- Passo 2: Selecionar turmas -->
        <div v-else-if="passo === 2" class="px-6 py-5 overflow-y-auto space-y-3">
          <p class="text-sm text-gray-500">Selecione as turmas. Todos os atletas ativos de cada turma serão vinculados automaticamente com o valor da mensalidade da turma como ponto de partida.</p>

          <div v-if="loadingTurmas" class="space-y-2">
            <div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg"/>
          </div>
          <div v-else class="space-y-2">
            <label v-for="t in turmasDisponiveis" :key="t.id"
              class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="form.turmaIds.includes(t.id)
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/10 dark:border-brand-500/50'
                : 'border-gray-200 dark:border-white/[0.10] hover:bg-gray-50 dark:hover:bg-white/[0.04]'">
              <input v-model="form.turmaIds" type="checkbox" :value="t.id" class="rounded w-4 h-4 accent-brand-600" @change="sincronizarAtletasDaTurma(t)"/>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ t.nome }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ t.total_atletas }} atleta(s) · R$ {{ t.valor_mensalidade_padrao?.toFixed(2) ?? '–' }}/mês</p>
              </div>
              <div v-if="form.turmaIds.includes(t.id)" class="shrink-0">
                <span class="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {{ atletasDaTurma(t.id).length }} vinculado(s)
                </span>
              </div>
            </label>
          </div>

          <div v-if="form.turmaIds.length === 0" class="text-center py-4 text-sm text-gray-400">
            Selecione ao menos uma turma para continuar
          </div>
        </div>

        <!-- Passo 3: Revisão de atletas -->
        <div v-else class="px-6 py-5 overflow-y-auto space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">{{ atletasRevisao.length }} atleta(s) · Ajuste individualmente se necessário</p>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Total: <span class="text-emerald-600">{{ formatCurrency(totalPrevisto) }}</span>
            </div>
          </div>

          <!-- Resumo por turma -->
          <div v-for="turmaId in form.turmaIds" :key="turmaId" class="space-y-1.5">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">
              {{ nomeDaTurma(turmaId) }}
            </p>
            <div v-for="item in atletasRevisao.filter(a => a.turma_id === turmaId)" :key="item.atleta_id"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark">

              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ iniciais(item.nome) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ item.nome }}</p>
                  <!-- Badge: taxa personalizada definida no perfil do atleta -->
                  <span v-if="item.valorAtleta !== null && item.valorAtleta > 0"
                    class="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                    Taxa pessoal
                  </span>
                  <span v-else-if="item.valorAtleta === 0"
                    class="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                    Bolsa integral
                  </span>
                </div>
                <p v-if="!item.isento" class="text-xs text-gray-400 mt-0.5">
                  {{ item.valorAtleta !== null && item.valorAtleta > 0 ? 'Taxa pessoal' : 'Base turma' }}:
                  R$ {{ (item.valorAtleta !== null && item.valorAtleta > 0 ? item.valorAtleta : item.valorTurma).toFixed(2) }}
                </p>
                <p v-else class="text-xs text-amber-500 font-semibold mt-0.5">Isento — sem cobrança</p>
              </div>

              <!-- Toggle isento -->
              <button type="button"
                class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border"
                :class="item.isento
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
                  : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-white/[0.04] dark:border-white/10 dark:text-gray-400 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'"
                @click="item.isento = !item.isento">
                <svg v-if="item.isento" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {{ item.isento ? 'Isento' : 'Isentar' }}
              </button>

              <!-- Valor customizável para este planejamento -->
              <div class="relative w-28 shrink-0">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R$</span>
                <input
                  v-model.number="item.valorCustom"
                  type="number" min="0" step="0.01"
                  :disabled="item.isento"
                  class="form-input pl-7 text-sm py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="item.valorCustom !== (item.valorAtleta ?? item.valorTurma) && !item.isento ? 'border-brand-400 ring-1 ring-brand-400/20' : ''"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer com ações -->
        <div class="px-6 py-3 border-t border-gray-100 dark:border-white/[0.07] flex justify-between items-center gap-2 bg-gray-50 dark:bg-white/[0.02] shrink-0">
          <button v-if="passo > 1" type="button" class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors" @click="passo--">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar
          </button>
          <span v-else/>

          <div class="flex gap-2">
            <button v-if="passo === 3" type="button" :disabled="loading" class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.10] hover:bg-gray-100 disabled:opacity-50 transition-colors" @click="salvarComo('inativo')">
              Salvar rascunho
            </button>
            <button v-if="passo < 3" type="button" :disabled="!podeProsseguir" class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" @click="passo++">
              Próximo
              <svg class="w-4 h-4 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button v-else type="button" :disabled="loading" class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors" @click="salvarComo('ativo')">
              {{ loading ? 'Ativando...' : 'Criar e Ativar cobranças' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'
import type { PlanejamentoTipo, Periodicidade, Turma, Atleta } from '~/types'
// Atleta is used in atletasPorTurma ref typing

const emit = defineEmits<{ (e: 'close'): void; (e: 'salvo'): void }>()

const fin = useFinanceiro()
const turmasComp = useTurmas()
const atletasComp = useAtletas()
const { clube } = useAuth()
const toast = useToast()

const loading = ref(false)
const loadingTurmas = ref(true)
const passo = ref(1)

const turmasList = ref<Turma[]>([])

onMounted(async () => {
  const { data } = await turmasComp.listar()
  turmasList.value = data ?? []
  loadingTurmas.value = false
})

type AtletaRevisao = {
  atleta_id: string
  nome: string
  turma_id: string
  valorTurma: number        // valor padrão da turma
  valorAtleta: number | null // valor_mensalidade do atleta (null = usa turma)
  valorCustom: number        // valor efetivo para este planejamento
  isento: boolean
}

const form = reactive({
  nome: '',
  descricao: '',
  tipo: 'recorrente' as PlanejamentoTipo,
  valor: 0 as number,
  periodicidade: 'mensal' as Periodicidade,
  dia_vencimento: 10,
  data_vencimento: new Date().toISOString().slice(0, 10),
  turmaIds: [] as string[],
})

const atletasRevisao = ref<AtletaRevisao[]>([])

// ── Dados de turmas disponíveis ───────────────────────────────────────────────
const turmasDisponiveis = computed(() => turmasList.value.filter((t) => t.ativo))

// ── Cache de atletas por turma ────────────────────────────────────────────────
const atletasPorTurma = ref<Record<string, Atleta[]>>({})

// ── Atletas vinculados a uma turma específica ─────────────────────────────────
function atletasDaTurma(turmaId: string): Atleta[] {
  return atletasPorTurma.value[turmaId] ?? []
}

// ── Sincronizar lista de revisão ao marcar/desmarcar turma ───────────────────
async function sincronizarAtletasDaTurma(turma: Turma) {
  const valorBase = turma.valor_mensalidade_padrao ?? form.valor

  if (form.turmaIds.includes(turma.id)) {
    // Carrega atletas da turma via composable (pega novos vínculos também)
    if (!atletasPorTurma.value[turma.id]) {
      const { data } = await atletasComp.listar({ turma_id: turma.id })
      atletasPorTurma.value[turma.id] = (data ?? []).filter((a) => a.status !== 'afastado')
    }
    const atletasDaTurmaAtual = atletasDaTurma(turma.id)
    for (const atleta of atletasDaTurmaAtual) {
      if (!atletasRevisao.value.some((a) => a.atleta_id === atleta.id)) {
        const valorAtleta = atleta.valor_mensalidade ?? null
        const valorCustom = valorAtleta !== null ? valorAtleta : valorBase
        atletasRevisao.value.push({
          atleta_id: atleta.id,
          nome: atleta.nome,
          turma_id: turma.id,
          valorTurma: valorBase,
          valorAtleta,
          valorCustom,
          isento: valorAtleta === 0,
        })
      }
    }
  } else {
    atletasRevisao.value = atletasRevisao.value.filter((a) => a.turma_id !== turma.id)
  }
}

function nomeDaTurma(id: string) {
  return turmasList.value.find((t) => t.id === id)?.nome ?? id
}

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

const totalPrevisto = computed(() =>
  atletasRevisao.value.reduce(
    (acc, a) => acc + (a.isento ? 0 : a.valorCustom || 0),
    0,
  ),
)

// ── Validações por passo ─────────────────────────────────────────────────────
const podeProsseguir = computed(() => {
  if (passo.value === 1) return form.nome.trim().length >= 3 && form.valor > 0
  if (passo.value === 2) return form.turmaIds.length > 0
  return true
})

// ── Salvar ───────────────────────────────────────────────────────────────────
async function salvarComo(estadoInicial: 'inativo' | 'ativo') {
  if (!clube.value) return
  loading.value = true
  try {
    const { data: planej, error } = await fin.criarPlanejamento({
      clube_id: clube.value.id,
      nome: form.nome.trim(),
      descricao: form.descricao || null,
      tipo: form.tipo,
      valor: form.valor,
      periodicidade: form.tipo === 'recorrente' ? form.periodicidade : null,
      dia_vencimento: form.tipo === 'recorrente' ? form.dia_vencimento : null,
      data_vencimento: form.tipo === 'unico' ? form.data_vencimento : null,
      status: 'inativo',
      ativado_em: null,
      encerrado_em: null,
    })
    if (error || !planej) throw error ?? new Error('Falha ao criar')

    // Vincula TODOS os atletas (inclusive isentos). A RPC ativar_planejamento
    // pula isento=true ao gerar cobranças, então registrar o isento é correto.
    const atletaIds = atletasRevisao.value.map((a) => a.atleta_id)
    const customizacoes = atletasRevisao.value.map((a) => ({
      atleta_id: a.atleta_id,
      valor_customizado: a.valorCustom !== (a.valorAtleta ?? a.valorTurma) ? a.valorCustom : null,
      isento: a.isento,
    }))

    if (atletaIds.length > 0) {
      await fin.vincularAtletas(planej.id, atletaIds, customizacoes)
    }

    if (estadoInicial === 'ativo') {
      await fin.ativarPlanejamento(planej.id)
      const isentos = atletasRevisao.value.filter((a) => a.isento).length
      const cobrados = atletaIds.length - isentos
      toast.success(
        'Cobranças ativadas!',
        `${cobrados} atleta(s) com cobrança${isentos ? ` · ${isentos} isento(s)` : ''}`,
      )
    } else {
      toast.success('Planejamento salvo como rascunho')
    }
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}
</script>

