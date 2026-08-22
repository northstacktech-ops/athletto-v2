import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AdminSidebarItem from './AdminSidebarItem.vue'

const meta = {
  title: 'Admin/AdminSidebarItem',
  component: AdminSidebarItem,
  tags: ['autodocs'],
} satisfies Meta<typeof AdminSidebarItem>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    item: { label: 'Clubes', to: '/admin/clubes', icon: 'athletes' },
    collapsed: false,
  },
  render: (args) => ({
    components: { AdminSidebarItem },
    setup() {
      return { args }
    },
    template: `<div style="background-color:#0b0d12" class="p-3 w-64"><AdminSidebarItem v-bind="args" /></div>`,
  }),
}

export const ComAlerta: Story = {
  args: {
    item: { label: 'Webhooks', to: '/admin/webhooks', icon: 'calendar', dot: true, dotVariant: 'warning' },
    collapsed: false,
  },
  render: (args) => ({
    components: { AdminSidebarItem },
    setup() {
      return { args }
    },
    template: `<div style="background-color:#0b0d12" class="p-3 w-64"><AdminSidebarItem v-bind="args" /></div>`,
  }),
}
