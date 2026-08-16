<template>
  <div class="min-h-screen bg-surface-canvas dark:bg-surface-canvas-dark" />
</template>

<script setup lang="ts">
// /upgrade não é mais uma tela própria — virou o LayoutPlanoBloqueadoModal,
// renderizado globalmente em layouts/default.vue quando o trial/plano está
// bloqueado. Esta rota sobrevive só como redirecionamento leve pra não
// quebrar links antigos (e-mail, favoritos) que ainda apontem pra /upgrade:
// manda pro Painel, e o modal aparece por conta própria se ainda houver
// bloqueio (motivo é recalculado do estado real, não lido da query string).
definePageMeta({ layout: false })

await navigateTo('/')
</script>
