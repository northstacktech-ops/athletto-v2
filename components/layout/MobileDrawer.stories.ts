import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import MobileDrawer from './MobileDrawer.vue'

// Abre via atributo data-hs-overlay (Preline JS) — fora de uma página real do
// app o toggle por botão externo não dispara, mas a estrutura/nav renderiza.
const meta = {
  title: 'Layout/MobileDrawer',
  component: MobileDrawer,
  tags: ['autodocs'],
} satisfies Meta<typeof MobileDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  render: () => ({
    components: { MobileDrawer },
    template: `<div class="w-[280px]"><MobileDrawer /></div>`,
  }),
}
