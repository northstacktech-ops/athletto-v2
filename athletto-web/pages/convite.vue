<template>
  <div class="space-y-4 animate-fade-in">

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- COLUNA PRINCIPAL (2/3) -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Hero flat ink -->
        <div class="rounded-2xl overflow-hidden p-6 sm:p-8 bg-ink text-white relative">
          <div class="relative">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 bg-white/10">
              <svg class="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
              <span class="text-xs font-semibold text-white/90">Programa de indicação</span>
            </div>
            <h1 class="text-3xl sm:text-[32px] font-extrabold leading-tight">Convide e ganhe</h1>
            <p class="text-base text-white/80 mt-2 max-w-xl">
              Indique outro clube para o Athletto. Quando ele assinar um plano pago, você ganha
              <span class="font-bold text-accent">{{ diasRecompensa }} dias grátis</span> automaticamente.
            </p>
            <p class="text-xs text-white/60 mt-2">Sem limite. Cada indicação vira mais tempo no plano.</p>
          </div>
        </div>

        <!-- Form -->
        <div class="card-base p-5 shadow-card">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Indique um clube</h2>
          <p class="text-xs text-slate-500 mt-0.5 mb-4">Preencha os dados do clube que você quer indicar. A gente cuida do contato.</p>

          <form class="grid grid-cols-1 sm:grid-cols-2 gap-3" @submit.prevent="enviar">
            <div class="sm:col-span-2">
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do clube *</label>
              <input v-model="form.nome_indicado" required maxlength="80" class="form-input"/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail do gestor *</label>
              <input v-model="form.email_indicado" type="email" required maxlength="120" class="form-input"/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone (opcional)</label>
              <input v-model="form.telefone_indicado" type="tel" maxlength="20" class="form-input"/>
            </div>

            <div class="sm:col-span-2 flex justify-end">
              <button type="submit" :disabled="!podeEnviar || loading" class="px-4 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors">
                {{ loading ? 'Enviando...' : 'Enviar indicação' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Histórico -->
        <div class="card-base shadow-card overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Suas indicações</h2>
            <span class="text-xs text-slate-400">{{ historico.length }} envio(s)</span>
          </div>
          <UiEmptyState v-if="historico.length === 0" title="Nenhuma indicação ainda" description="Envie sua primeira indicação acima para começar a ganhar dias grátis." size="sm"/>
          <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <li v-for="ind in historico" :key="ind.id" class="px-5 py-3 flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ ind.nome_indicado ?? ind.email_indicado }}</p>
                <p class="text-xs text-slate-400">{{ formatRelativeDate(ind.criado_em) }} · {{ ind.email_indicado }}</p>
              </div>
              <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" :class="statusCor(ind.status)">{{ ind.status }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- LATERAL (1/3) -->
      <aside class="space-y-3">

        <div class="card-base p-5 shadow-card">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Seu impacto</p>
          <p class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ diasGanhos }}</p>
          <p class="text-sm text-slate-500">dia(s) ganho(s) até hoje</p>

          <div class="mt-4 grid grid-cols-2 gap-2 text-center">
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-2.5">
              <p class="text-xs text-slate-400">Aprovadas</p>
              <p class="text-lg font-bold text-emerald-600">{{ aprovadas }}</p>
            </div>
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-2.5">
              <p class="text-xs text-slate-400">Pendentes</p>
              <p class="text-lg font-bold text-amber-600">{{ pendentes }}</p>
            </div>
          </div>
        </div>

        <div class="card-base p-5 shadow-card">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Como funciona</h3>
          <ol class="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li class="flex gap-2">
              <span class="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              Você envia o nome e e-mail do clube que quer indicar.
            </li>
            <li class="flex gap-2">
              <span class="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              Nossa equipe entra em contato e ajuda na implantação.
            </li>
            <li class="flex gap-2">
              <span class="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              Quando o clube indicado assinar plano pago, você ganha <strong>{{ diasRecompensa }} dias grátis</strong> automaticamente.
            </li>
          </ol>
        </div>

        <div class="card-base p-5 shadow-card">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Link único de indicação</p>
          <div class="flex items-center gap-2 mt-1">
            <code class="text-xs font-mono text-slate-700 dark:text-slate-300 truncate flex-1">{{ linkUnico }}</code>
            <button class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] hover:bg-slate-50 dark:hover:bg-white/[0.05]" @click="copiarLink">
              {{ copiado ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>
          <p class="text-xs text-slate-400 mt-2">Compartilhe esse link onde quiser — indicações via link também valem dias grátis.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRelativeDate } from '~/utils/format'
import type { Indicacao, ConfiguracaoSistema } from '~/types'

definePageMeta({ layout: 'default' })
useHead({ title: 'Convide e Ganhe — Athletto' })

const indicacoes = useIndicacoes()
const cfgComp = useConfiguracaoSistema()
const { clube } = useAuth()
const toast = useToast()

const cfg = ref<ConfiguracaoSistema | null>(null)
const historico = ref<Indicacao[]>([])
const loading = ref(false)
const copiado = ref(false)

const form = reactive({
  nome_indicado: '',
  email_indicado: '',
  telefone_indicado: '',
})

const diasRecompensa = computed(() => cfg.value?.indicacao_dias_recompensa ?? 30)
const podeEnviar = computed(() => form.nome_indicado.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_indicado))

const aprovadas = computed(() => historico.value.filter((i) => i.status === 'aprovada').length)
const pendentes = computed(() => historico.value.filter((i) => i.status === 'pendente').length)
const diasGanhos = computed(() => aprovadas.value * diasRecompensa.value)

const linkUnico = computed(() => {
  const slug = clube.value?.slug ?? 'seu-clube'
  if (process.client) return `${window.location.origin}/r/${slug}`
  return `https://athletto.com/r/${slug}`
})

async function carregar() {
  const { data: c } = await cfgComp.buscar()
  cfg.value = c
  if (clube.value) {
    const { data: lista } = await indicacoes.listar()
    historico.value = (lista ?? []).filter((i) => i.clube_indicador_id === clube.value!.id)
  }
}
onMounted(carregar)

async function enviar() {
  if (!podeEnviar.value || !clube.value) return
  loading.value = true
  try {
    const supabase = useSupabaseClient()
    const { error } = await supabase.from('indicacoes').insert({
      clube_indicador_id: clube.value.id,
      nome_indicado: form.nome_indicado,
      email_indicado: form.email_indicado,
      telefone_indicado: form.telefone_indicado || null,
      dias_recompensa: diasRecompensa.value,
    })
    if (error) throw error
    toast.success('Indicação enviada!', 'A gente avisa quando for aprovada.')
    Object.assign(form, { nome_indicado: '', email_indicado: '', telefone_indicado: '' })
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao enviar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}

async function copiarLink() {
  if (!process.client) return
  await navigator.clipboard.writeText(linkUnico.value)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 1500)
}

function statusCor(s: Indicacao['status']) {
  switch (s) {
    case 'pendente': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'aprovada': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'rejeitada': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    case 'expirada': return 'bg-slate-100 text-slate-600'
  }
}
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10]
         bg-white dark:bg-surface-canvas-dark text-sm text-slate-900 dark:text-white
         focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-600/10;
}
</style>
