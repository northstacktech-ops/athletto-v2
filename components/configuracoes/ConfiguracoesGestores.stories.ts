import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ConfiguracoesGestores from './ConfiguracoesGestores.vue'

// Lista de gestores + logs via useEquipe() (Supabase) — sem sessão real vem
// vazio, mas a UI (cabeçalho, modal de convite, permissões por módulo)
// renderiza normalmente.
const meta = {
  title: 'Configuracoes/ConfiguracoesGestores',
  component: ConfiguracoesGestores,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfiguracoesGestores>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
