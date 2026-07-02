<template>
  <button
    type="button"
    title="Alternar tema"
    class="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors"
    style="background-color: rgba(255,255,255,0.18);"
    @click="handleToggle"
  >
    <!-- Sol: modo escuro ativo → clica para modo claro -->
    <svg v-if="isDark" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="currentColor" stroke="none"/>
    </svg>
    <!-- Lua: modo claro ativo → clica para modo escuro -->
    <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
const { isDark, toggle } = useTheme()

function handleToggle() {
  toggle()
}
</script>
