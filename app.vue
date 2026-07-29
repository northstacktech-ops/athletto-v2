<template>
  <!-- Barra de progresso no topo a cada navegação: feedback imediato ao clicar,
       mesmo quando a próxima tela ainda está montando/buscando dados. -->
  <NuxtLoadingIndicator :height="3" color="#264edb" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { init } = useTheme()
onMounted(init)
</script>
