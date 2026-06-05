<template>
  <div class="space-y-4">
    <UiSettingsSection titulo="Foto do responsável" descricao="Aparece no topo da tela e no menu lateral. Recortada em formato quadrado 512x512.">
      <div class="py-4">
        <BrandAvatarUploader
          :model-value="gestor?.foto_url"
          label="Foto de perfil"
          shape="circle"
          :size="112"
          :uploading="uploadingFoto"
          :placeholder-iniciais="iniciais"
          :allow-remove="!!gestor?.foto_url"
          @confirm="onFotoUpload"
          @remove="onFotoRemove"
        />
      </div>
    </UiSettingsSection>

    <UiSettingsSection titulo="Dados pessoais" descricao="Informações do responsável legal pelo clube.">
      <UiSettingsField label="Nome completo">
        <input v-model="form.nome" type="text" maxlength="120" class="form-input"/>
      </UiSettingsField>
      <UiSettingsField label="E-mail" descricao="Usado para login e notificações.">
        <input v-model="form.email" type="email" maxlength="120" class="form-input" disabled/>
      </UiSettingsField>
      <UiSettingsField label="Telefone / WhatsApp">
        <input v-model="form.telefone" type="tel" maxlength="20" class="form-input" placeholder="(11) 99999-9999"/>
      </UiSettingsField>
      <UiSettingsField label="CPF" descricao="Usado em comprovantes fiscais.">
        <input v-model="form.cpf" type="text" maxlength="14" class="form-input" placeholder="000.000.000-00"/>
      </UiSettingsField>
      <div class="py-4 flex justify-end">
        <button
          :disabled="!dirty || salvando"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors"
          @click="salvar"
        >
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </UiSettingsSection>
  </div>
</template>

<script setup lang="ts">
import { getIniciais } from '~/utils/format'

const { gestor } = useAuth()
const gestorComp = useGestor()
const toast = useToast()

const salvando = ref(false)
const uploadingFoto = ref(false)

const form = reactive({
  nome: gestor.value?.nome ?? '',
  email: gestor.value?.email ?? '',
  telefone: gestor.value?.telefone ?? '',
  cpf: gestor.value?.cpf ?? '',
})

const original = ref({ ...form })

watch(() => gestor.value, (g) => {
  if (!g) return
  Object.assign(form, {
    nome: g.nome,
    email: g.email,
    telefone: g.telefone ?? '',
    cpf: g.cpf ?? '',
  })
  original.value = { ...form }
}, { immediate: false, deep: true })

const dirty = computed(
  () =>
    form.nome !== original.value.nome ||
    form.telefone !== original.value.telefone ||
    form.cpf !== original.value.cpf,
)

const iniciais = computed(() => getIniciais(form.nome || gestor.value?.nome || 'G'))

async function salvar() {
  if (!dirty.value) return
  salvando.value = true
  try {
    const { error } = await gestorComp.atualizar({
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      cpf: form.cpf || '',
    })
    if (error) throw error
    original.value = { ...form }
    toast.success('Dados atualizados')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    salvando.value = false
  }
}

async function onFotoUpload(file: File) {
  uploadingFoto.value = true
  try {
    const { error } = await gestorComp.salvarFoto(file)
    if (error) {
      toast.error('Falha no upload', error.message)
      return
    }
    toast.success('Foto atualizada')
  } finally {
    uploadingFoto.value = false
  }
}

async function onFotoRemove() {
  uploadingFoto.value = true
  try {
    const { error } = await gestorComp.removerFoto()
    if (error) {
      toast.error('Falha ao remover', error.message)
      return
    }
    toast.success('Foto removida')
  } finally {
    uploadingFoto.value = false
  }
}
</script>
