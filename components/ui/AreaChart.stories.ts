import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AreaChart from './AreaChart.vue'

const meta = {
  title: 'UI/AreaChart',
  component: AreaChart,
  tags: ['autodocs'],
} satisfies Meta<typeof AreaChart>

export default meta
type Story = StoryObj<typeof meta>

const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']

export const Padrao: Story = {
  args: {
    labels,
    series: [
      { name: 'Receita', data: [12000, 14500, 13200, 16800, 18400, 21000], color: '#4171f1' },
    ],
  },
}

export const DuasSeries: Story = {
  args: {
    labels,
    series: [
      { name: 'Receita', data: [12000, 14500, 13200, 16800, 18400, 21000], color: '#4171f1' },
      { name: 'Despesa', data: [8000, 8600, 9100, 9800, 10200, 11000], color: '#f87171' },
    ],
  },
}

export const FormatoNumero: Story = {
  args: {
    labels,
    series: [
      { name: 'Atletas ativos', data: [80, 92, 101, 110, 118, 128], color: '#22c55e' },
    ],
    format: 'number',
  },
}
