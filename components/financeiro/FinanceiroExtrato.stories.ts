import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroExtrato from './FinanceiroExtrato.vue'

// Transações reais via useFinanceiro().listarTransacoes() ao montar — sem
// sessão real, mostra a tabela vazia ("Sem transações") com filtros funcionais.
const meta = {
  title: 'Financeiro/FinanceiroExtrato',
  component: FinanceiroExtrato,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroExtrato>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
