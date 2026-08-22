import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TabsPill from './TabsPill.vue'

const meta = {
  title: 'UI/TabsPill',
  component: TabsPill,
  tags: ['autodocs'],
} satisfies Meta<typeof TabsPill>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    modelValue: 'ativos',
    tabs: [
      { value: 'ativos', label: 'Ativos' },
      { value: 'inativos', label: 'Inativos' },
      { value: 'todos', label: 'Todos' },
    ],
  },
  render: (args) => ({
    components: { TabsPill },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `<TabsPill v-bind="args" v-model="value" />`,
  }),
}

export const ComContadores: Story = {
  args: {
    modelValue: 'pendentes',
    tabs: [
      { value: 'pendentes', label: 'Pendentes', badge: 12 },
      { value: 'pagas', label: 'Pagas', badge: 48 },
      { value: 'atrasadas', label: 'Atrasadas', badge: 3 },
    ],
  },
  render: (args) => ({
    components: { TabsPill },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `<TabsPill v-bind="args" v-model="value" />`,
  }),
}
