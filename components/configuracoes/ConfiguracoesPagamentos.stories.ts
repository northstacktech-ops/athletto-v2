import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ConfiguracoesPagamentos from './ConfiguracoesPagamentos.vue'

// Consulta o status real da subconta ValidaPay via useEquipe() ao montar —
// sem sessão/dado real, cai no formulário de cadastro (fluxo "conectar conta").
const meta = {
  title: 'Configuracoes/ConfiguracoesPagamentos',
  component: ConfiguracoesPagamentos,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfiguracoesPagamentos>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
