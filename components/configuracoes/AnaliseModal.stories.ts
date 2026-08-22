import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AnaliseModal from './AnaliseModal.vue'

const meta = {
  title: 'Configuracoes/AnaliseModal',
  component: AnaliseModal,
  tags: ['autodocs'],
} satisfies Meta<typeof AnaliseModal>

export default meta
type Story = StoryObj<typeof meta>

export const Aberto: Story = {
  args: { open: true },
}
