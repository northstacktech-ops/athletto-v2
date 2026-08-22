import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FrequenciaRegistrar from './FrequenciaRegistrar.vue'
import type { Turma } from '~/types'

// A lista de atletas/presenças do dia vem de useFrequencia() ao montar — sem
// sessão real, mostra "Nenhum treino agendado para hoje".
const meta = {
  title: 'Frequencia/FrequenciaRegistrar',
  component: FrequenciaRegistrar,
  tags: ['autodocs'],
} satisfies Meta<typeof FrequenciaRegistrar>

export default meta
type Story = StoryObj<typeof meta>

const turmas: Turma[] = [
  { id: 'turma-1', clube_id: 'clube-1', nome: 'Sub-15 Manhã', descricao: null, dias_semana: [1, 3, 5], horario_inicio: '08:00:00', horario_fim: '09:30:00', local: null, ativo: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
]

export const Padrao: Story = {
  args: { turmas },
}
