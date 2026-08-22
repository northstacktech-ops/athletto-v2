import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroEntradaModal from './FinanceiroEntradaModal.vue'

// Carrega caixinhas/atletas reais via useFinanceiro()/useAtletas() ao montar
// — sem sessão real, os selects de vínculo aparecem vazios ("Nenhum").
const meta = {
  title: 'Financeiro/FinanceiroEntradaModal',
  component: FinanceiroEntradaModal,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroEntradaModal>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
