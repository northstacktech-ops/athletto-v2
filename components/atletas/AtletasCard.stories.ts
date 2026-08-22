import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AtletasCard from './AtletasCard.vue'
import type { Atleta } from '~/types'

const meta = {
  title: 'Atletas/AtletasCard',
  component: AtletasCard,
  tags: ['autodocs'],
} satisfies Meta<typeof AtletasCard>

export default meta
type Story = StoryObj<typeof meta>

function mockAtleta(overrides: Partial<Atleta> = {}): Atleta {
  return {
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
    tipo_sanguineo: null,
    historico_lesoes: [],
    observacoes_medicas: null,
    data_entrada: '2023-02-01',
    ativo: true,
    app_primeiro_acesso: true,
    valor_mensalidade: null,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    ...overrides,
  }
}

export const Titular: Story = {
  args: { atleta: mockAtleta() },
}

export const Lesionado: Story = {
  args: { atleta: mockAtleta({ nome: 'Carlos Mendes', status: 'afastado', saude: 'lesionado', numero_camisa: '7' }) },
}

export const Inativo: Story = {
  args: { atleta: mockAtleta({ nome: 'Rafael Souza', ativo: false, status: 'novato' }) },
}
