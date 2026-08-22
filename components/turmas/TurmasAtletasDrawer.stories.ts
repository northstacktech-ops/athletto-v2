import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TurmasAtletasDrawer from './TurmasAtletasDrawer.vue'
import type { Turma } from '~/types'

// Busca a lista completa de atletas e vínculos via useAtletas()/Supabase ao
// montar — sem sessão real, a lista vem vazia (mostra o empty state real).
const meta = {
  title: 'Turmas/TurmasAtletasDrawer',
  component: TurmasAtletasDrawer,
  tags: ['autodocs'],
} satisfies Meta<typeof TurmasAtletasDrawer>

export default meta
type Story = StoryObj<typeof meta>

const turma: Turma = {
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
}

export const Padrao: Story = {
  args: { turma },
}
