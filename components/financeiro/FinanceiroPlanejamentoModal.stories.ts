import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroPlanejamentoModal from './FinanceiroPlanejamentoModal.vue'

// Wizard de 3 passos; a etapa 2 carrega turmas reais via useTurmas() ao
// montar — sem sessão real vem vazia, mas a etapa 1 (configuração) é
// totalmente demonstrável sem dados externos.
const meta = {
  title: 'Financeiro/FinanceiroPlanejamentoModal',
  component: FinanceiroPlanejamentoModal,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroPlanejamentoModal>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
