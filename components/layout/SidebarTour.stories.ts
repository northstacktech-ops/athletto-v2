import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import SidebarTour from './SidebarTour.vue'

// Tour fixo do produto (7 passos, um por item do menu real) — no Storybook os
// alvos data-tour="painel|atletas|..." não existem, então o overlay abre sem
// destaque de elemento (fallback central). Estrutura de conteúdo/copy é a real.
const meta = {
  title: 'Layout/SidebarTour',
  component: SidebarTour,
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarTour>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  render: () => ({
    components: { SidebarTour },
    template: `<SidebarTour ref="tourRef" />`,
    mounted() {
      ;(this as any).$refs.tourRef?.start?.(true)
    },
  }),
}
