import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ConfiguracoesAcessos from './ConfiguracoesAcessos.vue'

// Lê/atualiza a sessão real via useSupabaseUser()/useSupabaseClient() — sem
// login no Storybook, mostra "entrou agora" como fallback do último acesso.
const meta = {
  title: 'Configuracoes/ConfiguracoesAcessos',
  component: ConfiguracoesAcessos,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfiguracoesAcessos>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
