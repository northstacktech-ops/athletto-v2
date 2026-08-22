import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import CalendarioEventoDetalhe from './CalendarioEventoDetalhe.vue'
import type { Turma, Atleta, EventoCalendario } from '~/types'

const meta = {
  title: 'Calendario/CalendarioEventoDetalhe',
  component: CalendarioEventoDetalhe,
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarioEventoDetalhe>

export default meta
type Story = StoryObj<typeof meta>

const turmas: Turma[] = [
  { id: 'turma-1', clube_id: 'clube-1', nome: 'Sub-15 Manhã', descricao: null, dias_semana: [1, 3, 5], horario_inicio: '08:00:00', horario_fim: '09:30:00', local: 'Campo Principal', ativo: true, icone: 'soccer', criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
]

const atletas: Atleta[] = [
  { id: 'atleta-1', clube_id: 'clube-1', nome: 'João Pedro Silva', apelido: null, cpf: '12345678900', data_nascimento: null, telefone: null, telefone_responsavel: null, email: null, foto_url: null, numero_camisa: '10', posicao: 'Meia', status: 'titular', saude: 'saudavel', tipo_sanguineo: null, historico_lesoes: [], observacoes_medicas: null, data_entrada: '2023-01-01', ativo: true, app_primeiro_acesso: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
]

const eventoJogo: EventoCalendario = {
  id: 'evento-1',
  clube_id: 'clube-1',
  titulo: 'Jogo amistoso vs ABC FC',
  descricao: 'Amistoso de preparação para o campeonato regional.',
  tipo: 'evento',
  data_inicio: `${new Date().toISOString().slice(0, 10)}T15:00:00`,
  data_fim: `${new Date().toISOString().slice(0, 10)}T16:30:00`,
  turma_id: 'turma-1',
  turma_ids: ['turma-1'],
  atleta_ids: ['atleta-1'],
  criado_por: null,
  criado_em: new Date().toISOString(),
}

const eventoTreino: EventoCalendario = {
  ...eventoJogo,
  id: 'treino-turma-1',
  titulo: 'Treino Sub-15',
  tipo: 'treino',
  descricao: null,
}

export const Evento: Story = {
  args: { evento: eventoJogo, turmas, atletas },
}

export const TreinoGeradoDaTurma: Story = {
  args: { evento: eventoTreino, turmas, atletas },
}
