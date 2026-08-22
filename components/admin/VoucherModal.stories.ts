import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import VoucherModal from './VoucherModal.vue'
import type { Clube } from '~/types'

const meta = {
  title: 'Admin/VoucherModal',
  component: VoucherModal,
  tags: ['autodocs'],
} satisfies Meta<typeof VoucherModal>

export default meta
type Story = StoryObj<typeof meta>

const clube: Clube = {
  id: 'clube-1',
  nome: 'Athletto FC',
  slug: 'athletto-fc',
  modalidade: 'Futebol',
  cnpj: null,
  telefone: null,
  email: null,
  logo_url: null,
  plano: 'intermediario',
  plano_ativo: true,
  conta_demonstracao: false,
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString(),
}

export const Padrao: Story = {
  args: { clube },
}
