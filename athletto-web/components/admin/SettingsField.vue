<template>
  <UiSettingsField :label="label" :descricao="descricao">
    <slot />
  </UiSettingsField>
</template>

<script setup lang="ts">
defineProps<{ label: string; descricao?: string }>()
</script>
