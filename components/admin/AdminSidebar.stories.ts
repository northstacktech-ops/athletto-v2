import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AdminSidebar from './AdminSidebar.vue'

// Depende de useAdminAuth()/useAdminDashboard() (sessão de superadmin) — sem
// sessão real mostra "Superadmin" genérico e badges zerados.
const meta = {
  title: 'Admin/AdminSidebar',
  component: AdminSidebar,
  tags: ['autodocs'],
} satisfies Meta<typeof AdminSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Expandida: Story = {
  args: { expanded: true },
  render: (args) => ({
    components: { AdminSidebar },
    setup() {
      return { args }
    },
    template: `<div class="relative h-[600px]"><AdminSidebar v-bind="args" /></div>`,
  }),
}

export const Colapsada: Story = {
  args: { expanded: false },
  render: (args) => ({
    components: { AdminSidebar },
    setup() {
      return { args }
    },
    template: `<div class="relative h-[600px]"><AdminSidebar v-bind="args" /></div>`,
  }),
}
