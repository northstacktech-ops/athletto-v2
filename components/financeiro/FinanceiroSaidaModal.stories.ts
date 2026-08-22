import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroSaidaModal from './FinanceiroSaidaModal.vue'

const meta = {
  title: 'Financeiro/FinanceiroSaidaModal',
  component: FinanceiroSaidaModal,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroSaidaModal>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
