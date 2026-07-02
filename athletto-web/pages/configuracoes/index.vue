<template>
  <div class="space-y-4 animate-fade-in">

    <div>
      <h1 class="page-title">Configurações</h1>
      <p class="page-description">
        Ajuste seu clube, gestores e assinatura
      </p>
    </div>

    <!-- Abas -->
    <UiTabsPill v-model="aba" :tabs="tabs" />

    <!-- Conteúdo por aba -->
    <ConfiguracoesEquipe v-if="aba === 'equipe'"/>
    <ConfiguracoesResponsavel v-else-if="aba === 'responsavel'"/>
    <ConfiguracoesAssinatura v-else-if="aba === 'assinatura'"/>
    <ConfiguracoesPagamentos v-else-if="aba === 'pagamentos'"/>
    <ConfiguracoesGestores v-else-if="aba === 'gestores'"/>
    <ConfiguracoesAcessos v-else-if="aba === 'acessos'"/>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Configurações — Athletto' })

const route = useRoute()
const router = useRouter()

type TabValue = 'equipe' | 'responsavel' | 'gestores' | 'acessos' | 'assinatura' | 'pagamentos'

const tabs: { value: TabValue; label: string }[] = [
  { value: 'equipe',       label: 'Equipe / Clube' },
  { value: 'responsavel',  label: 'Responsável' },
  { value: 'gestores',     label: 'Gestores' },
  { value: 'pagamentos',   label: 'Pagamentos' },
  { value: 'acessos',      label: 'Acessos & Segurança' },
  { value: 'assinatura',   label: 'Assinatura' },
]

const hashToTab: Record<string, TabValue> = {
  '#equipe': 'equipe', '#responsavel': 'responsavel',
  '#gestores': 'gestores', '#pagamentos': 'pagamentos',
  '#acessos': 'acessos', '#assinatura': 'assinatura',
}

// Inicia sempre em 'equipe' (igual no SSR e na hidratação) e só lê o hash
// depois de montar — evita descompasso de hidratação (SSR sem hash vs cliente).
const aba = ref<TabValue>('equipe')

onMounted(() => {
  const h = hashToTab[route.hash]
  if (h) aba.value = h
})

watch(aba, (v) => {
  router.replace({ hash: `#${v}` })
})
</script>
