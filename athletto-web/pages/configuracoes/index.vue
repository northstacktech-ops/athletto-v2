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
    <ConfiguracoesGestores v-else-if="aba === 'gestores'"/>
    <ConfiguracoesAcessos v-else-if="aba === 'acessos'"/>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Configurações — Athletto' })

const route = useRoute()
const router = useRouter()

type TabValue = 'equipe' | 'responsavel' | 'gestores' | 'acessos' | 'assinatura'

const tabs: { value: TabValue; label: string }[] = [
  { value: 'equipe',       label: 'Equipe / Clube' },
  { value: 'responsavel',  label: 'Responsável' },
  { value: 'gestores',     label: 'Gestores' },
  { value: 'acessos',      label: 'Acessos & Segurança' },
  { value: 'assinatura',   label: 'Assinatura' },
]

const hashToTab: Record<string, TabValue> = {
  '#equipe': 'equipe', '#responsavel': 'responsavel',
  '#gestores': 'gestores', '#acessos': 'acessos', '#assinatura': 'assinatura',
}

const aba = ref<TabValue>(hashToTab[route.hash] ?? 'equipe')

watch(aba, (v) => {
  router.replace({ hash: `#${v}` })
})
</script>
