import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import Sidebar from './Sidebar.vue'

// Sem sessão real, os itens condicionados a permissão (temPermissao) e o
// atalho de superadmin não aparecem — o visual/estrutura seguem demonstráveis.
const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Expandida: Story = {
  args: { expanded: true },
  render: (args) => ({
    components: { Sidebar },
    setup() {
      return { args }
    },
    template: `<div class="relative h-[600px]"><Sidebar v-bind="args" /></div>`,
  }),
}

export const Colapsada: Story = {
  args: { expanded: false },
  render: (args) => ({
    components: { Sidebar },
    setup() {
      return { args }
    },
    template: `<div class="relative h-[600px]"><Sidebar v-bind="args" /></div>`,
  }),
}
