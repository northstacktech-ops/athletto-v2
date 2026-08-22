import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FinanceiroDashboard from './FinanceiroDashboard.vue'

// Todos os gráficos (ECharts) vêm de RPCs reais via useFinanceiro()/useDashboard()
// ao montar — sem sessão real, os KPIs ficam zerados e os gráficos mostram os
// empty states ("Sem despesas", "Sem caixinhas", "Sem cobranças").
const meta = {
  title: 'Financeiro/FinanceiroDashboard',
  component: FinanceiroDashboard,
  tags: ['autodocs'],
} satisfies Meta<typeof FinanceiroDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
