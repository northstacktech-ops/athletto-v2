import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import NotificationBell from './NotificationBell.vue'

// A lista de notificações vem de useNotifications() (Supabase) — sem sessão
// real no Storybook, o sino aparece sem contagem/itens. O visual do botão e
// do dropdown (aberto/fechado) continuam demonstráveis.
const meta = {
  title: 'Layout/NotificationBell',
  component: NotificationBell,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['light', 'dark'] },
  },
} satisfies Meta<typeof NotificationBell>

export default meta
type Story = StoryObj<typeof meta>

export const Claro: Story = {
  args: { variant: 'light' },
}

export const Escuro: Story = {
  args: { variant: 'dark' },
  render: (args) => ({
    components: { NotificationBell },
    setup() {
      return { args }
    },
    template: `<div class="bg-slate-900 p-4 inline-block"><NotificationBell v-bind="args" /></div>`,
  }),
}
