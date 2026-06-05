<template>
  <button
    v-if="isTrial && daysLeft !== null"
    type="button"
    class="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 transition-colors"
    title="Upgrade do plano"
    @click="goToUpgrade"
  >
    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.09 12.97 3.55 13.6c-.06.07-.1.15-.13.23a.94.94 0 0 0 0 .68c.03.08.07.16.13.23.13.16.32.26.54.26h6.5l-1.59 7.93c-.05.27.05.55.27.71.21.16.51.18.74.04l.13-.09.04-.04 8.96-10.97.54-.63a.94.94 0 0 0 .13-.23.94.94 0 0 0 0-.68.94.94 0 0 0-.13-.23.94.94 0 0 0-.54-.26h-6.5L13.43 2.4c.05-.27-.05-.55-.27-.71-.21-.16-.51-.18-.74-.04l-.13.09-.04.04L13 2z"/>
    </svg>
    <span>{{ daysLeft }}d trial</span>
  </button>
</template>

<script setup lang="ts">
const { isTrial, daysLeft } = useTrial()

function goToUpgrade() {
  // Placeholder: navegar pra página de upgrade (TODO)
  navigateTo('/configuracoes')
}
</script>
