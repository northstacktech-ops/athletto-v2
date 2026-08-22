import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import SidebarItem from './SidebarItem.vue'

const meta = {
  title: 'Layout/SidebarItem',
  component: SidebarItem,
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarItem>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    item: { label: 'Atletas', to: '/atletas', icon: 'athletes' },
    collapsed: false,
  },
  render: (args) => ({
    components: { SidebarItem },
    setup() {
      return { args }
    },
    template: `<div class="bg-slate-900 p-3 w-64"><SidebarItem v-bind="args" /></div>`,
  }),
}

export const ComBadge: Story = {
  args: {
    item: { label: 'Cobranças', to: '/financeiro', icon: 'billing', badge: 3, badgeVariant: 'warning' },
    collapsed: false,
  },
  render: (args) => ({
    components: { SidebarItem },
    setup() {
      return { args }
    },
    template: `<div class="bg-slate-900 p-3 w-64"><SidebarItem v-bind="args" /></div>`,
  }),
}

export const Colapsado: Story = {
  args: {
    item: { label: 'Turmas', to: '/turmas', icon: 'groups', dot: true, dotVariant: 'warning' },
    collapsed: true,
  },
  render: (args) => ({
    components: { SidebarItem },
    setup() {
      return { args }
    },
    template: `<div class="bg-slate-900 p-3 w-20"><SidebarItem v-bind="args" /></div>`,
  }),
}
