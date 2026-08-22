import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroCaixinhas from './FinanceiroCaixinhas.vue'

// Lista real via useFinanceiro().listarCaixinhas() ao montar — sem sessão
// real, mostra o empty state "Sem caixinhas".
const meta = {
  title: 'Financeiro/FinanceiroCaixinhas',
  component: FinanceiroCaixinhas,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroCaixinhas>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
