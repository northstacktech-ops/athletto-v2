import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroSaqueModal from './FinanceiroSaqueModal.vue'

const meta = {
  title: 'Financeiro/FinanceiroSaqueModal',
  component: FinanceiroSaqueModal,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroSaqueModal>

export default meta
type Story = StoryObj<typeof meta>

export const ComSaldo: Story = {
  args: { saldoDisponivel: 4820.5 },
}

export const SemInformacaoDeSaldo: Story = {
  args: { saldoDisponivel: null },
}
