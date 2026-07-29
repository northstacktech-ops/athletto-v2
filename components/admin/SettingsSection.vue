<template>
  <UiSettingsSection :titulo="titulo" :descricao="descricao">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
    <slot />
  </UiSettingsSection>
</template>

<script setup lang="ts">
defineProps<{ titulo: string; descricao?: string }>()
</script>
