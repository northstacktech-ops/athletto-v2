import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import BarChart from './BarChart.vue'

const meta = {
  title: 'UI/BarChart',
  component: BarChart,
  tags: ['autodocs'],
} satisfies Meta<typeof BarChart>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    data: [
      { mes: 'Jan', receita: 12000, despesa: 8000 },
      { mes: 'Fev', receita: 14500, despesa: 8600 },
      { mes: 'Mar', receita: 13200, despesa: 9100 },
      { mes: 'Abr', receita: 16800, despesa: 9800 },
      { mes: 'Mai', receita: 18400, despesa: 10200 },
      { mes: 'Jun', receita: 21000, despesa: 11000 },
    ],
  },
}
