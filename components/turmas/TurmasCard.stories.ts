import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TurmasCard from './TurmasCard.vue'
import type { Turma } from '~/types'

const meta = {
  title: 'Turmas/TurmasCard',
  component: TurmasCard,
  tags: ['autodocs'],
} satisfies Meta<typeof TurmasCard>

export default meta
type Story = StoryObj<typeof meta>

function mockTurma(overrides: Partial<Turma & { total_atletas?: number }> = {}): Turma & { total_atletas?: number } {
  return {
    id: 'turma-1',
    clube_id: 'clube-1',
    nome: 'Sub-15 Manhã',
    descricao: 'Treinos técnicos e físicos, foco em fundamentos.',
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

export const Padrao: Story = {
  args: { turma: mockTurma() },
}

export const Inativa: Story = {
  args: { turma: mockTurma({ nome: 'Sub-11 (encerrada)', ativo: false, cor: 'slate' as any }) },
}
