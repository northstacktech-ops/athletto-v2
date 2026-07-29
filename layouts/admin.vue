<template>
  <div class="flex min-h-screen bg-surface-canvas dark:bg-surface-canvas-dark">

    <!-- Sidebar admin (desktop) -->
    <AdminSidebar :expanded="expanded" @toggle="toggleSidebar" />

    <!-- Drawer mobile -->
    <AdminMobileDrawer />

    <!-- Main area -->
    <div
      class="flex-1 flex flex-col min-h-screen transition-all duration-300"
      :class="expanded ? 'lg:pl-[280px]' : 'lg:pl-[64px]'"
    >
      <AdminTopbar />

      <main class="flex-1">
        <div class="px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
          <slot />
        </div>
      </main>
    </div>

    <!-- Toasts -->
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
const { carregarSuperAdmin } = useAdminAuth()
await carregarSuperAdmin()

// ── Sidebar state ─────────────────────────────────────────────
const expanded = ref(true)

onMounted(() => {
  const stored = localStorage.getItem('admin_sidebar_expanded')
  if (stored !== null) expanded.value = stored === 'true'
})

function toggleSidebar() {
  expanded.value = !expanded.value
  localStorage.setItem('admin_sidebar_expanded', String(expanded.value))
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>
