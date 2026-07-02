<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="lg:hidden fixed inset-0 z-50 flex" @click.self="open = false">
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="open = false" />

        <aside class="relative w-[280px] flex flex-col" style="background-color: #0b0d12;">
          <div class="flex items-center justify-between h-[64px] px-5 shrink-0">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider"
                    style="background-color: #ccff00; color: #0b0d12;">ADMIN</span>
              <span class="text-base font-bold text-white">Athletto</span>
            </div>
            <button class="p-2 -mr-2 text-white/60 hover:text-white" @click="open = false">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <nav class="flex-1 overflow-y-auto px-5 py-3 space-y-1">
            <AdminSidebarItem
              v-for="item in items"
              :key="item.to"
              :item="item"
              :collapsed="false"
              @click="open = false"
            />
          </nav>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const open = useState('admin_drawer_open', () => false)

// Fecha o drawer com Esc
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const items = [
  { label: 'Visão geral', to: '/admin', icon: 'dashboard', exact: true },
  { label: 'Clubes', to: '/admin/clubes', icon: 'athletes' },
  { label: 'Assinaturas', to: '/admin/assinaturas', icon: 'billing' },
  { label: 'Vouchers', to: '/admin/vouchers', icon: 'gift' },
  { label: 'Indicações', to: '/admin/indicacoes', icon: 'support' },
  { label: 'Financeiro', to: '/admin/financeiro', icon: 'frequency' },
  { label: 'Webhooks', to: '/admin/webhooks', icon: 'calendar' },
  { label: 'Auditoria', to: '/admin/auditoria', icon: 'groups' },
  { label: 'Configurações', to: '/admin/configuracoes', icon: 'settings' },
]
</script>
