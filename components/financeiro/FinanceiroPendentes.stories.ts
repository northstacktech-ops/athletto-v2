import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroPendentes from './FinanceiroPendentes.vue'

// Cobranças reais via useFinanceiro().listarCobranças() ao montar — sem
// sessão real, mostra "Nada nesse filtro".
const meta = {
  title: 'Financeiro/FinanceiroPendentes',
  component: FinanceiroPendentes,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroPendentes>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
