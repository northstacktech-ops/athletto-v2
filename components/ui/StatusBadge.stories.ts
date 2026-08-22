import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import StatusBadge from './StatusBadge.vue'

const meta = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'success', 'error', 'warning', 'info', 'neutral',
        'titular', 'novato', 'selecionado', 'afastado',
        'saudavel', 'lesionado', 'em_recuperacao',
        'ativo', 'inativo', 'encerrado',
        'pendente', 'pago', 'isento', 'cancelado',
        'paid', 'unpaid', 'overdue',
      ],
    },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: { variant: 'success', dot: true },
}

export const SemPonto: Story = {
  args: { variant: 'pendente', dot: false },
}

export const StatusDeAtleta: Story = {
  args: { variant: 'titular' },
  render: (args) => ({
    components: { StatusBadge },
    setup() {
      return { variants: ['titular', 'novato', 'selecionado', 'afastado'] as const }
    },
    template: `
      <div class="flex flex-wrap gap-2">
        <StatusBadge v-for="v in variants" :key="v" :variant="v" dot />
      </div>
    `,
  }),
}

export const StatusDeCobranca: Story = {
  args: { variant: 'pendente' },
  render: () => ({
    components: { StatusBadge },
    setup() {
      return { variants: ['pago', 'pendente', 'isento', 'cancelado'] as const }
    },
    template: `
      <div class="flex flex-wrap gap-2">
        <StatusBadge v-for="v in variants" :key="v" :variant="v" dot />
      </div>
    `,
  }),
}
