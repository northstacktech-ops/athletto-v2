<template>
  <div v-if="loading" class="space-y-4 animate-fade-in">
    <div class="skeleton h-10 w-40 rounded-lg" />
    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div class="skeleton h-[420px] rounded-xl" />
      <div class="skeleton h-[420px] rounded-xl" />
    </div>
  </div>

  <UiEmptyState
    v-else-if="!atleta"
    title="Atleta não encontrado"
    description="Verifique o link ou volte à lista."
  />

  <div v-else class="space-y-4 animate-fade-in">
    <!-- Breadcrumb / back -->
    <div class="flex items-center gap-2 text-sm">
      <NuxtLink to="/atletas" class="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-1">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Atletas
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <span class="text-slate-900 dark:text-white font-semibold truncate">{{ atleta.nome }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

      <!-- ── Sidebar esquerda ────────────────────────────────────── -->
      <aside class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-5 shadow-card lg:sticky lg:top-[80px] self-start">
        <div class="flex flex-col items-center text-center">
          <UiAvatar
            :src="atleta.foto_url"
            :nome="atleta.nome"
            :numero="atleta.numero_camisa"
            size="2xl"
          />
          <h1 class="mt-3 text-lg font-bold text-slate-900 dark:text-white">{{ atleta.nome }}</h1>
          <p v-if="atleta.apelido" class="text-sm text-slate-500">"{{ atleta.apelido }}"</p>
          <p class="text-sm text-slate-500 mt-0.5">
            {{ atleta.posicao ?? 'Sem posição' }}
            <template v-if="idade !== null"> · {{ idade }} anos</template>
          </p>

          <div class="mt-3 flex items-center gap-2 flex-wrap justify-center">
            <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" :class="statusCor">{{ atleta.status }}</span>
            <span class="inline-flex items-center gap-1 text-xs font-medium" :class="saudeTexto">
              <span class="w-1.5 h-1.5 rounded-full" :class="saudeDot"/>
              {{ saudeLabel }}
            </span>
            <span v-if="!atleta.ativo" class="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-600">Inativo</span>
          </div>
        </div>

        <!-- Métricas (linha discreta) -->
        <div class="mt-5 grid grid-cols-3 gap-3 border-y border-slate-100 dark:border-white/[0.06] py-3">
          <div class="text-center">
            <p class="text-xs text-slate-500 dark:text-slate-400">Frequência</p>
            <p class="text-sm font-semibold mt-0.5" :class="freqColor">{{ presencaPct === null ? '—' : `${presencaPct}%` }}</p>
          </div>
          <div class="text-center border-x border-slate-100 dark:border-white/[0.06]">
            <p class="text-xs text-slate-500 dark:text-slate-400">Turmas</p>
            <p class="text-sm font-semibold mt-0.5 text-slate-900 dark:text-white">{{ turmasVinculadas.length }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-500 dark:text-slate-400">No clube</p>
            <p class="text-sm font-semibold mt-0.5 text-slate-900 dark:text-white">{{ tempoNoClube }}</p>
          </div>
        </div>

        <!-- Ações rápidas -->
        <div class="mt-5 space-y-2">
          <a
            v-if="telefoneResponsavelWhatsApp"
            :href="telefoneResponsavelWhatsApp"
            target="_blank"
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg>
            WhatsApp do responsável
          </a>
          <button
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            @click="abrirEdicao = true"
          >
            Editar atleta
          </button>
          <button
            v-if="atleta.ativo"
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            @click="desativar"
          >
            Desativar
          </button>
        </div>

        <!-- Metadados -->
        <div class="mt-5 text-xs space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-500">Entrou em</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ formatDate(atleta.data_entrada) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">CPF</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ formatCpf(atleta.cpf) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">App</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ atleta.app_primeiro_acesso ? 'Aguarda 1º acesso' : 'Já acessou' }}</span>
          </div>
        </div>
      </aside>

      <!-- ── Conteúdo principal ──────────────────────────────────── -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] shadow-card overflow-hidden">
        <!-- Tabs -->
        <div class="px-4 pt-4">
          <UiTabsPill v-model="aba" :tabs="tabs" />
        </div>

        <!-- Conteúdo das abas -->
        <div class="p-6">
          <!-- VISÃO GERAL -->
          <div v-if="aba === 'visao'" class="space-y-6">
            <section>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Dados pessoais</h3>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt class="text-slate-400 text-xs">Nome completo</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.nome }}</dd>
                </div>
                <div v-if="atleta.apelido">
                  <dt class="text-slate-400 text-xs">Apelido</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.apelido }}</dd>
                </div>
                <div v-if="atleta.data_nascimento">
                  <dt class="text-slate-400 text-xs">Data de nascimento</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ formatDate(atleta.data_nascimento) }}</dd>
                </div>
                <div v-if="atleta.posicao">
                  <dt class="text-slate-400 text-xs">Posição</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.posicao }}</dd>
                </div>
                <div v-if="atleta.numero_camisa">
                  <dt class="text-slate-400 text-xs">Número da camisa</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.numero_camisa }}</dd>
                </div>
                <div v-if="atleta.tipo_sanguineo">
                  <dt class="text-slate-400 text-xs">Tipo sanguíneo</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.tipo_sanguineo }}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contato</h3>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div v-if="atleta.telefone_responsavel">
                  <dt class="text-slate-400 text-xs">Telefone do responsável</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.telefone_responsavel }}</dd>
                </div>
                <div v-if="atleta.telefone">
                  <dt class="text-slate-400 text-xs">Telefone do atleta</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.telefone }}</dd>
                </div>
                <div v-if="atleta.email">
                  <dt class="text-slate-400 text-xs">E-mail</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.email }}</dd>
                </div>
              </dl>
            </section>

            <section v-if="atleta.observacoes_medicas" class="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">Atenção médica</p>
              <p class="text-sm text-amber-900 dark:text-amber-200">{{ atleta.observacoes_medicas }}</p>
            </section>
          </div>

          <!-- TURMAS -->
          <div v-else-if="aba === 'turmas'">
            <div v-if="turmasVinculadas.length === 0" class="text-center py-12">
              <p class="text-sm text-slate-400">Atleta não está vinculado a nenhuma turma.</p>
              <button class="mt-3 text-sm font-bold text-brand-700 dark:text-brand-400 hover:underline" @click="abrirEdicao = true">Vincular a uma turma</button>
            </div>
            <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
              <li v-for="t in turmasVinculadas" :key="t.id" class="py-3 flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-50 dark:bg-brand-500/10 shrink-0">
                  <svg class="w-5 h-5 text-brand-700 dark:text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink :to="`/turmas/${t.id}`" class="text-sm font-bold text-slate-900 dark:text-white hover:underline truncate block">{{ t.nome }}</NuxtLink>
                  <p class="text-xs text-slate-500">
                    {{ formatDiasSemana(t.dias_semana) }} · {{ formatHorario(t.horario_inicio, t.horario_fim) }}
                    <template v-if="t.local"> · {{ t.local }}</template>
                  </p>
                </div>
                <span class="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">R$ {{ (t.valor_mensalidade_padrao ?? 0).toFixed(0) }}/mês</span>
              </li>
            </ul>
          </div>

          <!-- FREQUÊNCIA -->
          <div v-else-if="aba === 'frequencia'" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UiKpiPastel
                :tone="freqTone"
                label="Presença geral"
                :value="presencaPct === null ? '—' : `${presencaPct}%`"
                :delta="presencaPct === null ? 'Sem dados' : 'Últimos 90 dias'"
              />
              <UiKpiPastel
                tone="brand"
                label="Total de treinos"
                :value="totalTreinos"
                delta="Registros encontrados"
              />
              <UiKpiPastel
                tone="emerald"
                label="Presenças"
                :value="totalPresencas"
                :delta="`${totalTreinos - totalPresencas} faltas`"
              />
            </div>

            <div>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Últimos 10 registros</h3>
              <div v-if="historico.length === 0" class="text-sm text-slate-400 italic">Nenhum registro encontrado.</div>
              <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                <li v-for="h in historico.slice(0, 10)" :key="h.id" class="py-2 flex items-center gap-3 text-sm">
                  <span class="w-2 h-2 rounded-full shrink-0" :class="h.presente ? 'bg-emerald-500' : 'bg-red-500'"/>
                  <span class="font-medium text-slate-900 dark:text-white">{{ formatDate(h.data) }}</span>
                  <span class="text-slate-500 flex-1">{{ turmaNome(h.turma_id) }}</span>
                  <span class="text-xs font-bold" :class="h.presente ? 'text-emerald-600' : 'text-red-600'">{{ h.presente ? 'Presente' : 'Falta' }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- FINANCEIRO -->
          <div v-else-if="aba === 'financeiro'" class="space-y-6">
            <section>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Mensalidade</h3>

              <!-- Visualização -->
              <div v-if="!editandoMensalidade" class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm text-slate-500">Valor mensal cobrado</p>
                  <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    R$ {{ mensalidadeAtual.toFixed(2).replace('.', ',') }}
                  </p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span v-if="atleta.valor_mensalidade === 0"
                      class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                      Bolsa integral
                    </span>
                    <span v-else-if="atleta.valor_mensalidade !== null && atleta.valor_mensalidade !== undefined"
                      class="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                      Taxa personalizada
                    </span>
                    <span v-else class="text-xs text-slate-500">Valor padrão das turmas vinculadas</span>
                  </div>
                </div>
                <button
                  class="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 transition-colors"
                  @click="abrirFormMensalidade">
                  Alterar
                </button>
              </div>

              <!-- Edição inline -->
              <div v-else class="bg-white dark:bg-white/[0.02] border border-brand-300 dark:border-brand-500/40 ring-1 ring-brand-400/20 rounded-xl p-5 space-y-4">
                <p class="text-sm font-semibold text-slate-900 dark:text-white">Configurar mensalidade</p>

                <!-- Input de valor -->
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1.5">Valor personalizado</label>
                  <div class="relative max-w-[180px]">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">R$</span>
                    <input
                      v-model.number="novoValorMensalidade"
                      type="number" min="0" step="0.01"
                      class="form-input pl-9"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <!-- Atalhos -->
                <div class="flex flex-wrap gap-2">
                  <button type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                    :disabled="savingMensalidade"
                    @click="salvarMensalidade('padrao')">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                    Usar padrão da turma
                  </button>
                  <button type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    :disabled="savingMensalidade"
                    @click="salvarMensalidade('isento')">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Isentar (R$ 0)
                  </button>
                </div>

                <!-- Ações -->
                <div class="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <button type="button"
                    class="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors"
                    :disabled="savingMensalidade"
                    @click="salvarMensalidade('valor')">
                    {{ savingMensalidade ? 'Salvando...' : 'Salvar' }}
                  </button>
                  <button type="button"
                    class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    :disabled="savingMensalidade"
                    @click="editandoMensalidade = false">
                    Cancelar
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Histórico de cobranças</h3>
                <span class="text-xs text-slate-500">{{ cobrancas.length }} registros</span>
              </div>
              <div v-if="cobrancas.length === 0" class="text-sm text-slate-500 italic py-6 text-center">Nenhuma cobrança registrada.</div>
              <table v-else class="w-full text-sm">
                <thead class="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-white/[0.06]">
                  <tr>
                    <th class="py-2 font-medium">Vencimento</th>
                    <th class="py-2 font-medium">Valor</th>
                    <th class="py-2 font-medium">Status</th>
                    <th class="py-2 font-medium text-right">Pago em</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  <tr v-for="c in cobrancas" :key="c.id">
                    <td class="py-2.5 font-medium text-slate-900 dark:text-white">{{ formatDate(c.data_vencimento) }}</td>
                    <td class="py-2.5 font-semibold text-slate-900 dark:text-white">{{ formatCurrency(c.valor) }}</td>
                    <td class="py-2.5">
                      <UiStatusBadge :variant="cobrancaVariant(c)" />
                    </td>
                    <td class="py-2.5 text-right text-slate-500 text-xs">{{ c.data_pagamento ? formatDate(c.data_pagamento) : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          <!-- SAÚDE -->
          <div v-else-if="aba === 'saude'" class="space-y-6">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-slate-500 text-xs">Saúde atual</dt>
                <dd class="font-semibold" :class="saudeTexto">{{ saudeLabel }}</dd>
              </div>
              <div v-if="atleta.tipo_sanguineo">
                <dt class="text-slate-500 text-xs">Tipo sanguíneo</dt>
                <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.tipo_sanguineo }}</dd>
              </div>
            </dl>

            <section v-if="atleta.observacoes_medicas">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-2">Observações médicas</h3>
              <p class="text-sm text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">{{ atleta.observacoes_medicas }}</p>
            </section>

            <section v-if="atleta.historico_lesoes.length > 0">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Histórico de lesões</h3>
              <ul class="space-y-2">
                <li v-for="(l, i) in atleta.historico_lesoes" :key="i" class="border-l-2 border-slate-200 dark:border-white/[0.10] pl-3">
                  <p class="text-xs text-slate-500">{{ formatDate(l.data) }}</p>
                  <p class="text-sm text-slate-700 dark:text-slate-300">{{ l.descricao }}</p>
                </li>
              </ul>
            </section>

            <p v-if="!atleta.observacoes_medicas && !atleta.historico_lesoes.length && !atleta.tipo_sanguineo" class="text-sm text-slate-500 italic">Sem informações de saúde registradas.</p>
          </div>
        </div>
      </div>
    </div>

    <AtletasFormModal
      v-if="abrirEdicao"
      :atleta="atleta"
      :turmas="turmas"
      @close="abrirEdicao = false"
      @salvo="onSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCpf, formatDate, formatDiasSemana, formatHorario, formatCurrency, gerarLinkWhatsApp } from '~/utils/format'
import type { Atleta, Turma, Frequencia, Cobranca } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const atletasComp = useAtletas()
const turmasComp = useTurmas()
const freqComp = useFrequencia()
const finComp = useFinanceiro()
const toast = useToast()

const atletaId = computed(() => route.params.id as string)

const loading = ref(true)
const atleta = ref<Atleta | null>(null)
const turmas = ref<Turma[]>([])
const turmasVinculadas = ref<Turma[]>([])
const presencaPct = ref<number | null>(null)
const historico = ref<Frequencia[]>([])
const cobrancas = ref<Cobranca[]>([])
const abrirEdicao = ref(false)

// ── Edição inline de mensalidade ─────────────────────────────────────────────
const editandoMensalidade = ref(false)
const novoValorMensalidade = ref(0)
const savingMensalidade = ref(false)

function abrirFormMensalidade() {
  novoValorMensalidade.value = atleta.value?.valor_mensalidade ?? mensalidadeAtual.value
  editandoMensalidade.value = true
}

async function salvarMensalidade(tipo: 'valor' | 'isento' | 'padrao') {
  if (!atleta.value) return
  savingMensalidade.value = true
  try {
    const novoValor = tipo === 'valor' ? novoValorMensalidade.value
      : tipo === 'isento' ? 0
      : null
    await atletasComp.atualizar(atleta.value.id, { valor_mensalidade: novoValor })
    atleta.value = { ...atleta.value, valor_mensalidade: novoValor }
    const mensagem = tipo === 'padrao' ? 'Usando valor padrão da turma'
      : tipo === 'isento' ? 'Atleta isento (R$ 0,00)'
      : `Mensalidade atualizada para R$ ${novoValor!.toFixed(2)}`
    toast.success('Mensalidade atualizada', mensagem)
    editandoMensalidade.value = false
  } catch (err: any) {
    toast.error('Erro ao salvar', err?.message ?? '')
  } finally {
    savingMensalidade.value = false
  }
}

const tabs = [
  { value: 'visao' as const, label: 'Visão geral' },
  { value: 'turmas' as const, label: 'Turmas' },
  { value: 'frequencia' as const, label: 'Frequência' },
  { value: 'financeiro' as const, label: 'Financeiro' },
  { value: 'saude' as const, label: 'Saúde' },
]
type TabValue = typeof tabs[number]['value']
const hashToTab: Record<string, TabValue> = {
  '#visao': 'visao', '#turmas': 'turmas', '#frequencia': 'frequencia',
  '#financeiro': 'financeiro', '#saude': 'saude',
}
const aba = ref<TabValue>(hashToTab[route.hash] ?? 'visao')
watch(aba, (v) => router.replace({ hash: `#${v}` }))

async function carregar() {
  loading.value = true
  try {
    const [aRes, tRes] = await Promise.all([
      atletasComp.buscarPorId(atletaId.value),
      turmasComp.listar(true),
    ])
    atleta.value = aRes.data
    turmas.value = tRes.data ?? []

    if (atleta.value) {
      useHead({ title: `${atleta.value.nome} — Atletto` })

      const [presRes, vinRes, histRes, cobRes] = await Promise.all([
        freqComp.calcularPresenca(atleta.value.id),
        atletasComp.listarTurmas(atleta.value.id),
        freqComp.historicoPorAtleta(atleta.value.id),
        finComp.listarCobranças({ atleta_id: atleta.value.id }),
      ])
      presencaPct.value = typeof presRes.data === 'number' ? presRes.data : null
      const ids = new Set((vinRes.data ?? []).map((d: any) => d.turma_id))
      turmasVinculadas.value = turmas.value.filter((t) => ids.has(t.id))
      historico.value = (histRes.data ?? []) as Frequencia[]
      cobrancas.value = (cobRes.data ?? []) as Cobranca[]
    }
  } finally {
    loading.value = false
  }
}
onMounted(carregar)

const idade = computed(() => {
  if (!atleta.value?.data_nascimento) return null
  const nasc = new Date(atleta.value.data_nascimento)
  return Math.floor((Date.now() - nasc.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
})

const tempoNoClube = computed(() => {
  if (!atleta.value) return '—'
  const entrada = new Date(atleta.value.data_entrada)
  const meses = Math.floor((Date.now() - entrada.getTime()) / (30 * 24 * 60 * 60 * 1000))
  if (meses < 1) return '< 1m'
  if (meses < 12) return `${meses}m`
  const anos = Math.floor(meses / 12)
  const mr = meses % 12
  return mr === 0 ? `${anos}a` : `${anos}a${mr}m`
})

const telefoneResponsavelWhatsApp = computed(() => {
  if (!atleta.value?.telefone_responsavel) return null
  return gerarLinkWhatsApp(
    atleta.value.telefone_responsavel,
    `Oi! Sou do clube, queria conversar sobre o(a) ${atleta.value.nome}.`,
  )
})

const mensalidadeAtual = computed(() => {
  if (!atleta.value) return 0
  if (atleta.value.valor_mensalidade !== null && atleta.value.valor_mensalidade !== undefined) {
    return atleta.value.valor_mensalidade
  }
  if (turmasVinculadas.value.length === 0) return 0
  const total = turmasVinculadas.value.reduce((s, t) => s + (t.valor_mensalidade_padrao ?? 0), 0)
  return total / turmasVinculadas.value.length
})

const totalTreinos = computed(() => historico.value.length)
const totalPresencas = computed(() => historico.value.filter((h) => h.presente).length)

const freqColor = computed(() => {
  const v = presencaPct.value
  if (v === null) return 'text-slate-400'
  if (v >= 80) return 'text-emerald-600'
  if (v >= 60) return 'text-amber-500'
  return 'text-red-500'
})

const freqTone = computed<'emerald' | 'amber' | 'rose' | 'slate'>(() => {
  const v = presencaPct.value
  if (v === null) return 'slate'
  if (v >= 80) return 'emerald'
  if (v >= 60) return 'amber'
  return 'rose'
})

const statusCor = computed(() => {
  if (!atleta.value) return ''
  switch (atleta.value.status) {
    case 'titular': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'novato': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'selecionado': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'afastado': return 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'
  }
})
const saudeLabel = computed(() => {
  if (!atleta.value) return ''
  return ({
    saudavel: 'Saudável', lesionado: 'Lesionado', em_recuperacao: 'Em recuperação',
  } as const)[atleta.value.saude]
})
const saudeDot = computed(() => {
  if (!atleta.value) return ''
  return ({
    saudavel: 'bg-emerald-500', lesionado: 'bg-red-500', em_recuperacao: 'bg-amber-400',
  } as const)[atleta.value.saude]
})
const saudeTexto = computed(() => {
  if (!atleta.value) return ''
  return ({
    saudavel: 'text-emerald-600 dark:text-emerald-400',
    lesionado: 'text-red-600 dark:text-red-400',
    em_recuperacao: 'text-amber-600 dark:text-amber-400',
  } as const)[atleta.value.saude]
})

function turmaNome(id: string) {
  return turmas.value.find((t) => t.id === id)?.nome ?? '—'
}

function cobrancaVariant(c: Cobranca): 'pago' | 'overdue' | 'pendente' | 'cancelado' {
  const hoje = new Date().toISOString().slice(0, 10)
  if (c.status === 'pago') return 'pago'
  if (c.status === 'pendente' && c.data_vencimento < hoje) return 'overdue'
  if (c.status === 'cancelado') return 'cancelado'
  return 'pendente'
}

async function desativar() {
  if (!atleta.value) return
  if (!window.confirm(`Desativar ${atleta.value.nome}?`)) return
  try {
    await atletasComp.desativar(atleta.value.id)
    toast.success('Atleta desativado', 'O histórico fica preservado.')
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao desativar', err?.message ?? '')
  }
}

async function onSalvo() {
  abrirEdicao.value = false
  await carregar()
}
</script>
