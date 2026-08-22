import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import KpiPastel from './KpiPastel.vue'

const meta = {
  title: 'UI/KpiPastel',
  component: KpiPastel,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: ['brand', 'violet', 'amber', 'emerald', 'slate', 'rose'] },
    trend: { control: 'select', options: ['up', 'down', 'neutral'] },
    density: { control: 'select', options: ['comfortable', 'compact'] },
  },
} satisfies Meta<typeof KpiPastel>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    label: 'Receita do mês',
    value: 'R$ 18.420,00',
    tone: 'brand',
    delta: '+12% vs. mês anterior',
    trend: 'up',
  },
}

export const Compacto: Story = {
  args: {
    label: 'Atletas ativos',
    value: 128,
    tone: 'emerald',
    delta: '+4 este mês',
    trend: 'up',
    density: 'compact',
  },
}

export const TendenciaNegativa: Story = {
  args: {
    label: 'Inadimplência',
    value: 'R$ 2.150,00',
    tone: 'rose',
    delta: '+8% vs. mês anterior',
    trend: 'down',
  },
}

export const GradeDeCores: Story = {
  args: { label: 'Métrica', value: '42' },
  render: () => ({
    components: { KpiPastel },
    setup() {
      const tones = ['brand', 'violet', 'amber', 'emerald', 'slate', 'rose'] as const
      return { tones }
    },
    template: `
      <div class="grid grid-cols-3 gap-3 max-w-2xl">
        <KpiPastel v-for="t in tones" :key="t" :label="t" :value="'R$ 1.234'" :tone="t" density="compact" />
      </div>
    `,
  }),
}
