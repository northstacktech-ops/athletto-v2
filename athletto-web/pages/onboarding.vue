<template>
  <div
    class="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden"
    style="background-color: #3d5afe;"
  >
    <!-- Blobs decorativos -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-48 -right-48 w-[640px] h-[640px] rounded-full bg-white/5" />
      <div class="absolute -bottom-56 -left-40 w-[500px] h-[500px] rounded-full bg-black/10" />
    </div>

    <!-- Card -->
    <div class="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden">

      <!-- Stepper -->
      <div class="flex items-center gap-0 px-12 pt-10 pb-8 border-b border-gray-100">
        <template v-for="(s, i) in STEPS" :key="i">
          <button
            class="flex items-center gap-3 shrink-0"
            :disabled="i >= step"
            @click="i < step ? goToStep(i) : null"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 shrink-0"
              :class="i < step
                ? 'bg-brand-600 border-brand-600 text-white'
                : i === step
                  ? 'border-brand-600 text-brand-600 bg-white'
                  : 'border-gray-200 text-gray-400 bg-white'"
            >
              <svg v-if="i < step" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-sm font-semibold"
              :class="i <= step ? 'text-gray-800' : 'text-gray-400'"
            >{{ s.label }}</span>
          </button>
          <div
            v-if="i < STEPS.length - 1"
            class="flex-1 mx-4 h-0.5 rounded-full transition-all duration-500"
            :class="step > i ? 'bg-brand-500' : 'bg-gray-200'"
          />
        </template>
      </div>

      <!-- Conteúdo do passo -->
      <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div :key="step" class="px-12 pt-10 pb-8">

          <!-- ── Passo 0: Clube ────────────────────────────────────────── -->
          <template v-if="step === 0">
            <div class="mb-8">
              <p class="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Passo 1 de 4</p>
              <h2 class="text-3xl font-extrabold text-gray-900 leading-tight">Configure seu clube</h2>
              <p class="text-base text-gray-500 mt-3 leading-relaxed">
                Comece informando o nome oficial do seu clube ou escolinha. Esse nome aparece em todos os documentos e no app dos atletas.
              </p>
            </div>
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Nome do clube <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.nomeClube"
                  type="text"
                  class="auth-input py-3 text-base"
                  :class="errors.nomeClube ? 'border-red-400' : ''"
                  placeholder="Ex: Athletico Brasil, Clube EFC"
                  @blur="validateField('nomeClube')"
                />
                <FieldError :msg="errors.nomeClube" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  CNPJ
                  <span class="ml-2 text-xs font-normal text-gray-400">opcional — pode preencher depois nas configurações</span>
                </label>
                <input
                  v-model="form.cnpj"
                  type="text"
                  class="auth-input py-3 text-base"
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  maxlength="18"
                  @input="formatCNPJ"
                />
              </div>
            </div>
          </template>

          <!-- ── Passo 1: Localização ─────────────────────────────────── -->
          <template v-if="step === 1">
            <div class="mb-8">
              <p class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Passo 2 de 4</p>
              <h2 class="text-3xl font-extrabold text-gray-900 leading-tight">Localização do clube</h2>
              <p class="text-base text-gray-500 mt-3 leading-relaxed">
                Informe o CEP e preencheremos cidade e estado automaticamente. Isso aparece nos documentos e ajuda seus atletas a encontrarem o clube.
              </p>
            </div>
            <div class="space-y-6">

              <!-- CEP -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  CEP <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="form.cep"
                    type="text"
                    class="auth-input py-3 text-base pr-12"
                    :class="errors.cep ? 'border-red-400' : cepOk ? 'border-green-400' : ''"
                    placeholder="00000-000"
                    maxlength="9"
                    @input="onCepInput"
                    @blur="validateField('cep')"
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg v-if="cepLoading" class="animate-spin w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <svg v-else-if="cepOk" class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <FieldError :msg="errors.cep" />
              </div>

              <!-- Cidade + Estado — auto-preenchidos -->
              <div v-if="form.cidade" class="grid grid-cols-3 gap-4">
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Cidade</label>
                  <input
                    v-model="form.cidade"
                    type="text"
                    class="auth-input py-3 text-base bg-gray-50"
                    readonly
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                  <input
                    v-model="form.estado"
                    type="text"
                    class="auth-input py-3 text-base bg-gray-50"
                    readonly
                  />
                </div>
              </div>

              <!-- Bairro — auto-preenchido se disponível -->
              <div v-if="form.bairro">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Bairro</label>
                <input
                  v-model="form.bairro"
                  type="text"
                  class="auth-input py-3 text-base bg-gray-50"
                  readonly
                />
              </div>

              <!-- Local de treino -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Local de treino
                  <span class="ml-2 text-xs font-normal text-gray-400">opcional</span>
                </label>
                <input
                  v-model="form.local"
                  type="text"
                  class="auth-input py-3 text-base"
                  placeholder="Ex: Estádio Municipal, Quadra do Parque"
                />
              </div>
            </div>
          </template>

          <!-- ── Passo 2: Logo ────────────────────────────────────────── -->
          <template v-if="step === 2">
            <div class="mb-8">
              <p class="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">Passo 3 de 4</p>
              <h2 class="text-3xl font-extrabold text-gray-900 leading-tight">Identidade visual</h2>
              <p class="text-base text-gray-500 mt-3 leading-relaxed">
                Adicione a logo do seu clube. Ela aparece no painel, nos relatórios e no app dos atletas. Você pode adicionar ou alterar depois nas configurações.
              </p>
            </div>

            <div class="flex flex-col items-center gap-5 py-6">
              <BrandAvatarUploader
                :model-value="logoPreview"
                label="Logo do clube"
                shape="square"
                :size="144"
                :placeholder-iniciais="form.nomeClube?.charAt(0)?.toUpperCase() ?? 'A'"
                :allow-remove="!!logoPreview"
                hide-meta
                @confirm="onLogoCropped"
                @remove="removeLogo"
              />
              <p class="text-sm text-gray-500 text-center max-w-xs">
                A imagem será recortada em formato quadrado e salva como PNG 512x512.
              </p>
            </div>
          </template>

          <!-- ── Passo 3: Pronto ──────────────────────────────────────── -->
          <template v-if="step === 3">
            <div class="mb-8">
              <div class="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 ring-4 ring-green-100">
                <svg class="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 class="text-3xl font-extrabold text-gray-900 leading-tight">Tudo configurado!</h2>
              <p class="text-base text-gray-500 mt-3 leading-relaxed">
                Seu clube está pronto no Athletto. Agora você pode cadastrar atletas, criar turmas e controlar frequência e financeiro em um só lugar.
              </p>
            </div>

            <!-- Resumo -->
            <div class="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <div class="flex items-center gap-5 px-6 py-5">
                <div
                  v-if="logoPreview"
                  class="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center shrink-0"
                >
                  <img :src="logoPreview" class="w-full h-full object-contain p-1" />
                </div>
                <div
                  v-else
                  class="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-extrabold shrink-0"
                  style="background-color: #3d5afe;"
                >
                  {{ form.nomeClube?.charAt(0)?.toUpperCase() ?? '?' }}
                </div>
                <div class="min-w-0">
                  <p class="text-lg font-bold text-gray-900 truncate">{{ form.nomeClube }}</p>
                  <p class="text-sm text-gray-500 mt-0.5">
                    {{ form.cidade && form.estado ? `${form.cidade}, ${form.estado}` : 'Localização não informada' }}
                  </p>
                </div>
              </div>
              <div v-if="form.cnpj" class="flex items-center justify-between px-6 py-4">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">CNPJ</span>
                <span class="text-sm font-semibold text-gray-700">{{ form.cnpj }}</span>
              </div>
              <div v-if="form.cep" class="flex items-center justify-between px-6 py-4">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">CEP</span>
                <span class="text-sm font-semibold text-gray-700">{{ form.cep }}</span>
              </div>
              <div v-if="form.local" class="flex items-center justify-between px-6 py-4">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Local de treino</span>
                <span class="text-sm font-semibold text-gray-700 truncate ml-4 text-right">{{ form.local }}</span>
              </div>
              <div class="flex items-center justify-between px-6 py-4">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Logo</span>
                <span class="text-sm font-semibold" :class="logoPreview ? 'text-green-600' : 'text-gray-400'">
                  {{ logoPreview ? 'Enviada' : 'Não enviada' }}
                </span>
              </div>
            </div>
          </template>

        </div>
      </Transition>

      <!-- Rodapé de ações -->
      <div class="px-12 pb-10 flex items-center gap-3">
        <button
          class="btn-ghost shrink-0 w-auto px-5"
          @click="step === 0 ? goToLogin() : prevStep()"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          {{ step === 0 ? 'Login' : 'Voltar' }}
        </button>

        <button
          v-if="step === 2"
          class="btn-ghost shrink-0 w-auto px-5 text-gray-400 border-dashed"
          @click="skipLogo"
        >
          Pular
        </button>

        <button
          v-if="step < STEPS.length - 1"
          class="btn-primary flex-1 py-3"
          :disabled="loading"
          @click="nextStep"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ step === 2 ? 'Salvar e continuar' : 'Continuar' }}
          <svg v-if="!loading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        <button
          v-if="step === STEPS.length - 1"
          class="btn-primary flex-1 py-3"
          @click="finishOnboarding"
        >
          Acessar o painel
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

    </div>

    <!-- Pular -->
    <button
      v-if="step < STEPS.length - 1"
      class="relative mt-6 text-white/50 hover:text-white/80 text-sm transition-colors"
      @click="skipOnboarding"
    >
      Pular configuração por agora
    </button>

    <!-- Toasts -->
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Configurar clube — Athletto' })

const STEPS = [
  { label: 'Clube' },
  { label: 'Localização' },
  { label: 'Logo' },
  { label: 'Pronto' },
]

const step = ref(0)
const direction = ref<'forward' | 'backward'>('forward')
const loading = ref(false)
const cepLoading = ref(false)
const cepOk = ref(false)

const form = reactive({
  nomeClube: '',
  cnpj: '',
  cep: '',
  cidade: '',
  estado: '',
  bairro: '',
  local: '',
})

const errors = reactive({
  nomeClube: '',
  cep: '',
})

// ── Pré-preencher nome do cadastro ───────────────────────────────────────────
onMounted(() => {
  const saved = localStorage.getItem('athletto_onboarding_nome_clube')
  if (saved) form.nomeClube = saved

  const user = useSupabaseUser()
  if (user.value?.user_metadata?.nome_clube) {
    form.nomeClube = user.value.user_metadata.nome_clube
  }
})

// ── Logo ─────────────────────────────────────────────────────────────────────
const logoPreview = ref<string | null>(null)
const logoFile = ref<File | null>(null)

function onLogoCropped(file: File) {
  if (logoPreview.value && logoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoPreview.value)
  }
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

function removeLogo() {
  if (logoPreview.value && logoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoPreview.value)
  }
  logoPreview.value = null
  logoFile.value = null
}

// ── CEP + ViaCEP ─────────────────────────────────────────────────────────────
function onCepInput() {
  const digits = form.cep.replace(/\D/g, '').slice(0, 8)
  form.cep = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
  cepOk.value = false
  errors.cep = ''
  form.cidade = ''
  form.estado = ''
  form.bairro = ''
  if (digits.length === 8) buscarCEP(digits)
}

async function buscarCEP(digits: string) {
  cepLoading.value = true
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await res.json()
    if (data.erro) {
      errors.cep = 'CEP não encontrado. Verifique e tente novamente.'
      return
    }
    form.cidade = data.localidade ?? ''
    form.estado = data.uf ?? ''
    form.bairro = data.bairro ?? ''
    cepOk.value = true
  } catch {
    errors.cep = 'Não foi possível buscar o CEP. Verifique sua conexão.'
  } finally {
    cepLoading.value = false
  }
}

// ── CNPJ formatting ──────────────────────────────────────────────────────────
function formatCNPJ() {
  const v = form.cnpj.replace(/\D/g, '').slice(0, 14)
  if (v.length <= 2) { form.cnpj = v; return }
  if (v.length <= 5) { form.cnpj = `${v.slice(0,2)}.${v.slice(2)}`; return }
  if (v.length <= 8) { form.cnpj = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`; return }
  if (v.length <= 12) { form.cnpj = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`; return }
  form.cnpj = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`
}

// ── Validação ─────────────────────────────────────────────────────────────────
function validateField(field: string) {
  if (field === 'nomeClube') errors.nomeClube = form.nomeClube.trim().length < 2 ? 'Informe o nome do clube.' : ''
  if (field === 'cep') errors.cep = form.cep.replace(/\D/g, '').length < 8 ? 'Informe um CEP válido.' : ''
}

function validateStep(): boolean {
  if (step.value === 0) {
    validateField('nomeClube')
    return !errors.nomeClube
  }
  if (step.value === 1) {
    validateField('cep')
    return !errors.cep && !!form.cidade
  }
  return true
}

// ── Navegação ─────────────────────────────────────────────────────────────────
function nextStep() {
  if (!validateStep()) return
  direction.value = 'forward'
  step.value++
}

function prevStep() {
  direction.value = 'backward'
  step.value--
}

function skipLogo() {
  direction.value = 'forward'
  step.value++
}

function goToStep(i: number) {
  direction.value = i < step.value ? 'backward' : 'forward'
  step.value = i
}

function goToLogin() {
  if (process.client) window.location.href = '/login'
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

function skipOnboarding() {
  if (process.client) {
    localStorage.setItem('athletto_onboarding_done', '1')
    window.location.href = '/'
  }
}

async function finishOnboarding() {
  if (loading.value) return

  loading.value = true
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const toast = useToast()

  if (!user.value) {
    toast.error('Sessão expirada', 'Faça login novamente.')
    loading.value = false
    if (process.client) window.location.href = '/login'
    return
  }

  try {
    // Gera slug \u00fanico tentando variantes incrementais.
    // O SELECT pr\u00e9vio funciona porque a policy de SELECT em clubes \u00e9 avaliada
    // por linha e simplesmente retorna 0 quando o slug n\u00e3o existe (sem 403).
    const baseSlug = gerarSlug(form.nomeClube)
    let slug = baseSlug
    let tentativa = 0
    while (tentativa < 5) {
      const { data: existe } = await supabase
        .from('clubes')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!existe) break
      tentativa++
      slug = `${baseSlug}-${tentativa}`
    }

    const nomeGestor =
      (user.value.user_metadata as any)?.nome ??
      user.value.email?.split('@')[0] ??
      'Gestor'

    // Cria clube + gestor de forma at\u00f4mica via RPC SECURITY DEFINER.
    // Necess\u00e1rio porque o usu\u00e1rio rec\u00e9m-autenticado ainda n\u00e3o tem gestor,
    // ent\u00e3o as policies de SELECT em `clubes` (que dependem de current_clube_id())
    // bloqueiam o RETURNING do INSERT direto.
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      'onboarding_criar_clube_gestor',
      {
        p_nome_clube: form.nomeClube.trim(),
        p_slug: slug,
        p_cnpj: form.cnpj || null,
        p_modalidade: 'Futebol',
        p_email_clube: user.value.email ?? null,
        p_nome_gestor: nomeGestor,
        p_email_gestor: user.value.email!,
        p_email_verificado: !!user.value.email_confirmed_at,
      },
    )

    if (rpcErr) throw rpcErr
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
    const clubeId = (row?.out_clube_id ?? row?.clube_id) as string | undefined
    if (!clubeId) throw new Error('Falha ao criar clube/gestor (sem retorno)')

    if (logoFile.value) {
      try {
        const path = `${clubeId}/logo.png`
        const { error: upErr } = await supabase.storage
          .from('logos')
          .upload(path, logoFile.value, { upsert: true, cacheControl: '60', contentType: 'image/png' })
        if (!upErr) {
          const { data: pub } = supabase.storage.from('logos').getPublicUrl(path)
          const urlComCacheBust = `${pub.publicUrl}?v=${Date.now()}`
          await supabase
            .from('clubes')
            .update({ logo_url: urlComCacheBust })
            .eq('id', clubeId)
        }
      } catch (e) {
        console.warn('[onboarding] upload da logo falhou:', e)
      }
    }

    if (process.client) {
      localStorage.setItem('athletto_onboarding_done', '1')
      localStorage.removeItem('athletto_onboarding_nome_clube')
      // Sinaliza ao layout para iniciar o tour guiado do sidebar
      // assim que o painel renderizar (primeiro acesso real).
      localStorage.setItem('athletto_sidebar_tour_pending', '1')
    }

    toast.success('Tudo pronto!', 'Bem-vindo ao Athletto.')
    if (process.client) window.location.href = '/'
  } catch (err: any) {
    console.error('[onboarding]', err)
    toast.error('Não foi possível concluir', err?.message ?? 'Tente novamente.')
    loading.value = false
  }
}
</script>

<script lang="ts">
import { defineComponent, h } from 'vue'
const FieldError = defineComponent({
  props: { msg: String },
  setup(p) {
    return () => p.msg
      ? h('p', { class: 'mt-2 text-xs text-red-500 flex items-center gap-1.5' }, [
          h('svg', { class: 'w-3 h-3 shrink-0', fill: 'currentColor', viewBox: '0 0 20 20' }, [
            h('path', { 'fill-rule': 'evenodd', d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z', 'clip-rule': 'evenodd' }),
          ]),
          p.msg,
        ])
      : null
  },
})
export { FieldError }
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.22s ease;
}
.slide-left-enter-from  { opacity: 0; transform: translateX(28px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-28px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-28px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(28px); }
</style>
