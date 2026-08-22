import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ConfiguracoesAssinatura from './ConfiguracoesAssinatura.vue'

// Lê plano/trial do clube via useAuth()/useTrial() — sem sessão real mostra
// o plano "Base" (fallback) e o comparativo de planos completo (esse não
// depende de dados do clube, então renderiza igual ao ambiente real).
const meta = {
  title: 'Configuracoes/ConfiguracoesAssinatura',
  component: ConfiguracoesAssinatura,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfiguracoesAssinatura>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
