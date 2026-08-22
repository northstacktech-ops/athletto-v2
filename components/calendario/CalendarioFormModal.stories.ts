import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import CalendarioFormModal from './CalendarioFormModal.vue'
import type { Turma, Atleta } from '~/types'

const meta = {
  title: 'Calendario/CalendarioFormModal',
  component: CalendarioFormModal,
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarioFormModal>

export default meta
type Story = StoryObj<typeof meta>

const turmas: Turma[] = [
  { id: 'turma-1', clube_id: 'clube-1', nome: 'Sub-15 Manhã', descricao: null, dias_semana: [1, 3, 5], horario_inicio: '08:00:00', horario_fim: '09:30:00', local: 'Campo Principal', ativo: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'turma-2', clube_id: 'clube-1', nome: 'Sub-17 Tarde', descricao: null, dias_semana: [2, 4], horario_inicio: '14:00:00', horario_fim: '15:30:00', local: 'Quadra 2', ativo: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
]

const atletas: Atleta[] = [
  { id: 'atleta-1', clube_id: 'clube-1', nome: 'João Pedro Silva', apelido: null, cpf: '12345678900', data_nascimento: null, telefone: null, telefone_responsavel: null, email: null, foto_url: null, numero_camisa: '10', posicao: 'Meia', status: 'titular', saude: 'saudavel', tipo_sanguineo: null, historico_lesoes: [], observacoes_medicas: null, data_entrada: '2023-01-01', ativo: true, app_primeiro_acesso: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'atleta-2', clube_id: 'clube-1', nome: 'Maria Souza', apelido: null, cpf: '98765432100', data_nascimento: null, telefone: null, telefone_responsavel: null, email: null, foto_url: null, numero_camisa: '7', posicao: 'Atacante', status: 'novato', saude: 'saudavel', tipo_sanguineo: null, historico_lesoes: [], observacoes_medicas: null, data_entrada: '2023-06-01', ativo: true, app_primeiro_acesso: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
]

export const NovoEvento: Story = {
  args: { evento: null, dataInicial: new Date().toISOString().slice(0, 10), turmas, atletas },
}
