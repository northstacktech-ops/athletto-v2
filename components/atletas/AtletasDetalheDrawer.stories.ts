import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AtletasDetalheDrawer from './AtletasDetalheDrawer.vue'
import type { Atleta, Turma } from '~/types'

// Recebe atleta/turmas via props, mas busca frequência/vínculos reais ao
// montar (useAtletas/useFrequencia) — sem sessão real essas listas vêm vazias;
// o cabeçalho e as abas usam só os dados passados por prop.
const meta = {
  title: 'Atletas/AtletasDetalheDrawer',
  component: AtletasDetalheDrawer,
  tags: ['autodocs'],
} satisfies Meta<typeof AtletasDetalheDrawer>

export default meta
type Story = StoryObj<typeof meta>

const atleta: Atleta = {
  id: 'atleta-1',
  clube_id: 'clube-1',
  nome: 'João Pedro Silva',
  apelido: 'Joãozinho',
  cpf: '12345678900',
  data_nascimento: '2010-05-12',
  telefone: null,
  telefone_responsavel: '11999998888',
  email: null,
  foto_url: null,
  numero_camisa: '10',
  posicao: 'Meia',
  status: 'titular',
  saude: 'saudavel',
  tipo_sanguineo: 'O+',
  historico_lesoes: [],
  observacoes_medicas: null,
  data_entrada: '2023-02-01',
  ativo: true,
  app_primeiro_acesso: false,
  valor_mensalidade: null,
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString(),
}

const turmas: Turma[] = [{
  id: 'turma-1',
  clube_id: 'clube-1',
  nome: 'Sub-15 Manhã',
  descricao: null,
  dias_semana: [1, 3, 5],
  horario_inicio: '08:00:00',
  horario_fim: '09:30:00',
  local: 'Campo Principal',
  ativo: true,
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString(),
}]

export const Padrao: Story = {
  args: { atleta, turmas },
}
