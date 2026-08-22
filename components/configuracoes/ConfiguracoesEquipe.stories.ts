import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ConfiguracoesEquipe from './ConfiguracoesEquipe.vue'

// Formulário de identidade do clube (nome, slug, logo) — lê/grava via
// useAuth()/useClube(). Sem sessão real os campos vêm vazios.
const meta = {
  title: 'Configuracoes/ConfiguracoesEquipe',
  component: ConfiguracoesEquipe,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfiguracoesEquipe>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
