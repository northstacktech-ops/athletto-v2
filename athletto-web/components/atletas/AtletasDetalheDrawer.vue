<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50">
      <!-- Overlay (clicável para fechar) -->
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="$emit('close')"
      />

      <!-- Drawer -->
      <aside
        class="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white dark:bg-surface-elevated-dark shadow-2xl flex flex-col h-full animate-fade-in"
        @click.stop
      >
        <!-- Header limpo -->
        <div class="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div class="flex items-start gap-4">
            <UiAvatar
              :src="atleta.foto_url"
              :nome="atleta.nome"
              :numero="atleta.numero_camisa"
              size="xl"
            />
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ atleta.nome }}</h2>
              <p v-if="atleta.apelido" class="text-sm text-slate-500 truncate">"{{ atleta.apelido }}"</p>
              <p class="text-sm text-slate-500 truncate mt-0.5">
                {{ atleta.posicao ?? 'Sem posição' }}
                <template v-if="idade !== null"> · {{ idade }} anos</template>
              </p>
              <div class="mt-2 flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" :class="statusCor">{{ atleta.status }}</span>
                <span class="inline-flex items-center gap-1 text-xs font-medium" :class="saudeTexto">
                  <span class="w-1.5 h-1.5 rounded-full" :class="saudeDot"/>
                  {{ saudeLabel }}
                </span>
              </div>
            </div>
            <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05]" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-slate-100 dark:border-white/[0.06] px-2">
          <div class="flex gap-1 overflow-x-auto no-scrollbar">
            <button
              v-for="t in tabs"
              :key="t.value"
              class="px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px"
              :class="aba === t.value
                ? 'border-slate-900 text-slate-900 dark:border-brand-400 dark:text-brand-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              @click="aba = t.value"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="flex-1 overflow-y-auto px-6 py-4 scrollbar-slim">
          <!-- Visão geral -->
          <div v-if="aba === 'visao'" class="space-y-5">
            <!-- Métricas -->
            <div class="grid grid-cols-3 gap-2">
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-2.5 text-center">
                <p class="text-xs uppercase tracking-wider text-slate-400">Frequência</p>
                <p class="text-lg font-bold mt-0.5" :class="freqColor">{{ presencaPct === null ? '—' : `${presencaPct}%` }}</p>
              </div>
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-2.5 text-center">
                <p class="text-xs uppercase tracking-wider text-slate-400">Turmas</p>
                <p class="text-lg font-bold mt-0.5 text-slate-900 dark:text-white">{{ turmasVinculadas.length }}</p>
              </div>
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-2.5 text-center">
                <p class="text-xs uppercase tracking-wider text-slate-400">No clube</p>
                <p class="text-lg font-bold mt-0.5 text-slate-900 dark:text-white">{{ tempoNoClube }}</p>
              </div>
            </div>

            <section>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contato</h3>
              <div class="space-y-2 text-sm">
                <div v-if="atleta.telefone_responsavel" class="flex items-center justify-between">
                  <div>
                    <p class="text-slate-400 text-xs">Responsável</p>
                    <p class="font-semibold text-slate-900 dark:text-white">{{ atleta.telefone_responsavel }}</p>
                  </div>
                  <a v-if="telefoneResponsavelWhatsApp" :href="telefoneResponsavelWhatsApp" target="_blank" class="text-xs font-bold text-emerald-600 hover:text-emerald-700">WhatsApp →</a>
                </div>
                <div v-if="atleta.telefone">
                  <p class="text-slate-400 text-xs">Atleta</p>
                  <p class="font-semibold text-slate-900 dark:text-white">{{ atleta.telefone }}</p>
                </div>
                <div>
                  <p class="text-slate-400 text-xs">CPF</p>
                  <p class="font-semibold text-slate-900 dark:text-white">{{ formatCpf(atleta.cpf) }}</p>
                </div>
              </div>
            </section>

            <section v-if="turmasVinculadas.length > 0">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Turmas vinculadas</h3>
              <ul class="space-y-1.5">
                <li v-for="t in turmasVinculadas" :key="t.id" class="flex items-center gap-2 text-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-500"/>
                  <span class="font-semibold text-slate-900 dark:text-white">{{ t.nome }}</span>
                  <span class="text-xs text-slate-400">{{ formatDiasSemana(t.dias_semana) }}</span>
                </li>
              </ul>
            </section>

            <section class="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p class="text-slate-400">Entrou em</p>
                  <p class="font-semibold text-slate-900 dark:text-white">{{ formatDate(atleta.data_entrada) }}</p>
                </div>
                <div>
                  <p class="text-slate-400">App</p>
                  <p class="font-semibold text-slate-900 dark:text-white">{{ atleta.app_primeiro_acesso ? 'Aguardando 1º acesso' : 'Já acessou' }}</p>
                </div>
              </div>
            </section>
          </div>

          <!-- Financeiro -->
          <div v-else-if="aba === 'financeiro'" class="space-y-4">
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-4">
              <p class="text-xs uppercase tracking-wider text-slate-400">Mensalidade configurada</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                R$ {{ mensalidadeAtual.toFixed(2).replace('.', ',') }}
                <span v-if="atleta.valor_mensalidade !== null && atleta.valor_mensalidade !== undefined" class="text-xs font-semibold text-amber-600 align-middle ml-2">PERSONALIZADA</span>
              </p>
              <p v-if="atleta.valor_mensalidade === null || atleta.valor_mensalidade === undefined" class="text-xs text-slate-500 mt-1">Valor padrão das turmas vinculadas</p>
            </div>

            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Histórico de pagamentos</h3>
              <p class="text-sm text-slate-400 italic">Nenhuma cobrança registrada nos últimos 90 dias.</p>
              <NuxtLink :to="`/atletas/${atleta.id}#financeiro`" class="mt-3 block text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline" @click="$emit('close')">
                Ver financeiro completo →
              </NuxtLink>
            </div>
          </div>

          <!-- Frequência -->
          <div v-else-if="aba === 'frequencia'" class="space-y-4">
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-4 text-center">
              <p class="text-xs uppercase tracking-wider text-slate-400">Presença geral</p>
              <p class="text-3xl font-bold mt-1" :class="freqColor">{{ presencaPct === null ? '—' : `${presencaPct}%` }}</p>
              <p class="text-xs text-slate-500 mt-1">Últimos 30 dias</p>
            </div>
            <NuxtLink :to="`/atletas/${atleta.id}#frequencia`" class="block text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline" @click="$emit('close')">
              Ver histórico completo →
            </NuxtLink>
          </div>

          <!-- Saúde -->
          <div v-else-if="aba === 'saude'" class="space-y-4">
            <div v-if="atleta.tipo_sanguineo">
              <p class="text-xs text-slate-400">Tipo sanguíneo</p>
              <p class="font-semibold text-slate-900 dark:text-white">{{ atleta.tipo_sanguineo }}</p>
            </div>
            <div v-if="atleta.observacoes_medicas">
              <p class="text-xs text-slate-400 mb-1">Observações médicas</p>
              <p class="text-sm text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 leading-relaxed">
                {{ atleta.observacoes_medicas }}
              </p>
            </div>
            <div v-if="atleta.historico_lesoes.length > 0">
              <p class="text-xs text-slate-400 mb-2">Histórico de lesões</p>
              <ul class="space-y-2">
                <li v-for="(l, i) in atleta.historico_lesoes" :key="i" class="text-sm">
                  <p class="text-xs text-slate-400">{{ formatDate(l.data) }}</p>
                  <p class="text-slate-700 dark:text-slate-300">{{ l.descricao }}</p>
                </li>
              </ul>
            </div>
            <p v-if="!atleta.observacoes_medicas && !atleta.historico_lesoes.length && !atleta.tipo_sanguineo" class="text-sm text-slate-400 italic">Sem informações de saúde registradas.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.06] flex gap-2 bg-slate-50 dark:bg-white/[0.02]">
          <NuxtLink
            :to="`/atletas/${atleta.id}`"
            class="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            @click="$emit('close')"
          >
            Ver página completa
          </NuxtLink>
          <button class="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.05]" @click="editar">
            Editar
          </button>
        </div>
      </aside>
    </div>

    <AtletasFormModal
      v-if="abrirEdicao"
      :atleta="atleta"
      :turmas="turmas"
      @close="abrirEdicao = false"
      @salvo="onSalvo"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { formatCpf, formatDate, formatDiasSemana, gerarLinkWhatsApp } from '~/utils/format'
import type { Atleta, Turma } from '~/types'

const props = defineProps<{ atleta: Atleta; turmas: Turma[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'atualizado'): void }>()

const atletasComp = useAtletas()
const freqComp = useFrequencia()

const aba = ref<'visao' | 'financeiro' | 'frequencia' | 'saude'>('visao')
const presencaPct = ref<number | null>(null)
const turmasVinculadas = ref<Turma[]>([])
const abrirEdicao = ref(false)

const tabs = [
  { value: 'visao' as const, label: 'Visão geral' },
  { value: 'financeiro' as const, label: 'Financeiro' },
  { value: 'frequencia' as const, label: 'Frequência' },
  { value: 'saude' as const, label: 'Saúde' },
]

async function carregar() {
  const [pres, tvinc] = await Promise.all([
    freqComp.calcularPresenca(props.atleta.id),
    atletasComp.listarTurmas(props.atleta.id),
  ])
  presencaPct.value = typeof pres.data === 'number' ? pres.data : null
  const ids = new Set((tvinc.data ?? []).map((d: any) => d.turma_id))
  turmasVinculadas.value = props.turmas.filter((t) => ids.has(t.id))
}
onMounted(carregar)

const idade = computed(() => {
  if (!props.atleta.data_nascimento) return null
  const nasc = new Date(props.atleta.data_nascimento)
  const diff = Date.now() - nasc.getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
})

const tempoNoClube = computed(() => {
  const entrada = new Date(props.atleta.data_entrada)
  const meses = Math.floor((Date.now() - entrada.getTime()) / (30 * 24 * 60 * 60 * 1000))
  if (meses < 1) return '< 1m'
  if (meses < 12) return `${meses}m`
  const anos = Math.floor(meses / 12)
  const mr = meses % 12
  return mr === 0 ? `${anos}a` : `${anos}a ${mr}m`
})

const telefoneResponsavelWhatsApp = computed(() => {
  if (!props.atleta.telefone_responsavel) return null
  return gerarLinkWhatsApp(
    props.atleta.telefone_responsavel,
    `Oi! Sou do clube, queria conversar sobre o(a) ${props.atleta.nome}.`,
  )
})

const mensalidadeAtual = computed(() => {
  if (props.atleta.valor_mensalidade !== null && props.atleta.valor_mensalidade !== undefined) {
    return props.atleta.valor_mensalidade
  }
  // Pega a média do valor padrão das turmas vinculadas
  if (turmasVinculadas.value.length === 0) return 0
  const total = turmasVinculadas.value.reduce((s, t) => s + (t.valor_mensalidade_padrao ?? 0), 0)
  return total / turmasVinculadas.value.length
})

const freqColor = computed(() => {
  const v = presencaPct.value
  if (v === null) return 'text-slate-400'
  if (v >= 80) return 'text-emerald-600'
  if (v >= 60) return 'text-amber-500'
  return 'text-red-500'
})

const statusCor = computed(() => {
  switch (props.atleta.status) {
    case 'titular': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'novato': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'selecionado': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'afastado': return 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'
  }
})
const saudeLabel = computed(() => ({
  saudavel: 'Saudável',
  lesionado: 'Lesionado',
  em_recuperacao: 'Em recuperação',
} as const)[props.atleta.saude])
const saudeDot = computed(() => ({
  saudavel: 'bg-emerald-500',
  lesionado: 'bg-red-500',
  em_recuperacao: 'bg-amber-400',
} as const)[props.atleta.saude])
const saudeTexto = computed(() => ({
  saudavel: 'text-emerald-600 dark:text-emerald-400',
  lesionado: 'text-red-600 dark:text-red-400',
  em_recuperacao: 'text-amber-600 dark:text-amber-400',
} as const)[props.atleta.saude])

function editar() {
  abrirEdicao.value = true
}
function onSalvo() {
  abrirEdicao.value = false
  emit('atualizado')
}
</script>
