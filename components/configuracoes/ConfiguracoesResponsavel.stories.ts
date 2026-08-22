import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ConfiguracoesResponsavel from './ConfiguracoesResponsavel.vue'

// Lê/grava dados do gestor logado via useAuth()/useGestor() — sem sessão
// real os campos vêm vazios.
const meta = {
  title: 'Configuracoes/ConfiguracoesResponsavel',
  component: ConfiguracoesResponsavel,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfiguracoesResponsavel>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
