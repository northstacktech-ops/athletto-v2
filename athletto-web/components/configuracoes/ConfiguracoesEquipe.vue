<template>
  <div class="space-y-4">

    <!-- Logo + plano -->
    <div class="card-base p-5 shadow-card">
      <div class="flex items-center gap-4 flex-wrap">

        <BrandAvatarUploader
          :model-value="form.logo_url"
          label="Logo do clube"
          shape="square"
          :size="96"
          :uploading="uploadingLogo"
          :placeholder-iniciais="iniciais"
          :allow-remove="!!form.logo_url"
          hide-meta
          @confirm="onLogoUpload"
          @remove="onLogoRemove"
        />

        <!-- Informações do clube e plano -->
        <div class="flex-1 min-w-[160px] space-y-1.5">
          <p class="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{{ form.nome || 'Meu clube' }}</p>

          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded-md text-xs font-bold capitalize" :class="planoBadge">
              {{ clube?.plano ?? 'free' }}
            </span>
            <span v-if="trial.isTrial.value && trial.daysLeft.value !== null" class="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {{ trial.daysLeft.value }} dias de trial restantes
            </span>
          </div>

          <NuxtLink
            to="/configuracoes#assinatura"
            class="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            Gerenciar assinatura
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Identidade -->
    <div class="card-base shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Identidade do clube</h2>
        <p class="text-xs text-slate-500 mt-0.5">Aparece para responsáveis e atletas</p>
      </div>
      <div class="px-5 py-4 space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do clube *</label>
          <input v-model="form.nome" maxlength="80" class="form-input"/>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Slug (URL pública)</label>
            <div class="flex items-stretch">
              <span class="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-white/[0.02] text-xs text-slate-500">athletto.com/cadastro/</span>
              <input v-model="form.slug" maxlength="40" class="form-input rounded-l-none"/>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Modalidade</label>
            <input v-model="form.modalidade" maxlength="40" class="form-input" placeholder="Futebol, Vôlei..."/>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
            <input v-model="form.cnpj" maxlength="20" class="form-input" placeholder="00.000.000/0000-00"/>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
            <input v-model="form.telefone" type="tel" maxlength="20" class="form-input"/>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input v-model="form.email" type="email" maxlength="120" class="form-input"/>
          </div>
        </div>
      </div>
    </div>

    <!-- Link público -->
    <div class="rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-white/[0.02] p-4">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-brand-700 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-slate-900 dark:text-white">Link público de cadastro</p>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate font-mono">{{ linkPublico }}</p>
        </div>
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-surface-elevated-dark text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.10] hover:bg-slate-50 shrink-0" @click="copiarLink">
          {{ copiado ? 'Copiado!' : 'Copiar' }}
        </button>
      </div>
    </div>

    <!-- Footer salvar -->
    <div class="sticky bottom-4 bg-white dark:bg-surface-elevated-dark border border-slate-200 dark:border-white/[0.10] rounded-xl p-3 flex items-center justify-between shadow-card">
      <p v-if="dirty" class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>
        Alterações não salvas
      </p>
      <p v-else class="text-xs text-slate-500">Tudo salvo</p>

      <div class="flex gap-2">
        <button v-if="dirty" class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05]" @click="reset">
          Descartar
        </button>
        <button :disabled="!dirty || salvando" class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors" @click="salvar">
          {{ salvando ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'
import type { Clube } from '~/types'

const { clube, carregarPerfil } = useAuth()
const clubeComp = useClube()
const trial = useTrial()
const toast = useToast()

const salvando = ref(false)
const uploadingLogo = ref(false)
const copiado = ref(false)

const original = ref({ ...(clube.value ?? {}) } as Partial<Clube>)
const form = reactive({
  nome: clube.value?.nome ?? '',
  slug: clube.value?.slug ?? '',
  modalidade: clube.value?.modalidade ?? '',
  cnpj: clube.value?.cnpj ?? '',
  telefone: clube.value?.telefone ?? '',
  email: clube.value?.email ?? '',
  logo_url: clube.value?.logo_url ?? null as string | null,
})

watch(() => clube.value, (c) => {
  if (!c) return
  original.value = { ...c }
  Object.assign(form, {
    nome: c.nome, slug: c.slug, modalidade: c.modalidade ?? '',
    cnpj: c.cnpj ?? '', telefone: c.telefone ?? '', email: c.email ?? '',
    logo_url: c.logo_url,
  })
}, { immediate: true, deep: true })

const dirty = computed(() => {
  const o = original.value as any
  return form.nome !== o.nome ||
    form.slug !== o.slug ||
    form.modalidade !== (o.modalidade ?? '') ||
    form.cnpj !== (o.cnpj ?? '') ||
    form.telefone !== (o.telefone ?? '') ||
    form.email !== (o.email ?? '') ||
    form.logo_url !== o.logo_url
})

const iniciais = computed(() => getIniciais(form.nome || 'A'))

const planoBadge = computed(() => {
  switch (clube.value?.plano) {
    case 'basico': return 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300'
    case 'intermediario': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'profissional': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    default: return 'bg-gray-100 text-gray-700'
  }
})

const linkPublico = computed(() => {
  const slug = form.slug || 'seu-clube'
  if (process.client) return `${window.location.origin}/cadastro/${slug}`
  return `https://athletto.com/cadastro/${slug}`
})

function reset() {
  const o = original.value as any
  Object.assign(form, {
    nome: o.nome, slug: o.slug, modalidade: o.modalidade ?? '',
    cnpj: o.cnpj ?? '', telefone: o.telefone ?? '', email: o.email ?? '',
    logo_url: o.logo_url,
  })
}

async function onLogoUpload(file: File) {
  uploadingLogo.value = true
  try {
    const { url, error } = await clubeComp.salvarLogo(file)
    if (error || !url) {
      toast.error('Falha no upload', error?.message ?? 'Tente novamente.')
      return
    }
    form.logo_url = url
    original.value = { ...(clube.value ?? {}) } as Partial<Clube>
    toast.success('Logo atualizada')
  } finally {
    uploadingLogo.value = false
  }
}

async function onLogoRemove() {
  uploadingLogo.value = true
  try {
    const { error } = await clubeComp.atualizar({ logo_url: null })
    if (error) {
      toast.error('Falha ao remover', error.message)
      return
    }
    await carregarPerfil()
    form.logo_url = null
    original.value = { ...(clube.value ?? {}) } as Partial<Clube>
    toast.success('Logo removida')
  } finally {
    uploadingLogo.value = false
  }
}

async function salvar() {
  if (!dirty.value) return
  salvando.value = true
  try {
    const { error } = await clubeComp.atualizar({
      nome: form.nome.trim(),
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      modalidade: form.modalidade || null,
      cnpj: form.cnpj || null,
      telefone: form.telefone || null,
      email: form.email || null,
      logo_url: form.logo_url,
    })
    if (error) throw error
    // Recarrega o perfil para sincronizar o clube reativo com os novos dados
    await carregarPerfil()
    original.value = { ...(clube.value ?? {}) } as Partial<Clube>
    toast.success('Configurações salvas')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    salvando.value = false
  }
}

async function copiarLink() {
  if (!process.client) return
  await navigator.clipboard.writeText(linkPublico.value)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 1500)
}
</script>

