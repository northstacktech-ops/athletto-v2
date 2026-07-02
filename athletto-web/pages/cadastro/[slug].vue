<template>
  <div class="min-h-screen bg-gray-50 dark:bg-surface-canvas-dark py-8 px-4">
    <div class="max-w-md mx-auto">

      <!-- Header clube -->
      <div v-if="loadingClube" class="bg-white dark:bg-surface-elevated-dark rounded-2xl p-6 mb-6 skeleton h-32"/>
      <div v-else-if="!clube" class="bg-white dark:bg-surface-elevated-dark rounded-2xl p-6 mb-6 text-center">
        <p class="text-base text-gray-700 dark:text-gray-300 font-semibold">Clube não encontrado</p>
        <p class="text-sm text-gray-500 mt-1">O link que você acessou está incorreto ou expirou.</p>
      </div>
      <div v-else class="bg-white dark:bg-surface-elevated-dark rounded-2xl p-6 mb-6 text-center">
        <div class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-white/[0.05]">
          <NuxtImg v-if="clube.logo_url" :src="clube.logo_url" alt="Logo" width="128" height="128" format="webp" class="w-full h-full object-cover"/>
          <span v-else class="text-2xl font-extrabold" style="color: #3d5afe;">{{ iniciais }}</span>
        </div>
        <h1 class="text-xl font-extrabold text-gray-900 dark:text-white mt-3">{{ clube.nome }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">Cadastro de atleta</p>
      </div>

      <!-- Sucesso -->
      <div v-if="sucesso" class="bg-white dark:bg-surface-elevated-dark rounded-2xl p-6 text-center">
        <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <svg class="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mt-3">Cadastro enviado!</h2>
        <p class="text-sm text-gray-500 mt-1.5 leading-relaxed">
          O clube vai analisar e entrar em contato em breve.
        </p>
      </div>

      <!-- Form -->
      <form v-else-if="clube" class="bg-white dark:bg-surface-elevated-dark rounded-2xl p-6 space-y-4" @submit.prevent="enviar">

        <div class="border-l-2 border-brand-500 pl-3">
          <p class="text-xs uppercase tracking-wider font-bold text-brand-700 dark:text-brand-400">Dados do atleta</p>
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">Nome completo *</label>
          <input v-model="form.nome" required maxlength="120" class="form-input"/>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold mb-1">Apelido</label>
            <input v-model="form.apelido" maxlength="40" class="form-input"/>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Nascimento</label>
            <input v-model="form.data_nascimento" type="date" class="form-input"/>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">CPF *</label>
          <input
            v-model="cpfMascarado"
            type="text"
            required
            maxlength="14"
            placeholder="000.000.000-00"
            class="form-input"
            :class="erroCpf ? 'border-red-400 focus:border-red-400' : ''"
          />
          <p v-if="erroCpf" class="mt-1 text-xs text-red-500">{{ erroCpf }}</p>
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">Posição (se aplicável)</label>
          <input v-model="form.posicao" maxlength="40" class="form-input"/>
        </div>

        <div v-if="turmas.length > 0">
          <label class="block text-sm font-semibold mb-1">Turma desejada</label>
          <select v-model="form.turma_id" class="form-input">
            <option value="">A definir pelo clube</option>
            <option v-for="t in turmas" :key="t.id" :value="t.id">
              {{ t.nome }} · {{ formatDiasSemana(t.dias_semana) }}
            </option>
          </select>
        </div>

        <div class="border-l-2 border-brand-500 pl-3 pt-3">
          <p class="text-xs uppercase tracking-wider font-bold text-brand-700 dark:text-brand-400">Responsável</p>
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">WhatsApp do responsável *</label>
          <input v-model="form.telefone_responsavel" type="tel" required maxlength="20" placeholder="(11) 99999-9999" class="form-input"/>
        </div>

        <div
          v-if="erroEnvio"
          role="alert"
          class="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40"
        >
          <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-red-700 dark:text-red-300">{{ erroEnvio }}</p>
        </div>

        <div class="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-3 text-xs text-gray-500">
          Ao continuar, você concorda com nossa
          <NuxtLink to="/privacidade" class="text-brand-600 underline" target="_blank">política de privacidade</NuxtLink>
          e
          <NuxtLink to="/termos" class="text-brand-600 underline" target="_blank">termos de uso</NuxtLink>.
        </div>

        <button type="submit" :disabled="!podeEnviar || loading" class="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style="background-color: #3d5afe;">
          {{ loading ? 'Enviando...' : 'Enviar cadastro' }}
        </button>
      </form>

      <p class="text-center text-xs text-gray-400 mt-6">
        Powered by <span class="font-bold">Athletto</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDiasSemana, formatCpf, validarCpf } from '~/utils/format'
import type { Clube, Turma } from '~/types'

definePageMeta({ layout: false })
useHead({ title: 'Cadastro de atleta — Athletto' })

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const loadingClube = ref(true)
const clube = ref<Clube | null>(null)
const turmas = ref<Turma[]>([])
const loading = ref(false)
const sucesso = ref(false)
const erroCpf = ref<string | null>(null)
const cpfMascarado = ref('')

const form = reactive({
  nome: '',
  apelido: '',
  cpf: '',
  data_nascimento: '',
  posicao: '',
  turma_id: '',
  telefone_responsavel: '',
})

watch(cpfMascarado, (v) => {
  const onlyDigits = v.replace(/\D/g, '').slice(0, 11)
  form.cpf = onlyDigits
  const masked = formatCpf(onlyDigits)
  if (masked !== v && onlyDigits.length === 11) cpfMascarado.value = masked
  if (onlyDigits.length === 11) erroCpf.value = validarCpf(onlyDigits) ? null : 'CPF inválido'
  else erroCpf.value = null
})

const iniciais = computed(() => {
  if (!clube.value?.nome) return ''
  return clube.value.nome.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase()
})

const podeEnviar = computed(() =>
  form.nome.trim().length >= 3 && validarCpf(form.cpf) && form.telefone_responsavel.replace(/\D/g, '').length >= 10,
)

onMounted(async () => {
  loadingClube.value = true
  const supabase = useSupabaseClient()
  const { data: c } = await supabase.from('clubes').select('*').eq('slug', slug.value).eq('plano_ativo', true).maybeSingle()
  clube.value = c as Clube | null
  if (clube.value) {
    const { data: t } = await supabase.from('turmas').select('*').eq('clube_id', clube.value.id).eq('ativo', true)
    turmas.value = (t as Turma[]) ?? []
  }
  loadingClube.value = false
})

const erroEnvio = ref<string | null>(null)

async function enviar() {
  if (!podeEnviar.value || !clube.value) return
  loading.value = true
  erroEnvio.value = null
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.rpc('cadastro_publico_atleta', {
      p_slug: slug.value,
      p_dados: {
        nome: form.nome.trim(),
        cpf: form.cpf,
        telefone_responsavel: form.telefone_responsavel,
        apelido: form.apelido || undefined,
        posicao: form.posicao || undefined,
        data_nascimento: form.data_nascimento || undefined,
        turma_id: form.turma_id || undefined,
      },
    })
    if (error) throw error

    const result = data as { ok: boolean; erro?: string } | null
    if (!result?.ok) {
      erroEnvio.value = result?.erro ?? 'Não foi possível enviar o cadastro.'
      return
    }
    sucesso.value = true
  } catch (err: any) {
    erroEnvio.value = err?.message ?? 'Falha ao enviar o cadastro. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.10]
         bg-white dark:bg-surface-canvas-dark text-sm text-gray-900 dark:text-white
         focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-600/10;
}
</style>
