import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import PlanoBloqueadoModal from './PlanoBloqueadoModal.vue'

// Modal não-dispensável de billing: só abre quando useTrial() indica trial
// vencido/conta suspensa/cancelada em uma rota não-isenta. Sem sessão real no
// Storybook, `open` fica false e nada aparece — documentado de propósito,
// já que esse gate depende inteiramente de estado de assinatura no servidor.
const meta = {
  title: 'Layout/PlanoBloqueadoModal',
  component: PlanoBloqueadoModal,
  tags: ['autodocs'],
} satisfies Meta<typeof PlanoBloqueadoModal>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
