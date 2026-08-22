import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AtletasFormModal from './AtletasFormModal.vue'
import type { Turma } from '~/types'

const meta = {
  title: 'Atletas/AtletasFormModal',
  component: AtletasFormModal,
  tags: ['autodocs'],
} satisfies Meta<typeof AtletasFormModal>

export default meta
type Story = StoryObj<typeof meta>

function mockTurma(overrides: Partial<Turma> = {}): Turma {
  return {
    id: 'turma-1',
    clube_id: 'clube-1',
    nome: 'Sub-15 Manhã',
    descricao: null,
    dias_semana: [1, 3, 5],
    horario_inicio: '08:00:00',
    horario_fim: '09:30:00',
    local: 'Campo Principal',
    ativo: true,
    icone: 'soccer',
    cor: 'brand',
    valor_mensalidade_padrao: 150,
    dia_vencimento_mensalidade: 10,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    total_atletas: 18,
    ...overrides,
  }
}

export const NovoAtleta: Story = {
  args: { atleta: null, turmas: [mockTurma(), mockTurma({ id: 'turma-2', nome: 'Sub-17 Tarde' })] },
}
