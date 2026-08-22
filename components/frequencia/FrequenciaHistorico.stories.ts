import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FrequenciaHistorico from './FrequenciaHistorico.vue'
import type { Turma } from '~/types'

// A matriz de presença é buscada via useFrequencia() ao trocar de turma —
// sem sessão real, mostra "Sem registros" após selecionar a turma.
const meta = {
  title: 'Frequencia/FrequenciaHistorico',
  component: FrequenciaHistorico,
  tags: ['autodocs'],
} satisfies Meta<typeof FrequenciaHistorico>

export default meta
type Story = StoryObj<typeof meta>

const turmas: Turma[] = [
  { id: 'turma-1', clube_id: 'clube-1', nome: 'Sub-15 Manhã', descricao: null, dias_semana: [1, 3, 5], horario_inicio: '08:00:00', horario_fim: '09:30:00', local: null, ativo: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'turma-2', clube_id: 'clube-1', nome: 'Sub-17 Tarde', descricao: null, dias_semana: [2, 4], horario_inicio: '14:00:00', horario_fim: '15:30:00', local: null, ativo: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
]

export const Padrao: Story = {
  args: { turmas },
}

export const SemTurmas: Story = {
  args: { turmas: [] },
}
