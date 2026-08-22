import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroCarteira from './FinanceiroCarteira.vue'

// Saldo/extrato/saques vêm de useCarteira() (ValidaPay + Supabase) — sem
// sessão real cai no card "Conta de recebimento não configurada".
const meta = {
  title: 'Financeiro/FinanceiroCarteira',
  component: FinanceiroCarteira,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroCarteira>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
