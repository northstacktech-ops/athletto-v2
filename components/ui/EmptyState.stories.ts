import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import EmptyState from './EmptyState.vue'

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    title: 'Nenhum atleta cadastrado',
    description: 'Cadastre o primeiro atleta desta turma para começar a controlar frequência e mensalidade.',
  },
}

export const Compacto: Story = {
  args: {
    title: 'Nenhum resultado',
    description: 'Tente ajustar os filtros de busca.',
    size: 'sm',
  },
}

export const ComAcao: Story = {
  args: {
    title: 'Nenhuma cobrança encontrada',
    description: 'Ainda não há cobranças geradas para este período.',
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args }
    },
    template: `
      <EmptyState v-bind="args">
        <template #action>
          <button type="button" class="btn-primary">Gerar cobrança</button>
        </template>
      </EmptyState>
    `,
  }),
}
